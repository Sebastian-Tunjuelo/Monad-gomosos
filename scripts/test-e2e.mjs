/**
 * test-e2e.mjs
 * End-to-end integration test for Monad Session Arena (testnet)
 *
 * Tests:
 *  1. GET  /health                      — relayer up & connected to chain
 *  2. GET  /social/feed                 — reads on-chain posts
 *  3. GET  /social/leaderboard          — reads on-chain leaderboard
 *  4. GET  /social/live-events          — reads on-chain events
 *  5. POST /sessions/register (bad)     — validation: missing fields → 400
 *  6. POST /sessions/execute  (bad)     — validation: missing fields → 400
 *  7. POST /sessions/register (on-chain) — creates real session on Monad testnet
 *  8. GET  /sessions/:id/nonce          — reads nonce from contract
 *  9. POST /sessions/execute (MOVE)     — executes on-chain action via session key
 * 10. GET  /sessions/:id/dashboard      — confirms action stored in DB
 * 11. POST /sessions/revoke             — revokes session in DB
 * 12. POST /sessions/execute (revoked)  — must be rejected
 *
 * Run: node scripts/test-e2e.mjs
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  toBytes,
  toHex,
  randomBytes,
} from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { monadTestnet } from "viem/chains";

// ── Config ────────────────────────────────────────────────────────────────────
const RELAYER_URL = "http://localhost:3001";
const SESSION_MANAGER = "0xeC499f99c9Fbf6C6699110634b486B1c01538312";
const DEMO_GAME       = "0x18D73Ae1Fff59bBD0D362d9273A2E12aFB92EB25";
const GAME_TOKEN      = "0xBE62364FCaD5eC0681cD2baBF95350fE2336F17C";
const CHAIN_ID        = 10143;

// Owner wallet — the deployer/relayer key already in .env (has MON for gas)
const OWNER_PRIVATE_KEY = "0xfc56c2b09f6140d72fed77dbf09805b005211195308b49cf1e7030124751a1bb";
const ownerAccount = privateKeyToAccount(OWNER_PRIVATE_KEY);

// Ephemeral session key (generated fresh for this test run)
const sessionPrivKey = generatePrivateKey();
const sessionAccount = privateKeyToAccount(sessionPrivKey);

// EIP-712 domain
const domain = {
  name: "MonadSessionArena",
  version: "1",
  chainId: CHAIN_ID,
  verifyingContract: SESSION_MANAGER,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function log(label, ok, detail = "") {
  const icon = ok ? "✅" : "❌";
  console.log(`  ${icon}  ${label}${detail ? `  →  ${detail}` : ""}`);
  ok ? passed++ : failed++;
}

async function api(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${RELAYER_URL}${path}`, opts);
  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

// ── EIP-712 helpers ──────────────────────────────────────────────────────────
const sessionGrantTypes = {
  SessionGrant: [
    { name: "owner",          type: "address" },
    { name: "sessionKey",     type: "address" },
    { name: "validUntil",     type: "uint48"  },
    { name: "maxCalls",       type: "uint32"  },
    { name: "gameContract",   type: "address" },
    { name: "allowedActions", type: "uint16"  },
    { name: "token",          type: "address" },
    { name: "maxTokenSpend",  type: "uint256" },
    { name: "salt",           type: "bytes32" },
  ],
};

const sessionActionTypes = {
  SessionAction: [
    { name: "sessionId",  type: "bytes32" },
    { name: "nonce",      type: "uint256" },
    { name: "actionId",   type: "uint16"  },
    { name: "paramsHash", type: "bytes32" },
    { name: "deadline",   type: "uint48"  },
  ],
};

// ── Tests ─────────────────────────────────────────────────────────────────────
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  Monad Session Arena — E2E Test Suite");
console.log(`  Chain: Monad Testnet (${CHAIN_ID})`);
console.log(`  Owner:       ${ownerAccount.address}`);
console.log(`  Session key: ${sessionAccount.address}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// 1. Health check
console.log("── 1. Health check ──────────────────────────────────────────");
{
  const { status, data } = await api("GET", "/health");
  log("status 200", status === 200, `status=${status}`);
  log("rpc ok", data.checks?.rpc === "ok", data.checks?.rpc);
  log("sessionManager ok", data.checks?.sessionManager === "ok", data.checks?.sessionManager);
  log(`chain ID ${CHAIN_ID}`, data.chainId === CHAIN_ID, `chainId=${data.chainId}`);
  log("blockNumber present", !!data.blockNumber, `block=${data.blockNumber}`);
  log("rpcLatency < 3000ms", data.rpcLatencyMs < 3000, `${data.rpcLatencyMs}ms`);
  console.log();
}

// 2. Social feed
console.log("── 2. Social feed ───────────────────────────────────────────");
{
  const { status, data } = await api("GET", "/social/feed");
  log("status 200", status === 200);
  log("posts array", Array.isArray(data.posts), `count=${data.totalPosts}`);
  if (data.posts?.length > 0) {
    const p = data.posts[0];
    log("post has author", !!p.author, p.author?.slice(0, 10) + "…");
    log("post has content", typeof p.content === "string", `"${p.content?.slice(0, 30)}"`);
  }
  console.log();
}

// 3. Leaderboard
console.log("── 3. Leaderboard ───────────────────────────────────────────");
{
  const { status, data } = await api("GET", "/social/leaderboard");
  log("status 200", status === 200);
  log("players array", Array.isArray(data.players), `count=${data.players?.length}`);
  log("blockNumber present", !!data.blockNumber, `block=${data.blockNumber}`);
  console.log();
}

// 4. Live events
console.log("── 4. Live events ───────────────────────────────────────────");
{
  const { status, data } = await api("GET", "/social/live-events");
  log("status 200", status === 200);
  log("events array", Array.isArray(data.events));
  log("totals present", typeof data.totalCreated === "number", `created=${data.totalCreated} executed=${data.totalExecuted} revoked=${data.totalRevoked}`);
  console.log();
}

// 5. Validation — register missing fields
console.log("── 5. Validation: register missing fields ───────────────────");
{
  const { status, data } = await api("POST", "/sessions/register", { foo: "bar" });
  log("400 on missing fields", status === 400, `status=${status}`);
  log("error message present", !!data.error, data.error);
  console.log();
}

// 6. Validation — execute missing fields
console.log("── 6. Validation: execute missing fields ────────────────────");
{
  const { status, data } = await api("POST", "/sessions/execute", { foo: "bar" });
  log("400 on missing fields", status === 400, `status=${status}`);
  log("error message present", !!data.error, data.error);
  console.log();
}

// 7. Create session on-chain
console.log("── 7. Create session on-chain ───────────────────────────────");
const validUntil = Math.floor(Date.now() / 1000) + 3600; // 1 hour
const salt = toHex(randomBytes(32));
const policy = {
  owner:          ownerAccount.address,
  sessionKey:     sessionAccount.address,
  validUntil,
  maxCalls:       30,
  gameContract:   DEMO_GAME,
  allowedActions: 0xFFFF, // all actions
  token:          GAME_TOKEN,
  maxTokenSpend:  "0",
  salt,
};

let sessionId;
{
  const ownerSignature = await ownerAccount.signTypedData({
    domain,
    types: sessionGrantTypes,
    primaryType: "SessionGrant",
    message: {
      ...policy,
      validUntil:     Number(policy.validUntil),
      maxCalls:       Number(policy.maxCalls),
      allowedActions: Number(policy.allowedActions),
      maxTokenSpend:  BigInt(policy.maxTokenSpend),
    },
  });

  console.log(`  Sending createSession tx to Monad testnet…`);
  const { status, data } = await api("POST", "/sessions/register", {
    policy,
    ownerSignature,
  });

  log("status 200", status === 200, `status=${status}`);
  log("success true", data.success === true, JSON.stringify(data).slice(0, 80));
  log("sessionId returned", !!data.sessionId, data.sessionId?.slice(0, 18) + "…");
  log("txHash returned", !!data.hash, data.hash?.slice(0, 18) + "…");
  sessionId = data.sessionId;
  console.log();
}

if (!sessionId) {
  console.log("  ⚠️  Skipping on-chain tests — session creation failed.\n");
} else {
  // 8. Get nonce from contract
  console.log("── 8. Read nonce from contract ──────────────────────────────");
  {
    const { status, data } = await api("GET", `/sessions/${sessionId}/nonce`);
    log("status 200", status === 200);
    log("nonce is 0 (fresh session)", data.nonce === 0, `nonce=${data.nonce}`);
    console.log();
  }

  // 9. Execute MOVE action (actionId = 1)
  console.log("── 9. Execute MOVE action on-chain ──────────────────────────");
  const ACTION_MOVE = 1;
  const deadline = Math.floor(Date.now() / 1000) + 300;
  // params: ABI-encode (uint8 direction=0, uint16 distance=1)
  const params = encodeAbiParameters(
    parseAbiParameters("uint8 direction, uint16 distance"),
    [0, 1]
  );
  const paramsHash = keccak256(params);

  const actionMsg = {
    sessionId,
    nonce:      0n,
    actionId:   ACTION_MOVE,
    paramsHash,
    deadline,
  };

  const actionSignature = await sessionAccount.signTypedData({
    domain,
    types: sessionActionTypes,
    primaryType: "SessionAction",
    message: actionMsg,
  });

  {
    console.log(`  Sending executeAction tx to Monad testnet…`);
    const { status, data } = await api("POST", "/sessions/execute", {
      action: {
        sessionId,
        nonce:      "0",
        actionId:   ACTION_MOVE,
        paramsHash,
        deadline,
      },
      params,
      signature: actionSignature,
    });
    log("status 200", status === 200, `status=${status}`);
    log("success true", data.success === true, JSON.stringify(data).slice(0, 80));
    log("txHash returned", !!data.hash, data.hash?.slice(0, 18) + "…");
    console.log();
  }

  // 10. Dashboard
  console.log("── 10. Session dashboard ─────────────────────────────────────");
  {
    const { status, data } = await api("GET", `/sessions/${sessionId}/dashboard`);
    log("status 200", status === 200);
    log("session present", !!data.session, `owner=${data.session?.owner?.slice(0,10)}…`);
    log("totalActions >= 1", data.totalActions >= 1, `totalActions=${data.totalActions}`);
    log("actions array present", Array.isArray(data.actions), `len=${data.actions?.length}`);
    if (data.actions?.length > 0) {
      log("action has txHash", !!data.actions[0].txHash, data.actions[0].txHash?.slice(0,18) + "…");
    }
    console.log();
  }

  // 11. Revoke session
  console.log("── 11. Revoke session ────────────────────────────────────────");
  {
    const { status, data } = await api("POST", "/sessions/revoke", { sessionId });
    log("status 200", status === 200);
    log("success true", data.success === true);
    console.log();
  }

  // 12. Execute after revoke — must be rejected
  console.log("── 12. Execute after revoke (must fail) ─────────────────────");
  {
    const { status, data } = await api("POST", "/sessions/execute", {
      action: {
        sessionId,
        nonce:    "1",
        actionId: ACTION_MOVE,
        paramsHash,
        deadline,
      },
      params,
      signature: actionSignature,
    });
    log("rejected (400)", status === 400, `status=${status}`);
    log("error is 'revoked'", data.error?.toLowerCase().includes("revok"), data.error);
    console.log();
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`  Results: ${passed} passed  |  ${failed} failed  |  ${passed + failed} total`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
if (failed > 0) process.exit(1);
