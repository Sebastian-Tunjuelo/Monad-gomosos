import React from 'react';

interface ActionControlsProps {
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onAttack: () => void;
  onCollect: () => void;
  isExecuting: boolean;
}

export function ActionControls({ onMove, onAttack, onCollect, isExecuting }: ActionControlsProps) {
  return (
    <div className="flex flex-col items-center gap-8 mt-10">
      <div className="grid grid-cols-3 gap-3">
        <div />
        <button 
          onClick={() => onMove('up')} 
          disabled={isExecuting}
          className="w-16 h-16 bg-gray-900/90 hover:bg-cyan-900/80 disabled:opacity-40 border border-gray-700 hover:border-cyan-400 rounded-2xl flex items-center justify-center text-cyan-50 font-bold text-2xl shadow-[0_6px_0_rgb(17,24,39)] hover:shadow-[0_2px_0_rgb(8,145,178)] hover:translate-y-[4px] transition-all"
        >
          W
        </button>
        <div />
        <button 
          onClick={() => onMove('left')} 
          disabled={isExecuting}
          className="w-16 h-16 bg-gray-900/90 hover:bg-cyan-900/80 disabled:opacity-40 border border-gray-700 hover:border-cyan-400 rounded-2xl flex items-center justify-center text-cyan-50 font-bold text-2xl shadow-[0_6px_0_rgb(17,24,39)] hover:shadow-[0_2px_0_rgb(8,145,178)] hover:translate-y-[4px] transition-all"
        >
          A
        </button>
        <button 
          onClick={() => onMove('down')} 
          disabled={isExecuting}
          className="w-16 h-16 bg-gray-900/90 hover:bg-cyan-900/80 disabled:opacity-40 border border-gray-700 hover:border-cyan-400 rounded-2xl flex items-center justify-center text-cyan-50 font-bold text-2xl shadow-[0_6px_0_rgb(17,24,39)] hover:shadow-[0_2px_0_rgb(8,145,178)] hover:translate-y-[4px] transition-all"
        >
          S
        </button>
        <button 
          onClick={() => onMove('right')} 
          disabled={isExecuting}
          className="w-16 h-16 bg-gray-900/90 hover:bg-cyan-900/80 disabled:opacity-40 border border-gray-700 hover:border-cyan-400 rounded-2xl flex items-center justify-center text-cyan-50 font-bold text-2xl shadow-[0_6px_0_rgb(17,24,39)] hover:shadow-[0_2px_0_rgb(8,145,178)] hover:translate-y-[4px] transition-all"
        >
          D
        </button>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={onAttack} 
          disabled={isExecuting}
          className="px-8 py-4 bg-red-950/40 hover:bg-red-900/60 text-red-400 font-black tracking-[0.2em] uppercase rounded-xl border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all"
        >
          Attack
        </button>
        <button 
          onClick={onCollect} 
          disabled={isExecuting}
          className="px-8 py-4 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 font-black tracking-[0.2em] uppercase rounded-xl border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all"
        >
          Collect
        </button>

      </div>
    </div>
  );
}
