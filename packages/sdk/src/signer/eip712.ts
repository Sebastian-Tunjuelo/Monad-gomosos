import { Address, Hex } from "viem";

export const sessionGrantTypes = {
  SessionGrant: [
    { name: "owner", type: "address" },
    { name: "sessionKey", type: "address" },
    { name: "validUntil", type: "uint48" },
    { name: "maxCalls", type: "uint32" },
    { name: "gameContract", type: "address" },
    { name: "allowedActions", type: "uint16" },
    { name: "token", type: "address" },
    { name: "maxTokenSpend", type: "uint256" },
    { name: "salt", type: "bytes32" },
  ],
};

export const sessionActionTypes = {
  SessionAction: [
    { name: "sessionId", type: "bytes32" },
    { name: "nonce", type: "uint256" },
    { name: "actionId", type: "uint16" },
    { name: "paramsHash", type: "bytes32" },
    { name: "deadline", type: "uint48" },
  ],
};

export type SessionGrantMessage = {
  owner: Address;
  sessionKey: Address;
  validUntil: number;
  maxCalls: number;
  gameContract: Address;
  allowedActions: number;
  token: Address;
  maxTokenSpend: bigint;
  salt: Hex;
};

export type SessionActionMessage = {
  sessionId: Hex;
  nonce: bigint;
  actionId: number;
  paramsHash: Hex;
  deadline: number;
};

export function getDomain(chainId: number, verifyingContract: Address) {
  return {
    name: "MonadSessionArena",
    version: "1",
    chainId,
    verifyingContract,
  } as const;
}
