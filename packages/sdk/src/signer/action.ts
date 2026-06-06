import { Account } from "viem";

export interface SessionAction {
  sessionId: `0x${string}`;
  nonce: number | bigint;
  actionId: number;
  paramsHash: `0x${string}`;
  deadline: number;
}

export const SESSION_ACTION_TYPES = {
  SessionAction: [
    { name: "sessionId", type: "bytes32" },
    { name: "nonce", type: "uint256" },
    { name: "actionId", type: "uint16" },
    { name: "paramsHash", type: "bytes32" },
    { name: "deadline", type: "uint48" },
  ],
} as const;

export async function signSessionAction(
  sessionAccount: Account,
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: `0x${string}`;
  },
  action: SessionAction,
): Promise<`0x${string}`> {
  // @ts-ignore - The signTypedData method exists on viem Accounts
  return sessionAccount.signTypedData({
    domain,
    types: SESSION_ACTION_TYPES,
    primaryType: "SessionAction",
    message: {
      ...action,
      nonce: BigInt(action.nonce),
    },
  });
}
