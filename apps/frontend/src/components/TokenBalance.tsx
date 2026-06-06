interface TokenBalanceProps {
  balance: string;
  allowance: string;
  isLoading: boolean;
  isConfigured: boolean;
}

export function TokenBalance({
  balance,
  allowance,
  isLoading,
  isConfigured,
}: TokenBalanceProps) {
  const hasAllowance = parseFloat(allowance) > 0;

  if (!isConfigured) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-md p-4 rounded-2xl border border-white/5 w-full">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-800/50 border border-gray-700/30 text-lg select-none shrink-0 text-gray-600">
              💎
            </div>
            <div>
              <p className="text-gray-600 text-xs uppercase tracking-widest mb-0.5">
                Balance
              </p>
              <p className="text-gray-600 text-sm font-bold leading-none">—</p>
            </div>
          </div>
          <div className="w-px h-8 bg-white/5 shrink-0" />
          <div className="text-right">
            <p className="text-gray-600 text-xs uppercase tracking-widest mb-0.5">
              Approved
            </p>
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-gray-800/60 text-gray-600 border-gray-700/30">
                Not set
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-md p-4 rounded-2xl border border-white/5 w-full">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-2.5 w-16 bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-1.5 text-right">
            <div className="h-2.5 w-20 bg-white/5 rounded animate-pulse ml-auto" />
            <div className="h-4 w-16 bg-white/5 rounded animate-pulse ml-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-md p-4 rounded-2xl border border-white/5 w-full relative overflow-hidden group">
      {/* Ambient glow */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-pink-500/10 rounded-full blur-[40px] group-hover:bg-pink-500/20 transition-colors duration-500 pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-cyan-500/10 rounded-full blur-[40px] group-hover:bg-cyan-500/20 transition-colors duration-500 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Balance */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-pink-500/10 border border-pink-500/20 text-lg select-none shrink-0">
            💎
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-0.5">
              Balance
            </p>
            <p className="text-pink-400 text-sm font-bold leading-none">
              {balance}{" "}
              <span className="text-pink-500/70 text-[10px] font-semibold">
                ARENA
              </span>
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/5 shrink-0" />

        {/* Allowance */}
        <div className="text-right">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-0.5">
            Approved
          </p>
          <div className="flex items-center justify-end gap-1.5">
            <p className="text-cyan-400 text-sm font-bold leading-none">
              {allowance}{" "}
              <span className="text-cyan-500/70 text-[10px] font-semibold">
                ARENA
              </span>
            </p>
            <span
              className={
                hasAllowance
                  ? "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                  : "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-gray-800/60 text-gray-500 border-white/10"
              }
            >
              {hasAllowance ? "Active" : "None"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
