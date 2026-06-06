import { publicClient, walletClient, relayerAccount, configuredChainId } from "../chain/viem.js";
import { db } from "../db/db.js";
import { logger } from "../utils/logger.js";

// ── Monad gas helpers ─────────────────────────────────────────────────────────
// On Monad, users pay for gas_limit (not gas used).
// Always set a tight, accurate gas limit — an inflated limit costs real MON.
// We use a 10% buffer (minimum recommended) instead of the default wallet behaviour
// which can fall back to much higher estimates.
const MONAD_TESTNET_CHAIN_ID = 10143;
const isMonad = () => configuredChainId === MONAD_TESTNET_CHAIN_ID;

/**
 * Add a 10% buffer to a gas estimate.
 * On Monad: gas_paid = gas_limit × price_per_gas  →  tight limits save users money.
 * On Anvil: no real cost, but we keep the same logic for consistency.
 */
function tightGasLimit(estimate: bigint): bigint {
  return estimate + estimate / 10n; // +10%
}

export const SessionManagerABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "bytes32", name: "sessionId", type: "bytes32" },
          { internalType: "uint256", name: "nonce", type: "uint256" },
          { internalType: "uint16", name: "actionId", type: "uint16" },
          { internalType: "bytes32", name: "paramsHash", type: "bytes32" },
          { internalType: "uint48", name: "deadline", type: "uint48" },
        ],
        internalType: "struct SessionTypes.SessionAction",
        name: "action",
        type: "tuple",
      },
      { internalType: "bytes", name: "params", type: "bytes" },
      { internalType: "bytes", name: "signature", type: "bytes" },
    ],
    name: "executeAction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "sessionId", type: "bytes32" }],
    name: "sessionStates",
    outputs: [
      { internalType: "uint32", name: "callCount", type: "uint32" },
      { internalType: "uint256", name: "tokenSpent", type: "uint256" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
      { internalType: "bool", name: "revoked", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "sessionKey", type: "address" },
          { internalType: "uint48", name: "validUntil", type: "uint48" },
          { internalType: "uint32", name: "maxCalls", type: "uint32" },
          { internalType: "address", name: "gameContract", type: "address" },
          { internalType: "uint16", name: "allowedActions", type: "uint16" },
          { internalType: "address", name: "token", type: "address" },
          { internalType: "uint256", name: "maxTokenSpend", type: "uint256" },
          { internalType: "bytes32", name: "salt", type: "bytes32" },
        ],
        internalType: "struct SessionTypes.SessionPolicy",
        name: "policy",
        type: "tuple",
      },
      { internalType: "bytes", name: "signature", type: "bytes" },
    ],
    name: "createSession",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

/**
 * Normalize a policy object coming from JSON (where bigints are strings)
 * into the exact types viem requires for ABI encoding.
 */
function normalizePolicy(raw: any) {
  return {
    owner: raw.owner as `0x${string}`,
    sessionKey: raw.sessionKey as `0x${string}`,
    validUntil: Number(raw.validUntil),
    maxCalls: Number(raw.maxCalls),
    gameContract: raw.gameContract as `0x${string}`,
    allowedActions: Number(raw.allowedActions),
    token: raw.token as `0x${string}`,
    maxTokenSpend: BigInt(raw.maxTokenSpend),
    salt: raw.salt as `0x${string}`,
  };
}

/**
 * Normalize an action object coming from JSON into viem-compatible types.
 */
function normalizeAction(raw: any) {
  return {
    sessionId: raw.sessionId as `0x${string}`,
    nonce: BigInt(raw.nonce),
    actionId: Number(raw.actionId),
    paramsHash: raw.paramsHash as `0x${string}`,
    deadline: Number(raw.deadline),
  };
}

export async function createSessionOnChain(
  sessionManagerAddress: `0x${string}`,
  policy: any,
  ownerSignature: `0x${string}`,
) {
  try {
    const normalizedPolicy = normalizePolicy(policy);

    // 1. Simulate to get the returned sessionId (bytes32) AND validate the tx
    const { request, result: sessionId } = await publicClient.simulateContract({
      account: relayerAccount,
      address: sessionManagerAddress,
      abi: SessionManagerABI,
      functionName: "createSession",
      args: [normalizedPolicy, ownerSignature],
    });

    // 2. On Monad, gas_paid = gas_limit × price. Set a tight limit to avoid
    //    charging users for unused capacity.
    if (isMonad() && !request.gas) {
      const estimate = await publicClient.estimateContractGas({
        account: relayerAccount,
        address: sessionManagerAddress,
        abi: SessionManagerABI,
        functionName: "createSession",
        args: [normalizedPolicy, ownerSignature],
      });
      (request as any).gas = tightGasLimit(estimate);
    }

    // 3. Send transaction if simulation passes and wait until it is mined.
    const hash = await walletClient.writeContract(request);
    logger.info("createSession tx sent", { hash, owner: policy.owner, sessionKey: policy.sessionKey });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") {
      throw new Error("Session creation transaction reverted");
    }
    logger.info("createSession confirmed", { hash, sessionId: sessionId as string, blockNumber: receipt.blockNumber?.toString() });

    // 3. Persist session to SQLite only after on-chain confirmation.
    await db.run(
      `INSERT OR IGNORE INTO sessions (sessionId, owner, sessionKey, validUntil, gameContract) VALUES (?, ?, ?, ?, ?)`,
      [
        sessionId,
        policy.owner,
        policy.sessionKey,
        policy.validUntil,
        policy.gameContract,
      ],
    );

    return { success: true, sessionId, hash };
  } catch (error: any) {
    const errorText = [
      error.shortMessage,
      error.message,
      error.cause?.message,
      String(error),
    ]
      .filter(Boolean)
      .join(" ");

    console.error("createSession failed:", errorText);
    logger.error("createSession failed", { error: errorText, owner: policy?.owner });

    if (errorText.includes("SessionAlreadyExists")) {
      throw new Error("A session with this policy already exists");
    }
    if (errorText.includes("InvalidSignature")) {
      throw new Error("Owner signature is invalid");
    }
    if (errorText.includes("InvalidPolicy")) {
      throw new Error("Session policy is invalid");
    }

    throw new Error(error.shortMessage || error.message);
  }
}

export async function executeSessionAction(
  sessionManagerAddress: `0x${string}`,
  action: any,
  params: `0x${string}`,
  signature: `0x${string}`,
) {
  try {
    const normalizedAction = normalizeAction(action);

    // 1. Simulate the transaction (eth_call) to catch reverts early
    const { request } = await publicClient.simulateContract({
      account: relayerAccount,
      address: sessionManagerAddress,
      abi: SessionManagerABI,
      functionName: "executeAction",
      args: [normalizedAction, params, signature],
    });

    // 2. On Monad, gas_paid = gas_limit × price. Set a tight limit.
    if (isMonad() && !request.gas) {
      const estimate = await publicClient.estimateContractGas({
        account: relayerAccount,
        address: sessionManagerAddress,
        abi: SessionManagerABI,
        functionName: "executeAction",
        args: [normalizedAction, params, signature],
      });
      (request as any).gas = tightGasLimit(estimate);
    }

    // 3. Send transaction if simulation passes and wait until it is mined.
    const hash = await walletClient.writeContract(request);
    const execStart = Date.now();
    logger.info("executeAction tx sent", { hash, sessionId: action.sessionId, actionId: action.actionId, nonce: action.nonce?.toString() });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") {
      throw new Error("Action execution transaction reverted");
    }
    logger.info("executeAction confirmed", { hash, latencyMs: Date.now() - execStart, blockNumber: receipt.blockNumber?.toString() });

    // 3. Save action to db only after on-chain confirmation.
    await db.run(
      `INSERT INTO actions (sessionId, nonce, actionId, txHash) VALUES (?, ?, ?, ?)`,
      [action.sessionId, action.nonce, action.actionId, hash],
    );

    return { success: true, hash };
  } catch (error: any) {
    const errorText = [
      error.shortMessage,
      error.message,
      error.cause?.message,
      String(error),
    ]
      .filter(Boolean)
      .join(" ");

    console.error("Execution failed:", errorText);
    logger.error("executeAction failed", { error: errorText, sessionId: action?.sessionId, actionId: action?.actionId });

    if (errorText.includes("SpendLimitExceeded")) {
      throw new Error("Token spend limit exceeded for this session");
    }
    if (errorText.includes("SessionRevoked")) {
      throw new Error("Session has been revoked");
    }
    if (errorText.includes("SessionExpired")) {
      throw new Error("Session has expired");
    }
    if (errorText.includes("ActionNotAllowed")) {
      throw new Error("This action is not permitted by the session policy");
    }

    throw new Error(error.shortMessage || error.message);
  }
}
