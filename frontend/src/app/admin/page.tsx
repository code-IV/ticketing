export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Management Overview</h1>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="flex items-center justify-between p-6 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-200">
          <span className="font-bold text-lg">Create New Game</span>
          <span className="bg-blue-500 p-2 rounded-lg text-2xl">+</span>
        </button>
        <button className="flex items-center justify-between p-6 bg-slate-800 text-white rounded-2xl hover:bg-slate-900 transition">
          <span className="font-bold text-lg">Schedule Event</span>
          <span className="bg-slate-700 p-2 rounded-lg text-2xl">+</span>
        </button>
        <button className="flex items-center justify-between p-6 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 transition">
          <span className="font-bold text-lg text-gray-800">Manage Users</span>
          <span className="text-gray-400">→</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Audit Log */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b bg-gray-50/50">
            <h3 className="font-bold text-gray-700">Recent System Changes</h3>
          </div>
          <div className="p-4 space-y-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Updated status of **Cyber Arena**</span>
              <span className="text-xs text-gray-400">2 mins ago</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Promoted **admin@test.com** to Admin</span>
              <span className="text-xs text-gray-400">1 hour ago</span>
            </div>
          </div>
        </div>

        {/* Low Occupancy/Critical Events */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b bg-gray-50/50">
            <h3 className="font-bold text-gray-700">Events Requiring Action</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
              <span className="text-sm font-medium text-red-700 underline">Friday Night Scrims</span>
              <span className="text-[10px] font-bold text-red-600 uppercase">95% Full</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}