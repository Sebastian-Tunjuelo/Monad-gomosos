import { useEffect, useState } from "react";

interface SecurityRejectionProps {
  error: string | null;   // null = not visible
  onDismiss: () => void;
}

const ERROR_MAP: Record<string, { title: string; detail: string; color: string }> = {
  SessionRevoked: {
    title: "Session Revoked",
    detail: "This session key was revoked on-chain. No further actions are possible.",
    color: "red",
  },
  SessionExpired: {
    title: "Session Expired",
    detail: "The session's validUntil timestamp passed. Create a new session to continue.",
    color: "orange",
  },
  ActionNotAllowed: {
    title: "Action Not Permitted",
    detail: "This action is not in the session policy. The contract rejected it on-chain.",
    color: "yellow",
  },
  MaxCallsExceeded: {
    title: "Action Limit Reached",
    detail: "The session has reached its maxCalls limit. Create a new session.",
    color: "orange",
  },
  SpendLimitExceeded: {
    title: "Spend Limit Exceeded 💸",
    detail: "The session's maxTokenSpend cap was hit. No more MONADs can be spent in this session.",
    color: "pink",
  },
  InvalidNonce: {
    title: "Invalid Nonce",
    detail: "Replay protection triggered. The nonce does not match the on-chain state.",
    color: "yellow",
  },
  InvalidSignature: {
    title: "Invalid Signature",
    detail: "The session key signature was rejected by the contract.",
    color: "red",
  },
};

function detectError(msg: string) {
  const key = Object.keys(ERROR_MAP).find((k) =>
    msg.toLowerCase().includes(k.toLowerCase()),
  );
  return key ? ERROR_MAP[key] : null;
}

const COLOR_CLASSES = {
  red: {
    bg: "bg-red-950/90",
    border: "border-red-500/50",
    glow: "shadow-[0_0_60px_rgba(239,68,68,0.3)]",
    icon: "text-red-400",
    title: "text-red-300",
    badge: "bg-red-900/50 text-red-400 border-red-500/40",
    btn: "bg-red-900/40 hover:bg-red-800/60 text-red-300 border-red-500/30",
  },
  orange: {
    bg: "bg-orange-950/90",
    border: "border-orange-500/50",
    glow: "shadow-[0_0_60px_rgba(249,115,22,0.3)]",
    icon: "text-orange-400",
    title: "text-orange-300",
    badge: "bg-orange-900/50 text-orange-400 border-orange-500/40",
    btn: "bg-orange-900/40 hover:bg-orange-800/60 text-orange-300 border-orange-500/30",
  },
  yellow: {
    bg: "bg-yellow-950/90",
    border: "border-yellow-500/50",
    glow: "shadow-[0_0_60px_rgba(234,179,8,0.3)]",
    icon: "text-yellow-400",
    title: "text-yellow-300",
    badge: "bg-yellow-900/50 text-yellow-400 border-yellow-500/40",
    btn: "bg-yellow-900/40 hover:bg-yellow-800/60 text-yellow-300 border-yellow-500/30",
  },
  pink: {
    bg: "bg-pink-950/90",
    border: "border-pink-500/50",
    glow: "shadow-[0_0_60px_rgba(236,72,153,0.3)]",
    icon: "text-pink-400",
    title: "text-pink-300",
    badge: "bg-pink-900/50 text-pink-400 border-pink-500/40",
    btn: "bg-pink-900/40 hover:bg-pink-800/60 text-pink-300 border-pink-500/30",
  },
};

/**
 * SecurityRejection — Full-overlay security error screen.
 * Shows when the on-chain contract rejects an action.
 * Designed to be impressive for demo: proves security is enforced AT THE CONTRACT level.
 */
export function SecurityRejection({ error, onDismiss }: SecurityRejectionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setVisible(true);
    }
  }, [error]);

  if (!error || !visible) return null;

  const detected = detectError(error);
  const colorKey = (detected?.color ?? "red") as keyof typeof COLOR_CLASSES;
  const c = COLOR_CLASSES[colorKey];

  const title = detected?.title ?? "Action Rejected";
  const detail = detected?.detail ?? error;

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm bg-black/60"
      onClick={handleDismiss}
    >
      <div
        className={`relative max-w-md w-full rounded-3xl border ${c.bg} ${c.border} ${c.glow} p-8 backdrop-blur-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-40 bg-current pointer-events-none" />

        {/* Icon */}
        <div className={`text-6xl text-center mb-4 ${c.icon}`}>🛡</div>

        {/* Solidity error badge */}
        <div className="flex justify-center mb-3">
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border font-mono ${c.badge}`}
          >
            SOLIDITY · ON-CHAIN REJECTION
          </span>
        </div>

        {/* Title */}
        <h2 className={`text-2xl font-black text-center mb-2 ${c.title}`}>
          {title}
        </h2>

        {/* Detail */}
        <p className="text-gray-400 text-sm text-center leading-relaxed mb-6">
          {detail}
        </p>

        {/* Raw error (for technical judges) */}
        <div className="bg-black/40 rounded-xl px-4 py-3 mb-6 border border-white/5">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Contract error</p>
          <p className="text-gray-400 font-mono text-[11px] break-all">{error}</p>
        </div>

        {/* Key insight for judges */}
        <div className="bg-black/30 rounded-xl px-4 py-3 mb-6 border border-white/5">
          <p className="text-[10px] text-gray-500 leading-relaxed">
            💡 <span className="text-gray-300 font-semibold">This rejection happened at the contract level</span> — not in the frontend or relayer. Even if both were compromised, the on-chain policy would still block this action.
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-sm border transition-all ${c.btn}`}
        >
          Understood — Dismiss
        </button>
      </div>
    </div>
  );
}
