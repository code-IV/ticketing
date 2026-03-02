"use client";
import { Calendar, Ticket, Users, Edit, Plus } from 'lucide-react';

export default function EventManagement() {
  // Mock Data - In production, this comes from your GET /api/admin/events
  const events = [
    { id: 1, name: "Summer Pro League", sold: 85, total: 100, date: "Aug 15, 2026", status: "Active" },
    { id: 2, name: "Midnight Scrims", sold: 120, total: 120, date: "Aug 20, 2026", status: "Sold Out" },
    { id: 3, name: "Newbie Bootcamp", sold: 12, total: 50, date: "Sept 01, 2026", status: "Draft" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Events Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor occupancy and ticket distribution</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-blue-200">
          <Plus size={20} /> Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {events.map((event) => {
          const occupancyRate = Math.round((event.sold / event.total) * 100);
          
          return (
            <div key={event.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 transition-all group shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                
                {/* Info Section */}
                <div className="flex items-center gap-4 min-w-[250px]">
                  <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{event.name}</h3>
                    <p className="text-sm text-gray-500">{event.date}</p>
                  </div>
                </div>

                {/* Occupancy Logic Section */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                      <Ticket size={14} className="text-blue-500" />
                      <span>{event.sold} / {event.total} TICKETS SOLD</span>
                    </div>
                    <span className={`text-xs font-bold ${occupancyRate > 90 ? 'text-red-500' : 'text-blue-600'}`}>
                      {occupancyRate}% Full
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 rounded-full ${
                        occupancyRate === 100 ? 'bg-red-500' : 
                        occupancyRate > 75 ? 'bg-orange-400' : 'bg-blue-500'
                      }`}
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-6 min-w-[200px]">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest ${
                    event.status === 'Sold Out' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {event.status}
                  </span>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
                      <Edit size={20} />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}