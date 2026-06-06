import React from 'react';

interface GameBoardProps {
  playerPos: number;
}

export function GameBoard({ playerPos }: GameBoardProps) {
  const cells = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div className="relative p-8 bg-gray-950/80 backdrop-blur-xl rounded-3xl border border-cyan-500/20 shadow-[0_0_50px_rgba(0,255,255,0.05)] overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="relative grid grid-cols-5 gap-3">
        {cells.map((cell) => {
          const isPlayer = cell === playerPos;
          return (
            <div 
              key={cell} 
              className={`
                w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all duration-300
                ${isPlayer 
                  ? 'bg-cyan-500 text-black shadow-[0_0_30px_rgba(6,182,212,0.6)] border border-cyan-300 scale-110 z-10' 
                  : 'bg-black/60 border border-white/5 shadow-inner hover:border-cyan-500/30 hover:bg-cyan-950/30'
                }
              `}
            >
              {isPlayer ? '⚡' : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}
