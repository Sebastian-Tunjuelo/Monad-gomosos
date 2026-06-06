import { useEffect, useRef, useState } from "react";

interface LiveEvent {
  type: "SessionCreated" | "ActionExecuted" | "SessionRevoked";
  sessionId: string;
  owner?: string;
  sessionKey?: string;
  validUntil?: number;
  actionId?: number;
  actionName?: string;
  nonce?: number;
  blockNumber: number;
  txHash: string;
}

interface LiveStats {
  totalCreated: number;
  totalExecuted: number;
  totalRevoked: number;
  blockNumber: number;
}

const RELAYER_URL = import.meta.env.VITE_RELAYER_URL || "http://localhost:3001";
const EXPLORER_URL = import.meta.env.VITE_EXPLORER_URL || "";

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function shortHash(hash: string) {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

const EVENT_STYLES = {
  SessionCreated: {
    icon: "🔑",
    label: "Session Created",
    color: "text-emerald-400",
    bg: "bg-emerald-950/20 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  ActionExecuted: {
    icon: "⚡",
    label: "Action",
    color: "text-cyan-400",
    bg: "bg-cyan-950/20 border-cyan-500/20",
    dot: "bg-cyan-400",
  },
  SessionRevoked: {
    icon: "🚫",
    label: "Revoked",
    color: "text-red-400",
    bg: "bg-red-950/20 border-red-500/20",
    dot: "bg-red-400",
  },
};

/**
 * LiveExplorer — Real-time on-chain event feed for SessionManager.
 * Shows every SessionCreated, ActionExecuted, and SessionRevoked as it happens.
 * Like a mini Etherscan focused on session key activity.
 */
export function LiveExplorer() {
  const [events, setEvents] = useState<LiveEvent[]>(() => {
    try {
      const saved = localStorage.getItem("live_events_cache");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const prevHashesRef = useRef<Set<string>>(new Set());

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${RELAYER_URL}/social/live-events?limit=100`);
      if (!res.ok) return;
      const data = await res.json();

      const incoming: LiveEvent[] = data.events ?? [];

      // Detect truly new events for flash animation
      const newHashes = new Set<string>();
      incoming.forEach((e) => {
        if (!prevHashesRef.current.has(e.txHash + e.type)) {
          newHashes.add(e.txHash + e.type);
        }
      });

      if (newHashes.size > 0) {
        setNewEventIds(newHashes);
        setTimeout(() => setNewEventIds(new Set()), 1500);
      }

      prevHashesRef.current = new Set(incoming.map((e) => e.txHash + e.type));
      setEvents((prev) => {
        const merged = [...incoming, ...prev];
        // Deduplicate by txHash + type
        const unique = Array.from(new Map(merged.map(e => [e.txHash + e.type, e])).values());
        unique.sort((a, b) => b.blockNumber - a.blockNumber);
        const nextEvents = unique.slice(0, 100); // keep last 100 events
        
        setStats({
          totalCreated: nextEvents.filter(e => e.type === "SessionCreated").length,
          totalExecuted: nextEvents.filter(e => e.type === "ActionExecuted").length,
          totalRevoked: nextEvents.filter(e => e.type === "SessionRevoked").length,
          blockNumber: data.blockNumber,
        });

        try { localStorage.setItem("live_events_cache", JSON.stringify(nextEvents)); } catch {}

        return nextEvents;
      });
    } catch {
      /* silently fail */
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!isLive) return;
    const iv = setInterval(fetchEvents, 2000);
    return () => clearInterval(iv);
  }, [isLive]);

  return (
    <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              Live Session Explorer
              {isLive && (
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                  LIVE
                </span>
              )}
            </h3>
            <p className="text-gray-600 text-[10px] mt-0.5">
              Real-time on-chain events · SessionManager
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsLive((v) => !v)}
          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all ${
            isLive
              ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/30 hover:bg-red-950/30 hover:text-red-400 hover:border-red-500/30"
              : "bg-gray-800/50 text-gray-500 border-white/5 hover:bg-emerald-950/30 hover:text-emerald-400 hover:border-emerald-500/30"
          }`}
        >
          {isLive ? "⏸ Pause" : "▶ Resume"}
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-4 divide-x divide-white/5 border-b border-white/5">
          {[
            { label: "Sessions", value: stats.totalCreated, color: "text-emerald-400" },
            { label: "Actions", value: stats.totalExecuted, color: "text-cyan-400" },
            { label: "Revoked", value: stats.totalRevoked, color: "text-red-400" },
            { label: "Block", value: `#${stats.blockNumber}`, color: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="text-center py-3 px-2">
              <p className={`text-lg font-black ${s.color} leading-none tabular-nums`}>
                {s.value}
              </p>
              <p className="text-[9px] text-gray-600 uppercase tracking-wider mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Events list */}
      <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
        {events.length === 0 && (
          <div className="text-center py-12 text-gray-700 text-sm">
            No events yet — create a session to see live activity
          </div>
        )}
        {events.map((evt, i) => {
          const style = EVENT_STYLES[evt.type];
          const isNew = newEventIds.has(evt.txHash + evt.type);

          return (
            <div
              key={`${evt.txHash}-${evt.type}-${i}`}
              className={`flex items-start gap-3 px-4 py-3 transition-all duration-500 ${
                isNew ? "bg-white/5" : "hover:bg-white/2"
              }`}
            >
              {/* Dot + icon */}
              <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${isNew ? "animate-ping" : ""}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${style.color}`}>
                    {style.icon} {style.label}
                    {evt.actionName && ` · ${evt.actionName}`}
                  </span>
                  {evt.nonce !== undefined && (
                    <span className="text-gray-700 text-[9px] font-mono">
                      nonce #{evt.nonce}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {evt.owner && (
                    <span className="text-gray-500 text-[10px] font-mono">
                      owner: {shortAddr(evt.owner)}
                    </span>
                  )}
                  {evt.sessionKey && (
                    <span className="text-gray-600 text-[10px] font-mono">
                      key: {shortAddr(evt.sessionKey)}
                    </span>
                  )}
                  <span className="text-gray-700 text-[10px] font-mono">
                    session: {shortHash(evt.sessionId)}
                  </span>
                </div>
              </div>

              {/* Block + tx */}
              <div className="text-right shrink-0">
                <p className="text-gray-600 text-[9px] font-mono">
                  block #{evt.blockNumber}
                </p>
                {EXPLORER_URL ? (
                  <a
                    href={`${EXPLORER_URL}/tx/${evt.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-700 hover:text-cyan-400 text-[9px] font-mono transition-colors"
                  >
                    {shortHash(evt.txHash)} ↗
                  </a>
                ) : (
                  <p className="text-gray-700 text-[9px] font-mono">
                    {shortHash(evt.txHash)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
