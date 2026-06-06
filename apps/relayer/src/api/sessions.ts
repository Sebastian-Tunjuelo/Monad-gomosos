import dotenv from "dotenv";
import { Router } from "express";
import {
  executeSessionAction,
  createSessionOnChain,
  SessionManagerABI,
} from "../services/executor.js";
import { db } from "../db/db.js";
import { publicClient } from "../chain/viem.js";

dotenv.config();

const router: Router = Router();

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function getSessionManagerAddress() {
  const address = process.env.SESSION_MANAGER_ADDRESS as
    | `0x${string}`
    | undefined;
  if (!address || address === ZERO_ADDRESS) return null;
  return address;
}

router.post("/register", async (req, res) => {
  try {
    const {
      policy,
      ownerSignature,
      sessionId,
      owner,
      sessionKey,
      validUntil,
      gameContract,
    } = req.body;

    if (policy || ownerSignature) {
      const sessionManagerAddress = getSessionManagerAddress();

      if (!policy || !ownerSignature) {
        return res
          .status(400)
          .json({ error: "Missing policy or ownerSignature" });
      }
      if (!sessionManagerAddress) {
        return res.status(500).json({
          error:
            "Session Manager address not configured; refusing to create a local-only session for an on-chain approval.",
        });
      }
      if (!policy.owner || !policy.sessionKey) {
        return res.status(400).json({ error: "Missing fields in policy" });
      }

      const result = await createSessionOnChain(
        sessionManagerAddress,
        policy,
        ownerSignature as `0x${string}`,
      );
      return res.json(result);
    }

    // Local/demo fallback path: save directly to SQLite
    const effectiveSessionId = sessionId;
    const effectiveOwner = owner ?? policy?.owner;
    const effectiveSessionKey = sessionKey ?? policy?.sessionKey;
    if (!effectiveSessionId || !effectiveOwner || !effectiveSessionKey) {
      return res.status(400).json({ error: "Missing fields" });
    }
    await db.run(
      `INSERT OR IGNORE INTO sessions (sessionId, owner, sessionKey, validUntil, gameContract)
       VALUES (?, ?, ?, ?, ?)`,
      [
        effectiveSessionId,
        effectiveOwner,
        effectiveSessionKey,
        validUntil ?? policy?.validUntil,
        gameContract ?? policy?.gameContract,
      ],
    );
    res.json({ success: true, sessionId: effectiveSessionId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:sessionId/nonce", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const sessionManagerAddress = getSessionManagerAddress();
    if (sessionManagerAddress) {
      const state = await publicClient.readContract({
        address: sessionManagerAddress,
        abi: SessionManagerABI,
        functionName: "sessionStates",
        args: [sessionId as `0x${string}`],
      });
      // state[2] is the nonce field
      return res.json({ nonce: Number(state[2]) });
    }

    // Fallback: use action count as nonce approximation
    const { count } = await db.get(
      `SELECT COUNT(*) as count FROM actions WHERE sessionId = ?`,
      [sessionId],
    );
    res.json({ nonce: count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/revoke", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

    await db.run(`UPDATE sessions SET revoked = 1 WHERE sessionId = ?`, [
      sessionId,
    ]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:sessionId/dashboard", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await db.get(`SELECT * FROM sessions WHERE sessionId = ?`, [
      sessionId,
    ]);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const actions = await db.all(
      `SELECT * FROM actions WHERE sessionId = ? ORDER BY createdAt DESC LIMIT 10`,
      [sessionId],
    );
    const { count } = await db.get(
      `SELECT COUNT(*) as count FROM actions WHERE sessionId = ?`,
      [sessionId],
    );

    let tokenSpent = "0";
    const sessionManagerAddress = getSessionManagerAddress();
    if (sessionManagerAddress) {
      try {
        const state = await publicClient.readContract({
          address: sessionManagerAddress,
          abi: SessionManagerABI,
          functionName: "sessionStates",
          args: [sessionId as `0x${string}`],
        });
        tokenSpent = state[1].toString();
      } catch (e) {
        console.error("Failed to fetch session state from contract", e);
      }
    }

    res.json({
      session: { ...session, tokenSpent },
      actions,
      totalActions: count,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/execute", async (req, res) => {
  try {
    const { action, params, signature } = req.body;

    if (!action || !params || !signature) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const sessionManagerAddress = getSessionManagerAddress();
    if (!sessionManagerAddress) {
      return res
        .status(500)
        .json({ error: "Session Manager address not configured" });
    }

    // --- Local DB validation (fast path) ---
    const session = await db.get(`SELECT * FROM sessions WHERE sessionId = ?`, [
      action.sessionId,
    ]);

    if (!session) {
      return res.status(400).json({
        error:
          "Session not registered. Make sure the session was created on-chain via 'Approve Session'.",
      });
    }
    if (session.revoked) {
      return res.status(400).json({ error: "Session is revoked" });
    }
    if (session.validUntil < Date.now() / 1000) {
      return res.status(400).json({ error: "Session has expired" });
    }

    const { count } = await db.get(
      `SELECT COUNT(*) as count FROM actions WHERE sessionId = ?`,
      [action.sessionId],
    );
    if (count >= 30) {
      return res.status(400).json({ error: "Max actions exceeded" });
    }

    const result = await executeSessionAction(
      sessionManagerAddress,
      action,
      params,
      signature,
    );

    res.json(result);
  } catch (error: any) {
    // Surface contract revert names so the frontend can show a meaningful message
    const msg: string = error.message ?? String(error);
    if (msg.includes("SessionNotFound") || msg.includes("0x96c95f81")) {
      return res.status(400).json({
        error:
          "Session not found on-chain. Please create a new session via 'Approve Session'.",
      });
    }
    res.status(500).json({ error: msg });
  }
});

export default router;
