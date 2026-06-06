/**
 * ArchitecturePanel — Technical section for hackathon judges.
 * Shows the full flow, security guarantees, and why Monad matters.
 */
export function ArchitecturePanel() {
  const steps = [
    {
      icon: "🔐",
      label: "Owner signs once",
      desc: "EIP-712 session grant with time limit, action whitelist & spend cap",
      color: "border-purple-500/40 bg-purple-950/20",
      textColor: "text-purple-400",
    },
    {
      icon: "🔑",
      label: "Session key generated",
      desc: "Temporary keypair in browser memory — never transmitted, never holds ETH",
      color: "border-cyan-500/40 bg-cyan-950/20",
      textColor: "text-cyan-400",
    },
    {
      icon: "⚡",
      label: "Actions fire instantly",
      desc: "Session key signs each action locally — no wallet popups at all",
      color: "border-blue-500/40 bg-blue-950/20",
      textColor: "text-blue-400",
    },
    {
      icon: "🔁",
      label: "Relayer submits tx",
      desc: "Express + Viem backend relays to Monad — simulates before sending",
      color: "border-orange-500/40 bg-orange-950/20",
      textColor: "text-orange-400",
    },
    {
      icon: "✅",
      label: "Contract validates",
      desc: "SessionManager checks: sig · nonce · expiry · allowed actions · spend limit",
      color: "border-emerald-500/40 bg-emerald-950/20",
      textColor: "text-emerald-400",
    },
    {
      icon: "🚫",
      label: "Instant revocation",
      desc: "One on-chain tx — all future actions blocked immediately, forever",
      color: "border-red-500/40 bg-red-950/20",
      textColor: "text-red-400",
    },
  ];

  const guarantees = [
    "Revoked session never executes — verified by invariant tests (128k calls)",
    "Expired session never executes",
    "Nonce prevents replay attacks",
    "callCount ≤ maxCalls enforced on-chain",
    "tokenSpent ≤ maxTokenSpend enforced on-chain",
    "EIP-712 domain binding prevents cross-chain replays",
  ];

  const techStack = [
    "Solidity 0.8.26",
    "EIP-712",
    "Foundry",
    "Fuzz tests",
    "Invariant tests",
    "Viem",
    "Wagmi",
    "React + Vite",
    "Express",
    "SQLite",
    "Monad Testnet",
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Flow */}
      <div className="lg:col-span-2 bg-gray-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 mb-1">
            How It Works
          </h2>
          <p className="text-gray-600 text-xs mb-5">Session key flow end-to-end</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-xl border ${step.color}`}
              >
                <span className="text-xl shrink-0 leading-none mt-0.5">{step.icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 text-[10px] font-mono">0{i + 1}</span>
                    <p className={`text-xs font-bold uppercase tracking-wide ${step.textColor}`}>
                      {step.label}
                    </p>
                  </div>
                  <p className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Stack */}
          <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-white/5">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-gray-800/60 text-gray-500 border border-white/5"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right column: security + why monad */}
      <div className="flex flex-col gap-6">
        {/* Security guarantees */}
        <div className="bg-gray-900/50 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-xl">
          <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
            <span className="text-lg">🛡</span> Security Guarantees
          </h3>
          <div className="space-y-2">
            {guarantees.map((g) => (
              <div key={g} className="flex items-start gap-2">
                <span className="text-emerald-500 text-[10px] font-bold mt-0.5 shrink-0">✓</span>
                <p className="text-gray-500 text-[11px] leading-relaxed">{g}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why Monad */}
        <div className="bg-gradient-to-br from-purple-950/40 to-cyan-950/40 p-5 rounded-2xl border border-purple-500/20 shadow-xl relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
              <span className="text-lg">⚡</span> Why Monad?
            </h3>
            <p className="text-gray-400 text-xs leading-relaxed mb-3">
              On a slow chain, 30 on-chain actions costs too much time and money to be playable.
              <span className="text-white font-semibold"> On Monad, this entire game session costs less than $0.001 in gas.</span>
            </p>
            <p className="text-gray-400 text-xs leading-relaxed mb-4">
              Session keys make Monad's throughput <span className="text-cyan-400 font-semibold">usable</span> — the user feels a Web2 experience while every action is provably on-chain.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5">
                <p className="text-xl font-black text-cyan-400">10,000+</p>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider mt-0.5">TPS on Monad</p>
              </div>
              <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5">
                <p className="text-xl font-black text-purple-400">1</p>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider mt-0.5">Signature for N actions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
