/**
 * Social feed API — reads DemoSocial contract state and live events.
 * Used by the SocialFeed and LiveExplorer frontend components.
 */
import { Router } from "express";
import { publicClient } from "../chain/viem.js";
import { logger } from "../utils/logger.js";

const router: Router = Router();

const DEMO_SOCIAL_ABI = [
  {
    inputs: [{ name: "n", type: "uint256" }],
    name: "getRecentPosts",
    outputs: [
      {
        components: [
          { name: "author", type: "address" },
          { name: "content", type: "string" },
          { name: "likes", type: "uint256" },
          { name: "reposts", type: "uint256" },
          { name: "timestamp", type: "uint256" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "postCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "followerCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "userPostCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const SESSION_MANAGER_ABI = [
  {
    name: "SessionCreated",
    type: "event",
    inputs: [
      { indexed: true, name: "sessionId", type: "bytes32" },
      { indexed: true, name: "owner", type: "address" },
      { indexed: true, name: "sessionKey", type: "address" },
      { name: "validUntil", type: "uint48" },
    ],
  },
  {
    name: "SessionActionExecuted",
    type: "event",
    inputs: [
      { indexed: true, name: "sessionId", type: "bytes32" },
      { name: "actionId", type: "uint16" },
      { name: "nonce", type: "uint256" },
    ],
  },
  {
    name: "SessionRevoked",
    type: "event",
    inputs: [{ indexed: true, name: "sessionId", type: "bytes32" }],
  },
] as const;

function getSocialAddress(): `0x${string}` | null {
  const a = process.env.DEMO_SOCIAL_ADDRESS as `0x${string}` | undefined;
  const ZERO = "0x0000000000000000000000000000000000000000";
  return a && a !== ZERO ? a : null;
}

function getSessionManagerAddress(): `0x${string}` | null {
  const a = process.env.SESSION_MANAGER_ADDRESS as `0x${string}` | undefined;
  const ZERO = "0x0000000000000000000000000000000000000000";
  return a && a !== ZERO ? a : null;
}

// ── GET /social/feed?n=20 ─────────────────────────────────────────────────────
router.get("/feed", async (req, res) => {
  const socialAddress = getSocialAddress();
  if (!socialAddress) {
    return res.status(503).json({ error: "DemoSocial contract not configured" });
  }

  try {
    const n = Math.min(Number(req.query.n ?? 20), 50);
    const posts = await publicClient.readContract({
      address: socialAddress,
      abi: DEMO_SOCIAL_ABI,
      functionName: "getRecentPosts",
      args: [BigInt(n)],
    });

    const postCount = await publicClient.readContract({
      address: socialAddress,
      abi: DEMO_SOCIAL_ABI,
      functionName: "postCount",
    });

    const formatted = (posts as any[]).map((p, idx) => ({
      id: Number(postCount) - 1 - idx,
      author: p.author,
      content: p.content,
      likes: Number(p.likes),
      reposts: Number(p.reposts),
      timestamp: Number(p.timestamp),
    }));

    res.json({ posts: formatted, totalPosts: Number(postCount) });
  } catch (err: any) {
    logger.error("social/feed error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ── GET /social/stats/:address ────────────────────────────────────────────────
router.get("/stats/:address", async (req, res) => {
  const socialAddress = getSocialAddress();
  if (!socialAddress) return res.status(503).json({ error: "Not configured" });

  try {
    const user = req.params.address as `0x${string}`;
    const [followers, postCount] = await Promise.all([
      publicClient.readContract({
        address: socialAddress,
        abi: DEMO_SOCIAL_ABI,
        functionName: "followerCount",
        args: [user],
      }),
      publicClient.readContract({
        address: socialAddress,
        abi: DEMO_SOCIAL_ABI,
        functionName: "userPostCount",
        args: [user],
      }),
    ]);

    res.json({
      address: user,
      followers: Number(followers),
      posts: Number(postCount),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /social/live-events?limit=30 — recent on-chain events ─────────────────
router.get("/live-events", async (req, res) => {
  const smAddress = getSessionManagerAddress();
  if (!smAddress) return res.status(503).json({ error: "SessionManager not configured" });

  try {
    const limit = Math.min(Number(req.query.limit ?? 30), 100);
    const blockNumber = await publicClient.getBlockNumber();
    // Look back up to 90 blocks to leave a safe margin for Monad Testnet RPC limit
    const fromBlock = blockNumber > 90n ? blockNumber - 90n : 0n;

    const [created, executed, revoked] = await Promise.all([
      publicClient.getLogs({
        address: smAddress,
        event: SESSION_MANAGER_ABI[0],
        fromBlock,
        toBlock: blockNumber,
      }),
      publicClient.getLogs({
        address: smAddress,
        event: SESSION_MANAGER_ABI[1],
        fromBlock,
        toBlock: blockNumber,
      }),
      publicClient.getLogs({
        address: smAddress,
        event: SESSION_MANAGER_ABI[2],
        fromBlock,
        toBlock: blockNumber,
      }),
    ]);

    const ACTION_NAMES: Record<number, string> = {
      1: "MOVE", 2: "ATTACK", 3: "COLLECT", 4: "BUY_ITEM",
      // social actions
    };

    const events = [
      ...created.map((e) => ({
        type: "SessionCreated",
        sessionId: (e.args as any).sessionId,
        owner: (e.args as any).owner,
        sessionKey: (e.args as any).sessionKey,
        validUntil: Number((e.args as any).validUntil),
        blockNumber: Number(e.blockNumber),
        txHash: e.transactionHash,
      })),
      ...executed.map((e) => ({
        type: "ActionExecuted",
        sessionId: (e.args as any).sessionId,
        actionId: Number((e.args as any).actionId),
        actionName: ACTION_NAMES[Number((e.args as any).actionId)] ?? `ACTION_${(e.args as any).actionId}`,
        nonce: Number((e.args as any).nonce),
        blockNumber: Number(e.blockNumber),
        txHash: e.transactionHash,
      })),
      ...revoked.map((e) => ({
        type: "SessionRevoked",
        sessionId: (e.args as any).sessionId,
        blockNumber: Number(e.blockNumber),
        txHash: e.transactionHash,
      })),
    ]
      .sort((a, b) => b.blockNumber - a.blockNumber)
      .slice(0, limit);

    res.json({
      events,
      totalCreated: created.length,
      totalExecuted: executed.length,
      totalRevoked: revoked.length,
      blockNumber: Number(blockNumber),
    });
  } catch (err: any) {
    logger.error("social/live-events error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ── GET /social/leaderboard ───────────────────────────────────────────────────
// Builds a combined leaderboard by scanning all SessionCreated events to find
// unique players, then reading their game and social stats on-chain.
router.get("/leaderboard", async (req, res) => {
  const smAddress = getSessionManagerAddress();
  const socialAddress = getSocialAddress();
  const gameAddress = process.env.DEMO_GAME_ADDRESS as `0x${string}` | undefined;

  if (!smAddress) return res.status(503).json({ error: "SessionManager not configured" });

  const GAME_ABI = [
    { inputs: [{ name: "p", type: "address" }], name: "playerMoves", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
    { inputs: [{ name: "p", type: "address" }], name: "playerAttacks", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
    { inputs: [{ name: "p", type: "address" }], name: "playerCollects", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
    { inputs: [{ name: "p", type: "address" }], name: "playerItems", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  ] as const;

  const SOCIAL_LB_ABI = [
    { inputs: [{ name: "u", type: "address" }], name: "userPostCount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
    { inputs: [{ name: "u", type: "address" }], name: "userLikes", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
    { inputs: [{ name: "u", type: "address" }], name: "followerCount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  ] as const;

  try {
    const blockNumber = await publicClient.getBlockNumber();
    // Look back up to 90 blocks (Monad Testnet RPC limit)
    const fromBlock = blockNumber > 90n ? blockNumber - 90n : 0n;

    // Get all unique owners from SessionCreated events
    const createdLogs = await publicClient.getLogs({
      address: smAddress,
      event: SESSION_MANAGER_ABI[0],
      fromBlock,
      toBlock: blockNumber,
    });

    const owners = [...new Set(createdLogs.map((e) => (e.args as any).owner as string))];

    if (owners.length === 0) {
      return res.json({ players: [], blockNumber: Number(blockNumber) });
    }

    // Fetch all stats in parallel
    const players = await Promise.all(
      owners.map(async (owner) => {
        const addr = owner as `0x${string}`;
        const gameStats = gameAddress ? await Promise.all([
          publicClient.readContract({ address: gameAddress, abi: GAME_ABI, functionName: "playerMoves", args: [addr] }).catch(() => 0n),
          publicClient.readContract({ address: gameAddress, abi: GAME_ABI, functionName: "playerAttacks", args: [addr] }).catch(() => 0n),
          publicClient.readContract({ address: gameAddress, abi: GAME_ABI, functionName: "playerCollects", args: [addr] }).catch(() => 0n),
          publicClient.readContract({ address: gameAddress, abi: GAME_ABI, functionName: "playerItems", args: [addr] }).catch(() => 0n),
        ]) : [0n, 0n, 0n, 0n];

        const socialStats = socialAddress ? await Promise.all([
          publicClient.readContract({ address: socialAddress, abi: SOCIAL_LB_ABI, functionName: "userPostCount", args: [addr] }).catch(() => 0n),
          publicClient.readContract({ address: socialAddress, abi: SOCIAL_LB_ABI, functionName: "userLikes", args: [addr] }).catch(() => 0n),
          publicClient.readContract({ address: socialAddress, abi: SOCIAL_LB_ABI, functionName: "followerCount", args: [addr] }).catch(() => 0n),
        ]) : [0n, 0n, 0n];

        const moves = Number(gameStats[0]);
        const attacks = Number(gameStats[1]);
        const collects = Number(gameStats[2]);
        const items = Number(gameStats[3]);
        const posts = Number(socialStats[0]);
        const likes = Number(socialStats[1]);
        const followers = Number(socialStats[2]);

        const score = moves * 1 + attacks * 2 + collects * 2 + items * 5 + posts * 3 + likes * 1 + followers * 4;

        return { address: owner, moves, attacks, collects, items, posts, likes, followers, score };
      })
    );

    players.sort((a, b) => b.score - a.score);
    res.json({ players: players.slice(0, 20), blockNumber: Number(blockNumber) });
  } catch (err: any) {
    logger.error("leaderboard error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

export default router;
