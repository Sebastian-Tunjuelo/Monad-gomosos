import { useState } from "react";

interface CreateKeyPanelProps {
  onGenerate: (maxCalls: number, maxTokenSpend: string, validUntilMinutes: number) => void;
  isApproving: boolean;
  generatedKeyStr: string | null;
}

export function CreateKeyPanel({ onGenerate, isApproving, generatedKeyStr }: CreateKeyPanelProps) {
  const [maxCalls, setMaxCalls] = useState(10);
  const [maxTokenSpend, setMaxTokenSpend] = useState("50");
  const [validUntilMinutes, setValidUntilMinutes] = useState(1);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (generatedKeyStr) {
      navigator.clipboard.writeText(generatedKeyStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 space-y-6">
      <div>
        <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
          Create Session Key
        </h3>
        <p className="text-gray-400 text-sm">
          Customize the parameters for your session key. Once generated, you can copy and paste it into the Game or Social tabs to use it.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Action Limit (Max Calls)
          </label>
          <input
            type="number"
            min="1"
            value={maxCalls}
            onChange={(e) => setMaxCalls(parseInt(e.target.value) || 1)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            MONAD Spend Limit
          </label>
          <input
            type="number"
            min="0"
            value={maxTokenSpend}
            onChange={(e) => setMaxTokenSpend(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Time Limit (Minutes)
          </label>
          <input
            type="number"
            min="1"
            value={validUntilMinutes}
            onChange={(e) => setValidUntilMinutes(parseInt(e.target.value) || 1)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
      </div>

      <button
        onClick={() => onGenerate(maxCalls, maxTokenSpend, validUntilMinutes)}
        disabled={isApproving}
        className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl font-bold uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
      >
        {isApproving ? (
          <>
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            Generating & Approving...
          </>
        ) : (
          "Generate & Approve Key"
        )}
      </button>

      {generatedKeyStr && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            Your Generated Key (Do not share!)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={generatedKeyStr}
              className="flex-1 bg-black/50 border border-emerald-500/30 rounded-xl px-4 py-2 text-gray-300 font-mono text-xs focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-emerald-950/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-emerald-900/50 transition-all"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-3 leading-relaxed">
            Copy this string and paste it in the Game or Social tabs. It contains the session credentials to play without transaction popups.
          </p>
        </div>
      )}
    </div>
  );
}
