#!/usr/bin/env node
/**
 * setup-local.js
 *
 * Reads the Foundry deploy report (reports/deploy-<chainId>.json),
 * then writes / updates the .env files for the relayer and frontend
 * so the full stack can talk to the deployed contracts.
 *
 * Usage:
 *   node scripts/setup-local.js [chainId]   (default: 10143 for Monad testnet)
 *
 * Prerequisites:
 *   - Contracts must be deployed first:
 *       pnpm deploy:monad
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── 1. Load deploy report ────────────────────────────────────────────────────

const chainId = process.argv[2] ?? "10143";
const reportPath = path.join(ROOT, "reports", `deploy-${chainId}.json`);

if (!fs.existsSync(reportPath)) {
  console.error(`\n✗  Deploy report not found: ${reportPath}`);
  console.error(
    "   Run the deploy script first:\n" +
      "   pnpm deploy:monad\n",
  );
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
console.log("\n✓  Deploy report loaded:");
console.log(`   Chain ID       : ${report.chainId}`);
console.log(`   GameToken      : ${report.GameToken}`);
console.log(`   DemoGame       : ${report.DemoGame}`);
console.log(`   SessionManager : ${report.SessionManager}`);

// ── 2. Helper: write / patch .env file ──────────────────────────────────────

/**
 * Reads an existing .env file (or creates it from .env.example if present),
 * then sets / overwrites the given key=value pairs, and saves.
 */
function patchEnv(envPath, examplePath, patches) {
  let content = "";

  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf8");
  } else if (examplePath && fs.existsSync(examplePath)) {
    content = fs.readFileSync(examplePath, "utf8");
    console.log(`   Created ${path.relative(ROOT, envPath)} from .env.example`);
  }

  for (const [key, value] of Object.entries(patches)) {
    const regex = new RegExp(`^(${key}=.*)$`, "m");
    const line = `${key}=${value}`;
    if (regex.test(content)) {
      content = content.replace(regex, line);
    } else {
      content +=
        (content.endsWith("\n") || content === "" ? "" : "\n") + line + "\n";
    }
  }

  fs.mkdirSync(path.dirname(envPath), { recursive: true });
  fs.writeFileSync(envPath, content, "utf8");
}

// ── 3. Patch relayer .env ────────────────────────────────────────────────────

const relayerEnv = path.join(ROOT, "apps", "relayer", ".env");
const relayerExample = path.join(ROOT, "apps", "relayer", ".env.example");

const isMonad = String(report.chainId) === "10143";

// Extract RELAYER_PRIVATE_KEY from root .env if it exists
let rootRelayerKey = "";
const rootEnvPath = path.join(ROOT, ".env");
if (fs.existsSync(rootEnvPath)) {
  const rootEnv = fs.readFileSync(rootEnvPath, "utf8");
  const match = rootEnv.match(/^RELAYER_PRIVATE_KEY=(.*)$/m);
  if (match && match[1]) {
    rootRelayerKey = match[1].trim();
  }
}

patchEnv(relayerEnv, relayerExample, {
  CHAIN_ID: String(report.chainId),
  MONAD_RPC_URL: isMonad
    ? "https://testnet-rpc.monad.xyz"
    : "http://127.0.0.1:8545",
  SESSION_MANAGER_ADDRESS: report.SessionManager,
  RELAYER_PRIVATE_KEY: rootRelayerKey,
  RELAYER_PORT: "3001",
  RELAYER_CORS_ORIGIN: "http://localhost:5173",
  RELAYER_DATABASE_URL: "file:./db/relayer.sqlite",
});

console.log(`\n✓  Relayer .env updated: ${path.relative(ROOT, relayerEnv)}`);

// ── 4. Patch frontend .env ───────────────────────────────────────────────────

const frontendEnv = path.join(ROOT, "apps", "frontend", ".env");
const frontendExample = path.join(ROOT, "apps", "frontend", ".env.example");

patchEnv(frontendEnv, frontendExample, {
  VITE_CHAIN_ID: String(report.chainId),
  VITE_RPC_URL: isMonad
    ? "https://testnet-rpc.monad.xyz"
    : "http://127.0.0.1:8545",
  VITE_SESSION_MANAGER_ADDRESS: report.SessionManager,
  VITE_GAME_TOKEN_ADDRESS: report.GameToken,
  VITE_DEMO_GAME_ADDRESS: report.DemoGame,
  VITE_RELAYER_URL: "http://localhost:3001",
});

console.log(`✓  Frontend .env updated: ${path.relative(ROOT, frontendEnv)}`);

// ── 5. Summary ───────────────────────────────────────────────────────────────

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Stack ready. Start the services:

  Terminal 1 — Relayer:
    pnpm dev:relayer

  Terminal 2 — Frontend:
    pnpm dev:frontend

  Then open http://localhost:5173
  Connect MetaMask to Monad Testnet (chainId ${report.chainId})
  RPC: https://testnet-rpc.monad.xyz
  Get testnet MON at: https://faucet.monad.xyz
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
