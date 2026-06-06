import { useEffect, useRef, useState } from "react";

interface StatsBarProps {
  actionCount: number;       // total on-chain actions executed this session
  hasActiveSession: boolean;
}

/**
 * StatsBar — The "wow" strip at the top of the app.
 * Shows the core value prop in 5 words + live on-chain metrics.
 */
export function StatsBar({ actionCount, hasActiveSession }: StatsBarProps) {
  const [tps, setTps] = useState<number>(0);
  const prevCountRef = useRef(actionCount);
  const prevTimeRef = useRef(Date.now());

  // Rolling actions/sec estimator
  useEffect(() => {
    if (actionCount !== prevCountRef.current) {
      const now = Date.now();
      const elapsed = (now - prevTimeRef.current) / 1000;
      const delta = actionCount - prevCountRef.current;
      const rate = elapsed > 0 ? delta / elapsed : 0;
      setTps(Math.round(rate * 10) / 10);
      prevCountRef.current = actionCount;
      prevTimeRef.current = now;

      // decay back to 0 after 4s of inactivity
      const timer = setTimeout(() => setTps(0), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionCount]);

  const signaturesSaved = actionCount; // each action = 1 saved signature

  return (
    <div className="w-full mb-8 relative overflow-hidden">
      {/* Background glow strip */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-950/40 via-cyan-950/40 to-purple-950/40 rounded-2xl" />
      <div className="absolute inset-0 border border-cyan-500/10 rounded-2xl" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 rounded-2xl">
        {/* Core tagline */}
        <div className="text-center sm:text-left">
          <p className="text-xl sm:text-2xl font-black tracking-tight">
            <span className="text-white">1 signature</span>
            <span className="text-gray-600 mx-2">→</span>
            <span className="text-cyan-400">infinite actions</span>
            <span className="text-gray-600 mx-2">·</span>
            <span className="text-purple-400">zero popups</span>
          </p>
          <p className="text-gray-600 text-xs mt-0.5 tracking-wider">
            Session Keys for high-frequency on-chain gaming on Monad
          </p>
        </div>

        {/* Live metrics */}
        <div className="flex items-center gap-6 shrink-0">
          {/* Signatures saved */}
          <div className="text-center">
            <p className="text-2xl font-black text-emerald-400 leading-none tabular-nums">
              {signaturesSaved}
            </p>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">
              Sigs Saved
            </p>
          </div>

          <div className="w-px h-8 bg-white/5" />

          {/* Actions on-chain */}
          <div className="text-center">
            <p className="text-2xl font-black text-cyan-400 leading-none tabular-nums">
              {actionCount}
            </p>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">
              On-Chain Txs
            </p>
          </div>

          <div className="w-px h-8 bg-white/5" />

          {/* Live tx/s indicator */}
          <div className="text-center">
            <div className="flex items-center gap-1.5 justify-center">
              {tps > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
              )}
              <p
                className={`text-2xl font-black leading-none tabular-nums ${
                  tps > 0 ? "text-green-400" : "text-gray-700"
                }`}
              >
                {tps > 0 ? tps.toFixed(1) : "—"}
              </p>
            </div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">
              Tx / sec
            </p>
          </div>

          <div className="w-px h-8 bg-white/5" />

          {/* Session status pill */}
          <div className="text-center">
            {hasActiveSession ? (
              <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
                  Live
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-gray-900/40 border border-gray-700/30 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                <span className="text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                  Idle
                </span>
              </div>
            )}
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">
              Session
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
