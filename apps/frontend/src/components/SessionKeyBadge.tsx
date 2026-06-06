import { useState } from "react";

interface SessionKeyBadgeProps {
  address: string;
  explorerUrl?: string;
}

/**
 * SessionKeyBadge — Shows the ephemeral session key address.
 * Copyable, optionally links to explorer, and clearly labeled EPHEMERAL.
 * This is a key demo talking point: the key was generated locally,
 * never held ETH, and only has the permissions you granted.
 */
export function SessionKeyBadge({ address, explorerUrl }: SessionKeyBadgeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  const short = `${address.slice(0, 8)}…${address.slice(-6)}`;
  const explorerLink = explorerUrl ? `${explorerUrl}/address/${address}` : null;

  return (
    <div className="flex items-center gap-2 bg-purple-950/30 border border-purple-500/20 rounded-xl px-3 py-2">
      {/* Ephemeral badge */}
      <span className="text-[9px] font-black uppercase tracking-widest text-purple-400 bg-purple-900/40 border border-purple-500/30 px-1.5 py-0.5 rounded-md shrink-0">
        EPHEMERAL
      </span>

      {/* Address */}
      <span className="text-purple-300 font-mono text-[11px]">{short}</span>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        title="Copy session key address"
        className="text-gray-600 hover:text-purple-400 transition-colors text-xs"
      >
        {copied ? (
          <span className="text-emerald-400 text-[10px] font-bold">✓</span>
        ) : (
          <span>⎘</span>
        )}
      </button>

      {/* Explorer link */}
      {explorerLink && (
        <a
          href={explorerLink}
          target="_blank"
          rel="noopener noreferrer"
          title="View on explorer"
          className="text-gray-600 hover:text-cyan-400 transition-colors text-xs"
        >
          ↗
        </a>
      )}
    </div>
  );
}
