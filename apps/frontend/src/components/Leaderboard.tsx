import { useEffect, useState } from "react";

interface Player {
  address: string;
  moves: number;
  attacks: number;
  collects: number;
  items: number;
  posts: number;
  likes: number;
  followers: number;
  score: number;
}

const RELAYER_URL = import.meta.env.VITE_RELAYER_URL || "http://localhost:3001";

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const MEDAL = ["🥇", "🥈", "🥉"];

const SCORE_RULES = [
  { label: "MOVE", pts: 1, color: "text-cyan-400" },
  { label: "ATTACK", pts: 2, color: "text-orange-400" },
  { label: "COLLECT", pts: 2, color: "text-blue-400" },
  { label: "BUY_ITEM", pts: 5, color: "text-pink-400" },
  { label: "POST", pts: 3, color: "text-purple-400" },
  { label: "FOLLOWER", pts: 4, color: "text-emerald-400" },
  { label: "LIKE", pts: 1, color: "text-red-400" },
];

/**
 * Leaderboard — Live on-chain ranking.
 * Reads player stats directly from DemoGame and DemoSocial contracts.
 * Updates every 5 seconds.
 */
export function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${RELAYER_URL}/social/leaderboard`);
      if (!res.ok) return;
      const data = await res.json();
      setPlayers(data.players ?? []);
      setBlockNumber(data.blockNumber ?? null);
      setLastUpdate(new Date());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const iv = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-400">
            On-Chain Leaderboard
          </h3>
          <p className="text-gray-600 text-[11px] mt-0.5">
            Live rankings from DemoGame + DemoSocial contracts
            {blockNumber && <span className="ml-2">· Block #{blockNumber}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-[10px] font-bold uppercase tracking-wider">Live</span>
          {lastUpdate && (
            <span className="text-gray-700 text-[9px]">
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Scoring rules */}
      <div className="bg-gray-900/40 border border-white/5 rounded-xl p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Scoring system</p>
        <div className="flex flex-wrap gap-2">
          {SCORE_RULES.map((r) => (
            <span key={r.label} className={`text-[10px] font-bold px-2 py-1 rounded-md bg-black/30 border border-white/5 ${r.color}`}>
              {r.label} +{r.pts}pt{r.pts > 1 ? "s" : ""}
            </span>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading && (
        <div className="text-center py-12 text-gray-700 text-sm animate-pulse">
          Loading on-chain data…
        </div>
      )}

      {!loading && players.length === 0 && (
        <div className="text-center py-12 text-gray-700 text-sm">
          No players yet — create a session and make some moves!
        </div>
      )}

      {players.length > 0 && (
        <div className="space-y-2">
          {players.map((player, idx) => (
            <div
              key={player.address}
              className={`rounded-2xl border p-4 transition-all ${
                idx === 0
                  ? "border-yellow-500/30 bg-yellow-950/10"
                  : idx === 1
                  ? "border-gray-400/20 bg-gray-800/10"
                  : idx === 2
                  ? "border-orange-500/20 bg-orange-950/10"
                  : "border-white/5 bg-gray-900/30"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="text-2xl shrink-0 w-8 text-center">
                  {idx < 3 ? MEDAL[idx] : <span className="text-gray-600 text-sm font-black">#{idx + 1}</span>}
                </div>

                {/* Avatar + address */}
                <div className="flex items-center gap-2 shrink-0 w-28">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                    style={{
                      background: `hsl(${parseInt(player.address.slice(2, 8), 16) % 360}, 60%, 40%)`,
                    }}
                  >
                    {player.address.slice(2, 4).toUpperCase()}
                  </div>
                  <span className="text-white text-[11px] font-mono">{shortAddr(player.address)}</span>
                </div>

                {/* Stats */}
                <div className="flex-1 grid grid-cols-3 sm:grid-cols-7 gap-2 min-w-0">
                  {[
                    { v: player.moves, label: "moves", color: "text-cyan-400" },
                    { v: player.attacks, label: "atk", color: "text-orange-400" },
                    { v: player.collects, label: "coll", color: "text-blue-400" },
                    { v: player.items, label: "items", color: "text-pink-400" },
                    { v: player.posts, label: "posts", color: "text-purple-400" },
                    { v: player.followers, label: "foll", color: "text-emerald-400" },
                    { v: player.likes, label: "likes", color: "text-red-400" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className={`text-sm font-black ${stat.color} leading-none`}>{stat.v}</p>
                      <p className="text-[8px] text-gray-700 uppercase tracking-wider">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <p className={`text-xl font-black leading-none ${idx === 0 ? "text-yellow-400" : "text-white"}`}>
                    {player.score}
                  </p>
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider">pts</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-gray-700 text-[10px]">
        All data read directly from on-chain contract state · No database
      </p>
    </div>
  );
}
