import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";

dotenv.config();

const DEFAULT_CHAIN_ID = 31337;
const DEFAULT_LOCAL_RPC_URL = "http://127.0.0.1:8545";
const DEFAULT_MONAD_RPC_URL = "https://testnet-rpc.monad.xyz";

function readChainId() {
  const rawChainId = process.env.CHAIN_ID || process.env.MONAD_CHAIN_ID;
  const parsedChainId = rawChainId ? Number(rawChainId) : DEFAULT_CHAIN_ID;

  if (!Number.isInteger(parsedChainId) || parsedChainId <= 0) {
    throw new Error(`Invalid CHAIN_ID/MONAD_CHAIN_ID: ${rawChainId}`);
  }

  return parsedChainId;
}

export const configuredChainId = readChainId();
export const rpcUrl =
  process.env.MONAD_RPC_URL ||
  (configuredChainId === 10143 ? DEFAULT_MONAD_RPC_URL : DEFAULT_LOCAL_RPC_URL);

const isMonadTestnet = configuredChainId === 10143;

export const relayerChain = defineChain({
  id: configuredChainId,
  name: isMonadTestnet
    ? "Monad Testnet"
    : configuredChainId === DEFAULT_CHAIN_ID
      ? "Anvil Local"
      : `Chain ${configuredChainId}`,
  nativeCurrency: {
    name: isMonadTestnet ? "Monad" : "Ether",
    symbol: isMonadTestnet ? "MON" : "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [rpcUrl] },
    public: { http: [rpcUrl] },
  },
  ...(isMonadTestnet
    ? {
        blockExplorers: {
          default: {
            name: "MonadVision",
            url: "https://monadvision.com",
            apiUrl: "https://api.monadvision.com/api",
          },
          socialscan: {
            name: "Socialscan",
            url: "https://monad-testnet.socialscan.io",
          },
          monadscan: {
            name: "Monadscan",
            url: "https://testnet.monadscan.com",
          },
        },
      }
    : {}),
  testnet: true,
});

const privateKey = (process.env.RELAYER_PRIVATE_KEY ||
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80") as `0x${string}`; // Default anvil key 0

export const relayerAccount = privateKeyToAccount(privateKey);

export const publicClient = createPublicClient({
  chain: relayerChain,
  transport: http(rpcUrl),
});

export const walletClient = createWalletClient({
  account: relayerAccount,
  chain: relayerChain,
  transport: http(rpcUrl),
});
