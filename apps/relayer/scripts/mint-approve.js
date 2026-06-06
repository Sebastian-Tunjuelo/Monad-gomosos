#!/usr/bin/env node
/**
 * mint-approve.js
 *
 * Calls GameToken.mint() to give the user 1000 ARENA,
 * then calls GameToken.approve(SessionManager, maxUint256)
 * so the SessionManager can pull tokens for BUY_ITEM.
 *
 * Uses the Anvil account 0 (or DEPLOYER_PRIVATE_KEY from env)
 * as the player wallet for local testing.
 *
 * Usage:
 *   node scripts/mint-approve.js
 *
 * Prerequisites:
 *   - Anvil running
 *   - Contracts deployed  (pnpm deploy:local)
 *   - .env files set up   (pnpm setup:local)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  maxUint256,
  formatEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { localhost } from "viem/chains";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");

// ── 1. Load addresses from deploy report ────────────────────────────────────

const chainId = process.env.CHAIN_ID ?? "31337";
const reportPath = path.join(ROOT, "reports", `deploy-${chainId}.json`);

if (!fs.existsSync(reportPath)) {
  console.error(`\n✗  Deploy report not found: ${reportPath}`);
  console.error("   Run pnpm deploy:local first.\n");
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const GAME_TOKEN = report.GameToken;
const SESSION_MANAGER = report.SessionManager;

// ── 2. Wallet setup ──────────────────────────────────────────────────────────

const pk =
  process.env.DEPLOYER_PRIVATE_KEY ??
  // Default Anvil account 0 — local dev only
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const account = privateKeyToAccount(pk);
const rpcUrl = process.env.MONAD_RPC_URL ?? "http://127.0.0.1:8545";

const publicClient = createPublicClient({
  chain: localhost,
  transport: http(rpcUrl),
});
const walletClient = createWalletClient({
  account,
  chain: localhost,
  transport: http(rpcUrl),
});

// ── 3. ABIs ──────────────────────────────────────────────────────────────────

const ERC20_ABI = parseAbi([
  "function mint() external",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
]);

// ── 4. Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n━━━ mint-approve.js ━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Account        : ${account.address}`);
  console.log(`GameToken      : ${GAME_TOKEN}`);
  console.log(`SessionManager : ${SESSION_MANAGER}`);
  console.log(`RPC            : ${rpcUrl}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // ── Balance before ─────────────────────────────────────────────────────────
  const balBefore = await publicClient.readContract({
    address: GAME_TOKEN,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account.address],
  });
  console.log(`Balance before : ${formatEther(balBefore)} ARENA`);

  // ── Mint ───────────────────────────────────────────────────────────────────
  console.log("\nCalling GameToken.mint()...");
  const mintHash = await walletClient.writeContract({
    address: GAME_TOKEN,
    abi: ERC20_ABI,
    functionName: "mint",
  });
  await publicClient.waitForTransactionReceipt({ hash: mintHash });
  console.log(`✓  mint tx: ${mintHash}`);

  // ── Balance after mint ─────────────────────────────────────────────────────
  const balAfter = await publicClient.readContract({
    address: GAME_TOKEN,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account.address],
  });
  console.log(`Balance after  : ${formatEther(balAfter)} ARENA`);

  // ── Approve ────────────────────────────────────────────────────────────────
  console.log("\nCalling GameToken.approve(SessionManager, maxUint256)...");
  const approveHash = await walletClient.writeContract({
    address: GAME_TOKEN,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [SESSION_MANAGER, maxUint256],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });
  console.log(`✓  approve tx: ${approveHash}`);

  // ── Allowance check ────────────────────────────────────────────────────────
  const allowance = await publicClient.readContract({
    address: GAME_TOKEN,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [account.address, SESSION_MANAGER],
  });
  console.log(
    `\nAllowance      : ${allowance === maxUint256 ? "Unlimited (max)" : formatEther(allowance) + " ARENA"}`,
  );

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Done. The wallet is ready for BUY_ITEM.

  NOTE: In the actual demo flow, the user's MetaMask
  wallet must also call approve() before creating a
  session. You can do this from the frontend once a
  "Mint & Approve" button is added, or by running
  this script with the user's private key:

    DEPLOYER_PRIVATE_KEY=0x<user_pk> node scripts/mint-approve.js
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch((err) => {
  console.error("\n✗  Error:", err.message ?? err);
  process.exit(1);
});
