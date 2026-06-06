import { useState, useRef } from "react";

interface AutoPlayProps {
  onAutoAction: () => Promise<void>;
  hasSession: boolean;
  isExecuting: boolean;
  burstCount?: number; // how many actions to fire
}

/**
 * AutoPlay — "Stress Test" button for hackathon demo.
 * Fires N actions in quick succession to show Monad + session key throughput.
 * Each action goes on-chain via the relayer. No wallet popups.
 */
export function AutoPlay({
  onAutoAction,
  hasSession,
  isExecuting,
  burstCount = 5,
}: AutoPlayProps) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number>(0);
  const abortRef = useRef(false);

  const handleStart = async () => {
    if (!hasSession || running || isExecuting) return;

    abortRef.current = false;
    setRunning(true);
    setProgress(0);
    setCompleted(0);
    setElapsed(0);
    const t0 = Date.now();
    setStartTime(t0);

    for (let i = 0; i < burstCount; i++) {
      if (abortRef.current) break;
      try {
        await onAutoAction();
        setCompleted((c) => c + 1);
      } catch {
        // individual action may fail (e.g. spend limit), keep going
      }
      setProgress(Math.round(((i + 1) / burstCount) * 100));
    }

    setElapsed(Math.round((Date.now() - t0) / 100) / 10);
    setRunning(false);
  };

  const handleStop = () => {
    abortRef.current = true;
  };

  return (
    <div className="mt-6 bg-gray-900/50 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
      {/* Ambient glow when running */}
      {running && (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 animate-pulse pointer-events-none rounded-2xl" />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">
              Monad Speed Test
            </p>
            <p className="text-gray-600 text-[10px] mt-0.5">
              Fire {burstCount} on-chain txs · zero wallet popups
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-cyan-950/40 text-cyan-500 border border-cyan-500/20">
            ⚡ Auto
          </span>
        </div>

        {/* Progress bar */}
        {(running || completed > 0) && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-600">
                {completed} / {burstCount} actions
              </span>
              {!running && elapsed > 0 && (
                <span className="text-[10px] text-cyan-400 font-bold">
                  {elapsed}s · {Math.round((completed / elapsed) * 10) / 10} tx/s
                </span>
              )}
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Result card */}
        {!running && completed > 0 && elapsed > 0 && (
          <div className="mb-3 bg-black/30 rounded-xl px-4 py-3 border border-white/5">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xl font-black text-cyan-400">{completed}</p>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider">Txs sent</p>
              </div>
              <div className="w-px h-8 bg-white/5" />
              <div className="text-center">
                <p className="text-xl font-black text-purple-400">{elapsed}s</p>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider">Total time</p>
              </div>
              <div className="w-px h-8 bg-white/5" />
              <div className="text-center">
                <p className="text-xl font-black text-emerald-400">0</p>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider">Wallet popups</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-600 mt-2 text-center">
              Without session keys: <span className="text-gray-400 font-semibold">{completed} wallet confirmation{completed !== 1 ? "s" : ""}</span> required
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleStart}
            disabled={!hasSession || running || isExecuting}
            className="flex-1 py-2.5 bg-gradient-to-r from-cyan-900/50 to-purple-900/50 hover:from-cyan-800/60 hover:to-purple-800/60 text-white font-black uppercase tracking-widest text-[11px] rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {running
              ? `Firing ${completed + 1}/${burstCount}…`
              : `⚡ Fire ${burstCount} Actions`}
          </button>
          {running && (
            <button
              onClick={handleStop}
              className="px-4 py-2.5 bg-red-950/40 hover:bg-red-900/50 text-red-400 font-bold uppercase tracking-widest text-[10px] rounded-xl border border-red-500/20 transition-all"
            >
              Stop
            </button>
          )}
        </div>

        {!hasSession && (
          <p className="text-[10px] text-gray-700 text-center mt-2">
            Create a session first to enable auto-play
          </p>
        )}
      </div>
    </div>
  );
}
