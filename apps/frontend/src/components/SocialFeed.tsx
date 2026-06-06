import { useEffect, useRef, useState } from "react";
import {
  encodeAbiParameters,
  parseAbiParameters,
  keccak256,
} from "viem";
import {
  generateSessionKey,
  signSessionAction,
  RelayerClient,
  getDomain,
} from "@monad-session-arena/sdk";
import { useAccount, useSignTypedData, useChainId, useSwitchChain } from "wagmi";
import { APP_CHAIN_ID } from "../lib/chains.js";
import { useNotification } from "./Notification.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post {
  id: number;
  author: string;
  content: string;
  likes: number;
  reposts: number;
  timestamp: number;
}

interface SocialFeedProps {
  relayer: RelayerClient;
  sessionKey: any;
  sessionId: `0x${string}`;
}

const SESSION_GRANT_TYPES = {
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
} as const;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const RELAYER_URL = import.meta.env.VITE_RELAYER_URL || "http://localhost:3001";
const SESSION_MANAGER_ADDRESS = (import.meta.env.VITE_SESSION_MANAGER_ADDRESS || ZERO_ADDRESS) as `0x${string}`;
const DEMO_SOCIAL_ADDRESS = (import.meta.env.VITE_DEMO_SOCIAL_ADDRESS || ZERO_ADDRESS) as `0x${string}`;

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SocialFeed({ relayer, sessionKey, sessionId }: SocialFeedProps) {
  const { address } = useAccount();
  const { addNotification } = useNotification();

  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [composing, setComposing] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [actionNonce, setActionNonce] = useState(0);

  const isSocialConfigured = DEMO_SOCIAL_ADDRESS !== ZERO_ADDRESS && SESSION_MANAGER_ADDRESS !== ZERO_ADDRESS;

  // ── Fetch feed ──────────────────────────────────────────────────────────────
  const fetchFeed = async () => {
    try {
      const res = await fetch(`${RELAYER_URL}/social/feed?n=20`);
      if (!res.ok) return;
      const data = await res.json();
      setPosts(data.posts ?? []);
      setTotalPosts(data.totalPosts ?? 0);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!isSocialConfigured) return;
    fetchFeed();
    const iv = setInterval(fetchFeed, 4000);
    return () => clearInterval(iv);
  }, [isSocialConfigured]);

  // Session creation is now handled globally in the Create Key tab.

  // ── Execute social action ────────────────────────────────────────────────────
  const execSocialAction = async (actionId: number, params: `0x${string}`) => {
    if (!sessionKey || !sessionId) return;

    const currentNonce = await relayer.getSessionNonce(sessionId);
    const actionPayload = {
      sessionId: sessionId,
      actionId,
      nonce: currentNonce,
      deadline: Math.floor(Date.now() / 1000) + 3600,
      paramsHash: keccak256(params),
    };

    const domain = getDomain(APP_CHAIN_ID, SESSION_MANAGER_ADDRESS);
    const signature = await signSessionAction(sessionKey.account, domain, actionPayload);

    const result = await relayer.executeAction({ action: actionPayload, params, signature });
    if (!result.success) throw new Error(result.error ?? "Action failed");
    setActionNonce(currentNonce + 1);
    return result;
  };

  // ── Post ────────────────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!composing.trim() || !sessionKey) return;
    setIsPosting(true);
    try {
      const params = encodeAbiParameters(
        parseAbiParameters("string"),
        [composing.trim()]
      );
      await execSocialAction(1, params);
      setComposing("");
      addNotification("success", "Posted On-Chain 📢", "Your post is live on Monad!");
      setTimeout(fetchFeed, 1000);
    } catch (e: any) {
      addNotification("error", "Post Failed", e.message);
    } finally {
      setIsPosting(false);
    }
  };

  // ── Like ────────────────────────────────────────────────────────────────────
  const handleLike = async (postId: number) => {
    if (!sessionKey) return;
    try {
      const params = encodeAbiParameters(parseAbiParameters("uint256"), [BigInt(postId)]);
      await execSocialAction(2, params);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p))
      );
    } catch (e: any) {
      addNotification("error", "Like Failed", (e as any).message);
    }
  };

  // ── Follow ──────────────────────────────────────────────────────────────────
  const handleFollow = async (target: string) => {
    if (!sessionKey || !address) return;
    if (target.toLowerCase() === address.toLowerCase()) return;
    try {
      const params = encodeAbiParameters(parseAbiParameters("address"), [target as `0x${string}`]);
      await execSocialAction(3, params);
      addNotification("success", "Followed On-Chain", `Now following ${shortAddr(target)}`);
    } catch (e: any) {
      addNotification("error", "Follow Failed", (e as any).message);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!isSocialConfigured) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-700 text-sm">
        DemoSocial contract not configured — set VITE_DEMO_SOCIAL_ADDRESS
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            On-Chain Social Feed
          </h3>
          <p className="text-gray-600 text-[11px] mt-0.5">
            {totalPosts} posts on Monad · Same SessionManager, different app
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            Session Active
          </span>
        </div>
      </div>

      {/* Compose box */}
      <div className="bg-gray-900/50 border border-white/5 rounded-2xl p-4">
          <textarea
            value={composing}
            onChange={(e) => setComposing(e.target.value.slice(0, 280))}
            placeholder="What's happening on Monad? (280 chars max)"
            rows={3}
            className="w-full bg-transparent text-white placeholder-gray-600 text-sm resize-none focus:outline-none"
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
            <span className={`text-[10px] ${composing.length > 250 ? "text-orange-400" : "text-gray-600"}`}>
              {composing.length}/280
            </span>
            <button
              onClick={handlePost}
              disabled={!composing.trim() || isPosting}
              className="px-5 py-2 bg-purple-600/80 hover:bg-purple-500 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl border border-purple-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPosting ? "Posting…" : "Post On-Chain ⚡"}
            </button>
          </div>
        </div>
      {/* Posts feed */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {posts.length === 0 && (
          <div className="text-center py-12 text-gray-700 text-sm">
            No posts yet — be the first to post on-chain!
          </div>
        )}
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-gray-900/50 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors"
          >
            {/* Author row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-black text-white">
                  {post.author.slice(2, 4).toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-xs font-bold font-mono">
                    {shortAddr(post.author)}
                  </p>
                  <p className="text-gray-600 text-[9px]">
                    #{post.id} · {timeAgo(post.timestamp)}
                  </p>
                </div>
              </div>
              {/* On-chain badge */}
              <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-600 border border-emerald-500/20">
                on-chain
              </span>
            </div>

            {/* Content */}
            <p className="text-gray-200 text-sm leading-relaxed mb-3">{post.content}</p>

            {/* Actions row */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleLike(post.id)}
                disabled={!sessionKey}
                className="flex items-center gap-1.5 text-gray-600 hover:text-pink-400 disabled:opacity-40 transition-colors text-[11px] font-semibold"
              >
                <span>❤</span>
                <span>{post.likes}</span>
              </button>
              <button
                onClick={() => handleFollow(post.author)}
                disabled={!sessionKey || post.author.toLowerCase() === address?.toLowerCase()}
                className="flex items-center gap-1.5 text-gray-600 hover:text-cyan-400 disabled:opacity-40 transition-colors text-[11px] font-semibold"
              >
                <span>➕</span>
                <span>Follow</span>
              </button>
              <span className="text-gray-700 text-[10px] ml-auto">
                🔁 {post.reposts}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
