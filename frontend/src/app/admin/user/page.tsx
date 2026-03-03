"use client";
import { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';

export default function UserManagement() {
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
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Manage Users</h1>
        
        {/* Search by Email */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search by email..."
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl w-full md:w-80 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/50 border-b border-gray-200">
            <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">User Details</th>
              <th className="px-6 py-4">Role Configuration</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-accent flex items-center justify-center text-white text-xs font-bold">
                      {user.email[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{user.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select 
                    className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 cursor-pointer w-24"
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  >
                    <option value="User">User</option>
                    <option value="Staff">Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <select
                      className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 cursor-pointer w-24"
                      value={user.status}
                      onChange={(e) => handleStatusChange(user.id, e.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                    <button className="text-gray-400 hover:text-red-600 transition-colors p-2">
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