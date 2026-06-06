import { useState } from "react";

interface KeyImporterProps {
  onImport: (keyStr: string) => void;
}

export function KeyImporter({ onImport }: KeyImporterProps) {
  const [keyStr, setKeyStr] = useState("");

  return (
    <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-sm font-black text-white mb-2 uppercase tracking-wider">
          No Active Session
        </h3>
        <p className="text-gray-400 text-xs leading-relaxed">
          You need an active session key to interact with this environment. Paste your generated key below. If you don't have one, go to the 🔑 Create Key tab.
        </p>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Paste key here..."
          value={keyStr}
          onChange={(e) => setKeyStr(e.target.value)}
          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
        />
        <button
          onClick={() => onImport(keyStr)}
          disabled={!keyStr}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Activate Key
        </button>
      </div>
    </div>
  );
}
