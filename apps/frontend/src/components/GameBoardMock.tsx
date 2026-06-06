export function GameBoardMock() {
  // Generar tablero 5x5
  const cells = Array.from({ length: 25 }, (_, i) => i);
  const playerPos = 12; // Centro

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-5 gap-2 bg-gray-800 p-4 rounded-xl border border-gray-700">
        {cells.map((cell) => (
          <div 
            key={cell} 
            className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl
              ${cell === playerPos ? 'bg-blue-500' : 'bg-gray-900'}`}
          >
            {cell === playerPos && '🏃'}
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex gap-4">
        <button className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl border border-gray-700 shadow-lg">
          Move
        </button>
        <button className="px-6 py-3 bg-red-900 hover:bg-red-800 text-red-100 font-bold rounded-xl border border-red-700 shadow-lg">
          Attack
        </button>
        <button className="px-6 py-3 bg-green-900 hover:bg-green-800 text-green-100 font-bold rounded-xl border border-green-700 shadow-lg">
          Collect
        </button>
      </div>
    </div>
  );
}
