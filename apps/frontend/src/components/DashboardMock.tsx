export function DashboardMock() {
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-full">
      <h2 className="text-xl font-bold mb-6 text-white flex items-center justify-between">
        <span>Session Activity</span>
        <span className="text-sm px-3 py-1 bg-green-900 text-green-400 rounded-full">Active</span>
      </h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 p-4 rounded-lg">
          <p className="text-gray-400 text-sm mb-1">Actions Used</p>
          <p className="text-2xl font-bold text-white">4 / 10</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg">
          <p className="text-gray-400 text-sm mb-1">MONAD Spent</p>
          <p className="text-2xl font-bold text-white">10 / 50</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Actions</h3>
        {[
          { id: 1, action: "BUY_ITEM", status: "Success", time: "2 mins ago" },
          { id: 2, action: "MOVE", status: "Success", time: "3 mins ago" },
          { id: 3, action: "MOVE", status: "Success", time: "3 mins ago" },
        ].map((act) => (
          <div key={act.id} className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
            <div>
              <p className="text-white font-medium text-sm">{act.action}</p>
              <p className="text-gray-500 text-xs">{act.time}</p>
            </div>
            <span className="text-green-400 text-sm font-medium">{act.status}</span>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 py-2 bg-gray-700 hover:bg-gray-600 text-red-400 font-semibold rounded-lg transition-colors border border-gray-600">
        Revoke Session
      </button>
    </div>
  );
}
