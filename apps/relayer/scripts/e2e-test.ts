import { publicClient, walletClient, relayerAccount } from "../src/chain/viem.js";
import { generateSessionKey, signSessionAction, RelayerClient, getDomain } from "@monad-session-arena/sdk";
import { keccak256, toHex, encodeAbiParameters, parseAbiParameters } from "viem";
import dotenv from "dotenv";

dotenv.config();

const RELAYER_URL = process.env.RELAYER_URL || "http://localhost:3001";
const SESSION_MANAGER_ADDRESS = process.env.SESSION_MANAGER_ADDRESS as `0x${string}`;

async function runE2E() {
  console.log("Starting E2E test with SDK...");
  
  // 1. Generate local session key using SDK
  const sessionKey = generateSessionKey();
  console.log("Generated session key address:", sessionKey.address);

  // 2. We mock the sessionId since the contract isn't deployed here.
  // In a full test, we would deploy the contract, call `createSession` with `walletClient`, 
  // and get the true `sessionId`.
  const mockSessionId = keccak256(toHex("mock-session"));
  
  const relayer = new RelayerClient({ url: RELAYER_URL });

  console.log("Registering session via Relayer...");
  try {
    const regRes = await relayer.registerSession({
      sessionId: mockSessionId,
      owner: "0x0000000000000000000000000000000000000001", // dummy owner
      sessionKey: sessionKey.address,
      validUntil: Math.floor(Date.now() / 1000) + 3600,
      gameContract: "0x0000000000000000000000000000000000000000"
    });
    console.log("Session registration response:", regRes);
  } catch (err: any) {
    console.error("Failed to register session:", err.message);
  }

  // 3. Prepare the action payload for MOVE
  const actionId = 1; // 1 = MOVE in DemoGame
  const params = encodeAbiParameters(parseAbiParameters('uint256'), [1n]);
  const paramsHash = keccak256(params);
  const nonce = 0;
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  const actionPayload = {
    sessionId: mockSessionId,
    actionId,
    nonce,
    deadline,
    paramsHash
  };

  // 4. Sign the action using the SDK helper
  const domain = getDomain(31337, SESSION_MANAGER_ADDRESS || "0x0000000000000000000000000000000000000000");
  console.log("Signing action payload...");
  const signature = await signSessionAction(sessionKey.account, domain, actionPayload);
  
  console.log("Action signature:", signature);

  // 5. Send to the relayer
  console.log("Sending action to relayer at", RELAYER_URL);
  try {
    const result = await relayer.executeAction({
      action: actionPayload,
      params,
      signature
    });
    console.log("Relayer response:", result);
  } catch (err: any) {
    console.log("Relayer execution returned an error (expected if contracts are not deployed on Anvil):");
    console.error(err.message);
  }
}

runE2E().catch(console.error);
