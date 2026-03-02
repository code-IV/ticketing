"use client";
import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function ManageGames() {
  const [games, setGames] = useState([
    { id: 1, name: 'Cyber Realm', status: 'active', releaseDate: '2025-01-10' },
    { id: 2, name: 'Speed Racer', status: 'maintenance', releaseDate: '2024-12-05' },
  ]);

  const handleStatusChange = (gameId: number, newStatus: string) => {
    setGames(prevGames =>
      prevGames.map(game =>
        game.id === gameId ? { ...game, status: newStatus } : game
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-700';
      case 'closed':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Manage Games</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
          <Plus size={18} /> Create Game
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Game ID</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="px-12 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {games.map((game) => (
              <tr key={game.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-500">#{game.id}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{game.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(game.status)}`}>
                    {game.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-3 items-center">
                  <select
                    value={game.status}
                    onChange={(e) => handleStatusChange(game.id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium uppercase border-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 cursor-pointer ${getStatusColor(
                      game.status
                    )}`}
                    style={{ outline: 'none' }}
                  >
                    <option value="active" className="bg-white text-gray-900">Active</option>
                    <option value="maintenance" className="bg-white text-gray-900">Maintenance</option>
                    <option value="closed" className="bg-white text-gray-900">Closed</option>
                  </select>
                  <button title="Edit" className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                    <Edit size={18} />
                  </button>
                  <button title="Delete" className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}