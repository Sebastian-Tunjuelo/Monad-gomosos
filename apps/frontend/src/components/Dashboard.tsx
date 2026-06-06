import { useEffect, useState } from "react";
import { RelayerClient } from "@monad-session-arena/sdk";

interface DashboardProps {
  relayer: RelayerClient;
  sessionId: string | null;
  maxTokenSpend: string;
  onRevoke: () => void;
}

const ACTION_NAMES: Record<number, { label: string; color: string }> = {
  1: { label: "MOVE", color: "text-cyan-400 bg-cyan-950/40 border-cyan-500/30" },
  2: { label: "ATTACK", color: "text-orange-400 bg-orange-950/40 border-orange-500/30" },
  3: { label: "COLLECT", color: "text-blue-400 bg-blue-950/40 border-blue-500/30" },
  4: { label: "BUY_ITEM", color: "text-pink-400 bg-pink-950/40 border-pink-500/30" },
};

const EXPLORER_URL = import.meta.env.VITE_EXPLORER_URL || "";

function TxLink({ hash }: { hash: string }) {
  const short = `${hash.slice(0, 8)}…${hash.slice(-6)}`;
  if (EXPLORER_URL) {
    return (
      <a
        href={`${EXPLORER_URL}/tx/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] font-mono text-cyan-600 hover:text-cyan-400 transition-colors underline underline-offset-2"
        title={hash}
      >
        {short}
      </a>
    );
  }
  return (
    <span className="text-[10px] font-mono text-gray-600" title={hash}>
      {short}
    </span>
  );
}

function SessionStateBadge({ isActive, isRevoked }: { isActive: boolean; isRevoked: boolean }) {
  if (isRevoked) {
    return (
      <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-red-950/50 text-red-400 border border-red-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
        Revoked
      </span>
    );
  }
  if (isActive) {
    return (
      <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-emerald-950/50 text-emerald-400 border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
        Active
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-orange-950/50 text-orange-400 border border-orange-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
      Expired
    </span>
  );
}

export function Dashboard({ relayer, sessionId, maxTokenSpend, onRevoke }: DashboardProps) {
  const [data, setData] = useState<{ session: any; actions: any[]; totalActions: number }>({
    session: null,
    actions: [],
    totalActions: 0,
  });
  const [timeLeft, setTimeLeft] = useState("00:00");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const fetchDashboard = async () => {
      setIsRefreshing(true);
      const res = await relayer.getDashboardData(sessionId);
      if (!res.error) {
        setData({
          session: res.session,
          actions: res.actions || [],
          totalActions: res.totalActions || 0,
        });
      }
      setIsRefreshing(false);
    };

    fetchDashboard();
    const interval = setInterval(fetchDashboard, 3000);
    return () => clearInterval(interval);
  }, [sessionId, relayer]);

  useEffect(() => {
    if (!data.session || data.session.revoked) {
      setTimeLeft("00:00");
      return;
    }

    const update = () => {
      const now = Math.floor(Date.now() / 1000);
      const rem = data.session.validUntil - now;
      if (rem <= 0) { setTimeLeft("00:00"); return; }
      const m = Math.floor(rem / 60).toString().padStart(2, "0");
      const s = (rem % 60).toString().padStart(2, "0");
      setTimeLeft(`${m}:${s}`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [data.session]);

  const MAX_CALLS = 10;
  const callCount = data.totalActions;
  const maxSpend = Number(BigInt(maxTokenSpend) / BigInt(10 ** 18));
  const tokenSpentRaw = data.session?.tokenSpent ? BigInt(data.session.tokenSpent) : 0n;
  const tokenSpentFormatted = Number(tokenSpentRaw) / 1e18;
  const spendPercent = maxSpend > 0 ? Math.min((tokenSpentFormatted / maxSpend) * 100, 100) : 0;
  const callsPercent = MAX_CALLS > 0 ? Math.min((callCount / MAX_CALLS) * 100, 100) : 0;

  const isActive = data.session && !data.session.revoked && data.session.validUntil > Date.now() / 1000;
  const isRevoked = !!data.session?.revoked;

  return (
    <div className="bg-gray-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 w-full shadow-2xl relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
          Session Activity
        </h2>
        <div className="flex items-center gap-2">
          {isRefreshing && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
          )}
          {sessionId ? (
            <SessionStateBadge isActive={!!isActive} isRevoked={isRevoked} />
          ) : (
            <span className="text-xs px-3 py-1 bg-gray-800 text-gray-500 rounded-full font-bold uppercase tracking-wider">
              No Session
            </span>
          )}
        </div>
      </div>

      {/* Session ID (short) */}
      {sessionId && (
        <div className="relative z-10 mb-4 flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2 border border-white/5">
          <span className="text-gray-600 text-[10px] uppercase tracking-widest">ID</span>
          <span className="text-gray-400 text-[11px] font-mono">
            {sessionId.slice(0, 10)}…{sessionId.slice(-8)}
          </span>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
        {/* Actions */}
        <div className="bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Actions</p>
          <p className="text-2xl font-black text-white mb-1.5">
            <span className={callsPercent >= 90 ? "text-red-400" : "text-cyan-400"}>
              {callCount}
            </span>
            <span className="text-gray-600 text-base"> / {MAX_CALLS}</span>
          </p>
          <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${callsPercent >= 90 ? "bg-red-500" : "bg-gradient-to-r from-cyan-500 to-blue-500"}`}
              style={{ width: `${callsPercent}%` }}
            />
          </div>
        </div>

        {/* Time left */}
        <div className="bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Time Left</p>
          <p className="text-2xl font-black text-white">
            {sessionId && isActive ? (
              <span className={timeLeft === "00:00" ? "text-orange-400" : "text-purple-400"}>
                {timeLeft}
              </span>
            ) : (
              <span className="text-gray-600">00:00</span>
            )}
          </p>
          <p className="text-gray-600 text-[10px] mt-1.5">
            {isRevoked ? "Session revoked" : isActive ? "Until expiry" : "Session ended"}
          </p>
        </div>

        {/* MONAD Spend */}
        <div className="col-span-2 bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 text-[10px] uppercase tracking-widest">MONAD Spent</p>
            <p className="text-lg font-black text-white">
              <span className={spendPercent >= 90 ? "text-red-400" : tokenSpentFormatted > 0 ? "text-pink-400" : "text-gray-500"}>
                {tokenSpentFormatted.toFixed(1)}
              </span>
              <span className="text-gray-600 text-sm"> / {maxSpend}</span>
            </p>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${spendPercent >= 90 ? "bg-red-500" : spendPercent >= 60 ? "bg-orange-500" : "bg-gradient-to-r from-pink-500 to-purple-500"}`}
              style={{ width: `${spendPercent}%` }}
            />
          </div>
          {spendPercent >= 90 && (
            <p className="text-red-400 text-[10px] mt-1.5 font-semibold">⚠ Spend limit almost reached</p>
          )}
        </div>
      </div>

      {/* Action history */}
      <div className="relative z-10 mb-5">
        <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2 mb-3">
          <span className="w-4 h-[1px] bg-gray-700" />
          Recent Actions
          <span className="w-full h-[1px] bg-gradient-to-r from-gray-700 to-transparent" />
        </h3>

        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
          {!sessionId && (
            <p className="text-center py-6 text-gray-600 text-sm">
              Generate a session to start playing
            </p>
          )}
          {sessionId && data.actions.length === 0 && (
            <p className="text-center py-6 text-gray-600 text-sm">
              No actions yet — make a move!
            </p>
          )}
          {data.actions.map((act) => {
            const meta = ACTION_NAMES[act.actionId] ?? {
              label: `ACTION_${act.actionId}`,
              color: "text-gray-400 bg-gray-800/40 border-gray-600/30",
            };
            return (
              <div
                key={act.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 bg-black/40 rounded-xl border border-white/5 hover:border-white/10 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.color}`}
                  >
                    {meta.label}
                  </span>
                  <TxLink hash={act.txHash} />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-gray-600 text-[10px] font-mono">
                    #{act.nonce}
                  </span>
                  <span className="text-emerald-400/80 text-[9px] font-bold bg-emerald-950/30 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                    ✓
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revoke button */}
      <button
        onClick={onRevoke}
        disabled={!sessionId || isRevoked}
        className="relative z-10 w-full py-3 bg-red-950/20 hover:bg-red-900/40 text-red-500 hover:text-red-400 font-bold tracking-widest uppercase text-sm rounded-xl transition-all border border-red-900/50 hover:border-red-500/50 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(239,68,68,0.05)] hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]"
      >
        {isRevoked ? "Session Revoked" : "Revoke Session"}
      </button>

      {/* Warning after revoke */}
      {isRevoked && (
        <p className="relative z-10 mt-3 text-center text-[11px] text-red-500/70 font-medium">
          This session is permanently revoked. All future actions will fail.
        </p>
      )}
    </div>
  );
}
