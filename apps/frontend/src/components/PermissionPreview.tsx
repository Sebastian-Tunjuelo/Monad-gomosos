interface PermissionPreviewProps {
  onApprove: () => void;
  isApproving?: boolean;
}

export function PermissionPreview({
  onApprove,
  isApproving = false,
}: PermissionPreviewProps) {
  const permissions = [
    {
      label: "Target contract",
      value: "DemoGame only",
      icon: "🎮",
      color: "text-cyan-400",
      bg: "bg-cyan-950/30 border-cyan-500/20",
    },
    {
      label: "Allowed actions",
      value: "MOVE · ATTACK · COLLECT · BUY_ITEM",
      icon: "⚡",
      color: "text-purple-400",
      bg: "bg-purple-950/30 border-purple-500/20",
    },
    {
      label: "Valid for",
      value: "1 Minute",
      icon: "⏱",
      color: "text-blue-400",
      bg: "bg-blue-950/30 border-blue-500/20",
    },
    {
      label: "Max actions",
      value: "10 calls",
      icon: "🔢",
      color: "text-orange-400",
      bg: "bg-orange-950/30 border-orange-500/20",
    },
    {
      label: "Spend limit",
      value: "50 ARENA max",
      icon: "💎",
      color: "text-pink-400",
      bg: "bg-pink-950/30 border-pink-500/20",
    },
    {
      label: "Revocable",
      value: "Anytime, instantly on-chain",
      icon: "🛡",
      color: "text-emerald-400",
      bg: "bg-emerald-950/30 border-emerald-500/20",
    },
  ];

  const guarantees = [
    "Session key generated locally — never leaves browser",
    "Permissions enforced at contract level, not frontend",
    "Nonce prevents replay attacks",
    "One revocation tx kills the key permanently",
  ];

  return (
    <div className="bg-gray-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 w-full shadow-2xl relative overflow-hidden group">
      {/* Ambient glows */}
      <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-500/15 rounded-full blur-[60px] group-hover:bg-purple-500/25 transition-colors duration-700 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-cyan-500/15 rounded-full blur-[60px] group-hover:bg-cyan-500/25 transition-colors duration-700 pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
            Authorize Session
          </h2>
          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 mt-0.5">
            EIP-712
          </span>
        </div>
        <p className="text-gray-500 text-xs mb-5 leading-relaxed">
          Sign <span className="text-white font-semibold">once</span> to create a temporary session key.
          Play without wallet popups. Revoke anytime.
        </p>

        {/* Permissions grid */}
        <div className="grid grid-cols-1 gap-2 mb-5">
          {permissions.map((p) => (
            <div
              key={p.label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${p.bg} transition-colors`}
            >
              <span className="text-lg shrink-0 leading-none">{p.icon}</span>
              <div className="flex items-center justify-between w-full min-w-0">
                <span className="text-gray-500 text-[10px] uppercase tracking-wider shrink-0 mr-3">
                  {p.label}
                </span>
                <span className={`text-xs font-bold ${p.color} text-right`}>
                  {p.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Security guarantees */}
        <div className="bg-black/30 rounded-xl px-4 py-3 mb-5 border border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">
            Security guarantees
          </p>
          <div className="space-y-1.5">
            {guarantees.map((g) => (
              <div key={g} className="flex items-start gap-2">
                <span className="text-emerald-500 text-[10px] mt-0.5 shrink-0">✓</span>
                <p className="text-gray-500 text-[11px] leading-relaxed">{g}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onApprove}
          disabled={isApproving}
          className="w-full py-4 bg-gradient-to-r from-purple-600/80 to-cyan-600/80 hover:from-purple-500 hover:to-cyan-500 text-white font-black tracking-widest uppercase text-sm rounded-xl transition-all border border-white/10 hover:border-white/30 shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {isApproving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Approving On-Chain…
            </span>
          ) : (
            "✦ Approve Session — Sign Once"
          )}
        </button>

        <p className="text-center text-gray-700 text-[10px] mt-3">
          This is the only wallet signature needed to play
        </p>
      </div>
    </div>
  );
}
