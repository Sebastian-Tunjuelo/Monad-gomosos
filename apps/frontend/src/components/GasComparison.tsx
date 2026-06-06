/**
 * GasComparison — Shows gas costs per action vs doing it directly.
 * Reinforces the argument that Monad makes session keys viable.
 * Data from the forge gas report (reports/gas-report.md).
 */
export function GasComparison() {
  const sessionOverhead = {
    createSession: 162_217,
    executeAction_median: 40_633,
    revokeSession: 58_251,
  };

  // Estimated gas for direct calls (no session key layer)
  const directCosts = {
    simpleTransfer: 21_000,
    erc20Transfer: 65_000,
    contractCall: 35_000,
  };

  // Per-action comparison rows
  const actions = [
    {
      name: "MOVE (game action)",
      withSession: 40_633,
      withoutSession: 45_000, // direct call to DemoGame
      sessionPct: null,
      color: "text-cyan-400",
      icon: "🎮",
    },
    {
      name: "ATTACK",
      withSession: 40_633,
      withoutSession: 44_000,
      color: "text-orange-400",
      icon: "⚔️",
    },
    {
      name: "BUY_ITEM (ERC-20 transfer)",
      withSession: 177_070,
      withoutSession: 65_000 + 44_000, // approve + call
      color: "text-pink-400",
      icon: "💎",
    },
    {
      name: "POST (social)",
      withSession: 40_633,
      withoutSession: 52_000,
      color: "text-purple-400",
      icon: "📢",
    },
  ];

  // Monad cost estimates (gas price ~0.001 gwei, approx)
  const MONAD_GWEI = 0.001;
  const ETH_GWEI = 30; // mainnet busy

  const ETH_USD = 3500;
  const MON_USD = 0.5; // rough estimate for testnet demo

  function gasCost(gas: number, gwei: number, usdPerEth: number) {
    const eth = (gas * gwei) / 1e9;
    return (eth * usdPerEth).toFixed(6);
  }

  const scenarios = [
    {
      label: "Ethereum Mainnet",
      gwei: ETH_GWEI,
      usdPerToken: ETH_USD,
      color: "text-blue-400",
      icon: "🔵",
    },
    {
      label: "Monad Testnet",
      gwei: MONAD_GWEI,
      usdPerToken: MON_USD,
      color: "text-purple-400",
      icon: "⚡",
      highlight: true,
    },
  ];

  const N_ACTIONS = 10; // session length in demo
  const totalSessionGas = sessionOverhead.createSession + N_ACTIONS * sessionOverhead.executeAction_median + sessionOverhead.revokeSession;
  const totalDirectGas = N_ACTIONS * 45_000; // ~direct calls

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-cyan-400">
          Gas Cost Analysis
        </h3>
        <p className="text-gray-600 text-[11px] mt-0.5">
          From <code className="text-gray-500">forge test --gas-report</code> · Why Monad makes this viable
        </p>
      </div>

      {/* Key insight card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "createSession",
            gas: sessionOverhead.createSession.toLocaleString(),
            desc: "One-time setup cost",
            color: "text-purple-400",
            bg: "bg-purple-950/20 border-purple-500/20",
          },
          {
            label: "executeAction",
            gas: `~${sessionOverhead.executeAction_median.toLocaleString()}`,
            desc: "Per action (median)",
            color: "text-cyan-400",
            bg: "bg-cyan-950/20 border-cyan-500/20",
          },
          {
            label: "revokeSession",
            gas: sessionOverhead.revokeSession.toLocaleString(),
            desc: "Instant revocation",
            color: "text-red-400",
            bg: "bg-red-950/20 border-red-500/20",
          },
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl border p-4 ${item.bg}`}>
            <p className={`text-xl font-black ${item.color} leading-none`}>{item.gas}</p>
            <p className="text-white text-xs font-bold mt-1">{item.label}</p>
            <p className="text-gray-600 text-[10px] mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Session vs Direct comparison */}
      <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-4">
          Full session ({N_ACTIONS} actions): Session Key vs Direct Calls
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/30 rounded-xl p-4 border border-purple-500/20">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">With Session Key</p>
            <p className="text-2xl font-black text-purple-400">{totalSessionGas.toLocaleString()}</p>
            <p className="text-gray-600 text-[10px]">total gas</p>
            <p className="text-gray-500 text-[10px] mt-2">
              = 1 createSession + {N_ACTIONS}× execute + 1 revoke
            </p>
          </div>
          <div className="bg-black/30 rounded-xl p-4 border border-gray-600/20">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Without Session Key</p>
            <p className="text-2xl font-black text-gray-400">{totalDirectGas.toLocaleString()}</p>
            <p className="text-gray-600 text-[10px]">total gas</p>
            <p className="text-gray-500 text-[10px] mt-2">
              = {N_ACTIONS}× wallet signature + direct calls
            </p>
          </div>
        </div>
        <div className="mt-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3">
          <p className="text-emerald-400 text-[11px] font-semibold">
            ✓ Session key overhead: ~{Math.round(((totalSessionGas - totalDirectGas) / totalDirectGas) * 100)}% more gas,
            but saves <span className="font-black">{N_ACTIONS} wallet confirmations</span> and enables Monad's full throughput.
          </p>
        </div>
      </div>

      {/* Per-action breakdown */}
      <div className="bg-gray-900/40 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
            Per-action gas breakdown
          </p>
        </div>
        <div className="divide-y divide-white/5">
          {/* Header row */}
          <div className="grid grid-cols-3 px-5 py-2 text-[9px] uppercase tracking-widest text-gray-700">
            <span>Action</span>
            <span className="text-right">With Session Key</span>
            <span className="text-right">Direct</span>
          </div>
          {actions.map((a) => (
            <div key={a.name} className="grid grid-cols-3 items-center px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-base">{a.icon}</span>
                <span className={`text-xs font-bold ${a.color}`}>{a.name}</span>
              </div>
              <div className="text-right">
                <span className="text-white text-xs font-mono font-bold">
                  {a.withSession.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-500 text-xs font-mono">
                  {a.withoutSession.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chain comparison */}
      <div className="bg-gray-900/40 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
            Cost in USD — full session ({N_ACTIONS} actions)
          </p>
        </div>
        <div className="divide-y divide-white/5">
          {scenarios.map((s) => {
            const usd = parseFloat(gasCost(totalSessionGas, s.gwei, s.usdPerToken));
            return (
              <div
                key={s.label}
                className={`flex items-center justify-between px-5 py-4 ${s.highlight ? "bg-purple-950/10" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{s.icon}</span>
                  <div>
                    <p className={`text-sm font-bold ${s.color}`}>{s.label}</p>
                    <p className="text-gray-600 text-[10px]">{s.gwei} gwei gas price</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-black ${s.highlight ? "text-purple-400" : "text-gray-400"}`}>
                    ${usd < 0.001 ? "< $0.001" : `$${usd.toFixed(4)}`}
                  </p>
                  {s.highlight && (
                    <p className="text-emerald-400 text-[10px] font-bold">
                      {N_ACTIONS} on-chain actions for nearly free
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* The Monad argument */}
      <div className="bg-gradient-to-br from-purple-950/30 to-cyan-950/30 border border-purple-500/20 rounded-2xl p-5">
        <h4 className="text-sm font-black text-white mb-3">⚡ Why Monad changes everything</h4>
        <div className="space-y-2">
          {[
            "On Ethereum mainnet, 10 on-chain actions in a game session ≈ $3–15 in gas alone.",
            "On Monad, the same session costs less than $0.001 — making high-frequency apps viable.",
            "Session keys remove the UX friction (wallet popups). Monad removes the cost friction.",
            "Together: a Web2-like experience with full on-chain provability.",
          ].map((line, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-purple-500 text-[10px] mt-0.5 shrink-0">→</span>
              <p className="text-gray-400 text-xs leading-relaxed">{line}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
