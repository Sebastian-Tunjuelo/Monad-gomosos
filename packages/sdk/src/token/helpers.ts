import { Address, Hex, PublicClient, formatEther } from "viem";

const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Read the ERC-20 balance for a given account.
 */
export async function getTokenBalance(
  client: PublicClient,
  tokenAddress: Address,
  account: Address,
): Promise<{ raw: bigint; formatted: string }> {
  const raw = await client.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account],
  });
  return { raw, formatted: formatEther(raw) };
}

/**
 * Read the ERC-20 allowance for a given owner/spender pair.
 */
export async function getTokenAllowance(
  client: PublicClient,
  tokenAddress: Address,
  owner: Address,
  spender: Address,
): Promise<{ raw: bigint; formatted: string }> {
  const raw = await client.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [owner, spender],
  });
  return { raw, formatted: formatEther(raw) };
}

const SESSION_MANAGER_ABI = [
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
] as const;

export interface SessionSpendState {
  tokenSpent: bigint;
  tokenSpentFormatted: string;
  maxTokenSpend: bigint;
  maxTokenSpendFormatted: string;
  remainingSpend: bigint;
  remainingSpendFormatted: string;
  spendPercent: number;
}

/**
 * Read the spend state of a session from the SessionManager contract.
 * Returns amounts in raw wei and formatted ether, plus a percentage consumed.
 */
export async function getSessionSpendState(
  client: PublicClient,
  sessionManagerAddress: Address,
  sessionId: Hex,
  maxTokenSpend: bigint,
): Promise<SessionSpendState> {
  const result = await client.readContract({
    address: sessionManagerAddress,
    abi: SESSION_MANAGER_ABI,
    functionName: "sessionStates",
    args: [sessionId],
  });

  const tokenSpent = result[1];
  const remainingSpend =
    tokenSpent >= maxTokenSpend ? 0n : maxTokenSpend - tokenSpent;
  const spendPercent =
    maxTokenSpend === 0n
      ? 0
      : Math.min(100, Number((tokenSpent * 10000n) / maxTokenSpend) / 100);

  return {
    tokenSpent,
    tokenSpentFormatted: formatEther(tokenSpent),
    maxTokenSpend,
    maxTokenSpendFormatted: formatEther(maxTokenSpend),
    remainingSpend,
    remainingSpendFormatted: formatEther(remainingSpend),
    spendPercent,
  };
}
