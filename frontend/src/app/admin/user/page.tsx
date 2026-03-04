"use client";
import { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function UserManagement() {
  const { isDarkTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([
    { id: '1', email: 'alex@example.com', role: 'Admin', status: 'Active' },
    { id: '2', email: 'jordan@gaming.com', role: 'User', status: 'Active' },
    { id: '3', email: 'sam@dev.com', role: 'Staff', status: 'Suspended' },
  ]);

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = (userId: string, newStatus: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, status: newStatus } : user
      )
    );
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className={`text-2xl font-black tracking-tight ${
          isDarkTheme ? 'text-white' : 'text-slate-900'
        }`}>
          Manage Users
        </h1>
        
        {/* Search by Email */}
        <div className="relative group">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
              isDarkTheme 
                ? 'text-gray-500 group-focus-within:text-indigo-400' 
                : 'text-slate-400 group-focus-within:text-indigo-500'
            }`}
            size={18}
          />
          <input 
            type="text"
            placeholder="Search by email..."
            className={`pl-10 pr-4 py-2 rounded-xl w-full md:w-80 outline-none transition-all ${
              isDarkTheme
                ? 'bg-[#1a1a1a] border border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500'
                : 'bg-slate-50 border border-slate-200 focus:border-indigo-500'
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${
        isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-slate-200'
      }`}>
        <table className="w-full text-left border-collapse">
          <thead className={`border-b ${
            isDarkTheme ? 'bg-[#1a1a1a] border-gray-700' : 'bg-gray-50/50 border-slate-200'
          }`}>
            <tr className={`text-xs font-black uppercase tracking-wider ${
              isDarkTheme ? 'text-gray-400' : 'text-slate-500'
            }`}>
              <th className="px-6 py-4">User Details</th>
              <th className="px-6 py-4">Role Configuration</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${
            isDarkTheme ? 'divide-gray-700' : 'divide-slate-100'
          }`}>
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className={`transition-colors ${
                  isDarkTheme
                    ? 'hover:bg-gray-800/50'
                    : 'hover:bg-blue-50/30'
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black ${
                      isDarkTheme
                        ? 'bg-indigo-900/50 text-indigo-300'
                        : 'bg-gradient-to-tr from-blue-500 to-indigo-500 text-white'
                    }`}>
                      {user.email[0].toUpperCase()}
                    </div>
                    <span className={`text-sm font-medium ${
                      isDarkTheme ? 'text-white' : 'text-slate-900'
                    }`}>
                      {user.email}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    className={`text-xs font-medium rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/20 w-24 cursor-pointer ${
                      isDarkTheme
                        ? 'bg-[#1a1a1a] border border-gray-700 text-white focus:border-indigo-500'
                        : 'bg-slate-50 border border-slate-200 focus:border-indigo-500'
                    }`}
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  >
                    <option value="User" className={isDarkTheme ? 'bg-[#1a1a1a]' : ''}>User</option>
                    <option value="Staff" className={isDarkTheme ? 'bg-[#1a1a1a]' : ''}>Staff</option>
                    <option value="Admin" className={isDarkTheme ? 'bg-[#1a1a1a]' : ''}>Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.status === 'Active'
                      ? isDarkTheme
                        ? 'bg-green-900/50 text-green-400'
                        : 'bg-green-100 text-green-700'
                      : isDarkTheme
                        ? 'bg-red-900/50 text-red-400'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <select
                      className={`text-xs font-medium rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/20 w-24 cursor-pointer ${
                        isDarkTheme
                          ? 'bg-[#1a1a1a] border border-gray-700 text-white focus:border-indigo-500'
                          : 'bg-slate-50 border border-slate-200 focus:border-indigo-500'
                      }`}
                      value={user.status}
                      onChange={(e) => handleStatusChange(user.id, e.target.value)}
                    >
                      <option value="Active" className={isDarkTheme ? 'bg-[#1a1a1a]' : ''}>Active</option>
                      <option value="Suspended" className={isDarkTheme ? 'bg-[#1a1a1a]' : ''}>Suspended</option>
                    </select>
                    <button
                      className={`transition-colors p-2 rounded-lg ${
                        isDarkTheme
                          ? 'text-gray-500 hover:bg-red-900/30 hover:text-red-400'
                          : 'text-slate-400 hover:bg-red-50 hover:text-red-600'
                      }`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}