import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDb } from "./db/db.js";
import {
  configuredChainId,
  publicClient,
  relayerAccount,
  rpcUrl,
} from "./chain/viem.js";
import { logger } from "./utils/logger.js";
import { rateLimitMiddleware } from "./middleware/rateLimit.js";

dotenv.config();

const app = express();
const port = process.env.RELAYER_PORT || 3001;
const startTime = Date.now();

app.use(
  cors({ origin: process.env.RELAYER_CORS_ORIGIN || "http://localhost:5173" }),
);
app.use(express.json());

// ── Rate limiting global ──────────────────────────────────────────────────────
app.use(rateLimitMiddleware);

// ── Request logger estructurado ───────────────────────────────────────────────
app.use((req, res, next) => {
  const reqStart = Date.now();
  res.on("finish", () => {
    logger.info("http", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      latencyMs: Date.now() - reqStart,
      ip: req.headers["x-forwarded-for"] ?? req.socket.remoteAddress,
    });
  });
  next();
});

// ── Rutas ─────────────────────────────────────────────────────────────────────
import sessionsRouter from "./api/sessions.js";
import socialRouter from "./api/social.js";
app.use("/sessions", sessionsRouter);
app.use("/social", socialRouter);

// ── Health check mejorado ─────────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
  const checks: Record<string, "ok" | "error" | "unconfigured"> = {
    rpc: "error",
    sessionManager: "unconfigured",
  };

  let chainId = 0;
  let blockNumber: bigint | null = null;
  let rpcLatencyMs = 0;

  // RPC check
  try {
    const rpcStart = Date.now();
    chainId = await publicClient.getChainId();
    blockNumber = await publicClient.getBlockNumber();
    rpcLatencyMs = Date.now() - rpcStart;
    checks.rpc = "ok";
  } catch (e) {
    logger.warn("RPC not reachable during health check");
  }

  // SessionManager address check
  const sessionManagerAddress = process.env.SESSION_MANAGER_ADDRESS;
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  if (sessionManagerAddress && sessionManagerAddress !== ZERO_ADDRESS) {
    checks.sessionManager = "ok";
  }

  const allOk = Object.values(checks).every((v) => v === "ok");

  res.status(allOk ? 200 : 503).json({
    status: allOk ? "ok" : "degraded",
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    checks,
    rpcLatencyMs,
    chainId,
    configuredChainId,
    blockNumber: blockNumber?.toString() ?? null,
    rpcUrl,
    relayerAddress: relayerAccount.address,
    sessionManagerAddress: sessionManagerAddress || "0x",
    demoGameAddress: process.env.DEMO_GAME_ADDRESS || "0x",
    gameTokenAddress: process.env.GAME_TOKEN_ADDRESS || "0x",
  });
});

// ── Arranque ──────────────────────────────────────────────────────────────────
async function startServer() {
  await connectDb();
  logger.info("DB connected", { path: process.env.RELAYER_DATABASE_URL ?? "./db/relayer.sqlite" });

  app.listen(port, () => {
    logger.info("Relayer started", {
      port,
      chainId: configuredChainId,
      rpcUrl,
      relayer: relayerAccount.address,
      sessionManager: process.env.SESSION_MANAGER_ADDRESS || "NOT_SET",
    });
  });
}

startServer().catch((err) => {
  logger.error("Fatal startup error", { error: String(err) });
  process.exit(1);
});
