import { defineChain } from "viem";

const DEFAULT_CHAIN_ID = 31337;
const DEFAULT_LOCAL_RPC_URL = "http://127.0.0.1:8545";
const DEFAULT_MONAD_RPC_URL = "https://testnet-rpc.monad.xyz";

function readChainId() {
  const rawChainId = import.meta.env.VITE_CHAIN_ID;
  const parsedChainId = rawChainId ? Number(rawChainId) : DEFAULT_CHAIN_ID;

  if (!Number.isInteger(parsedChainId) || parsedChainId <= 0) {
    throw new Error(`Invalid VITE_CHAIN_ID: ${rawChainId}`);
  }

  return parsedChainId;
}

export const APP_CHAIN_ID = readChainId();
export const APP_RPC_URL =
  import.meta.env.VITE_RPC_URL ||
  (APP_CHAIN_ID === 10143 ? DEFAULT_MONAD_RPC_URL : DEFAULT_LOCAL_RPC_URL);

const isMonadTestnet = APP_CHAIN_ID === 10143;

export const appChain = defineChain({
  id: APP_CHAIN_ID,
  name: isMonadTestnet
    ? "Monad Testnet"
    : APP_CHAIN_ID === DEFAULT_CHAIN_ID
      ? "Anvil Local"
      : `Chain ${APP_CHAIN_ID}`,
  nativeCurrency: {
    name: isMonadTestnet ? "Monad" : "Ether",
    symbol: isMonadTestnet ? "MON" : "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [APP_RPC_URL] },
    public: { http: [APP_RPC_URL] },
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
