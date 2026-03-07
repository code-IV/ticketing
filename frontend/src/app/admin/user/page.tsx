"use client";
import { useState } from 'react';
import { Search, Trash2, Users, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function UserManagement() {
  const { isDarkTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [users, setUsers] = useState([
    { id: '1', email: 'alex@example.com', role: 'Admin', status: 'Active' },
    { id: '2', email: 'jordan@gaming.com', role: 'User', status: 'Active' },
    { id: '3', email: 'sam@dev.com', role: 'Staff', status: 'Suspended' },
  ]);

  const filteredUsers = users.filter(user => {
    if (roleFilter !== "ALL" && user.role !== roleFilter) return false;
    if (statusFilter !== "ALL" && user.status !== statusFilter) return false;
    return user.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleStatusChange = (userId: string, newStatus: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user => (user.id === userId ? { ...user, status: newStatus } : user))
    );
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user => (user.id === userId ? { ...user, role: newRole } : user))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1
          className={`text-2xl font-black tracking-tight ${
            isDarkTheme ? 'text-white' : 'text-slate-900'
          }`}
        >
          Manage Users
        </h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Users',
            value: users.length.toString(),
            icon: <Users />,
            color: 'text-green-600',
          },
          {
            label: 'Active Users',
            value: users.filter(u => u.status === 'Active').length.toString(),
            icon: <CheckCircle />,
            color: 'text-blue-600',
          },
          {
            label: 'Suspended',
            value: users.filter(u => u.status === 'Suspended').length.toString(),
            icon: <AlertTriangle />,
            color: 'text-red-600',
          },
          {
            label: 'Admins',
            value: users.filter(u => u.role === 'Admin').length.toString(),
            icon: <Shield />,
            color: 'text-purple-600',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border shadow-sm ${
              isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-slate-100'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`${stat.color} bg-opacity-10 p-2 rounded-lg`}>{stat.icon}</div>
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDarkTheme ? 'text-gray-500' : 'text-slate-400'
                }`}
              >
                {stat.label}
              </span>
            </div>
            <div
              className={`text-2xl font-black ${
                isDarkTheme ? 'text-white' : 'text-slate-800'
              }`}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div
        className={`p-3 sm:p-4 rounded-2xl border shadow-sm flex flex-col gap-3 sm:gap-4 ${
          isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-slate-100'
        }`}
      >
        {/* Search Input */}
        <div className="relative w-full">
          <Search
            className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 transition-colors ${
              isDarkTheme
                ? 'text-gray-500 group-focus-within:text-indigo-400'
                : 'text-slate-400 group-focus-within:text-indigo-500'
            }`}
            size={16}
          />
          <input
            type="text"
            placeholder="Search by email..."
            className={`w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm sm:text-base ${
              isDarkTheme
                ? 'bg-[#1a1a1a] text-white placeholder-gray-500'
                : 'bg-slate-50 text-slate-900 placeholder-slate-400'
            }`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters Row */}
        <div className="flex gap-2 sm:gap-3">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className={`flex-1 px-3 sm:px-4 py-2 rounded-xl outline-none transition-all text-sm sm:text-base ${
              isDarkTheme
                ? 'bg-[#1a1a1a] border border-gray-700 text-white focus:border-indigo-500'
                : 'bg-slate-50 border border-slate-200 focus:border-indigo-500'
            }`}
          >
            <option value="ALL">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Staff">Staff</option>
            <option value="User">User</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={`flex-1 px-3 sm:px-4 py-2 rounded-xl outline-none transition-all text-sm sm:text-base ${
              isDarkTheme
                ? 'bg-[#1a1a1a] border border-gray-700 text-white focus:border-indigo-500'
                : 'bg-slate-50 border border-slate-200 focus:border-indigo-500'
            }`}
          >
            <option value="ALL">All Status</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table - Desktop */}
      <div className="hidden lg:block">
        <div
          className={`rounded-2xl border shadow-sm overflow-hidden ${
            isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-slate-200'
          }`}
        >
          <table className="w-full text-left border-collapse">
            <thead
              className={`border-b ${
                isDarkTheme ? 'bg-[#1a1a1a] border-gray-700' : 'bg-gray-50/50 border-slate-200'
              }`}
            >
              <tr
                className={`text-xs font-black uppercase tracking-wider ${
                  isDarkTheme ? 'text-gray-400' : 'text-slate-500'
                }`}
              >
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Role Configuration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkTheme ? 'divide-gray-700' : 'divide-slate-100'}`}>
              {filteredUsers.map(user => (
                <tr
                  key={user.id}
                  className={`transition-colors ${
                    isDarkTheme ? 'hover:bg-gray-800/50' : 'hover:bg-blue-50/30'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black ${
                          isDarkTheme
                            ? 'bg-indigo-900/50 text-indigo-300'
                            : 'bg-gradient-to-tr from-blue-500 to-indigo-500 text-white'
                        }`}
                      >
                        {user.email[0].toUpperCase()}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          isDarkTheme ? 'text-white' : 'text-slate-900'
                        }`}
                      >
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
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                    >
                      <option value="User" className={isDarkTheme ? 'bg-[#1a1a1a]' : ''}>
                        User
                      </option>
                      <option value="Staff" className={isDarkTheme ? 'bg-[#1a1a1a]' : ''}>
                        Staff
                      </option>
                      <option value="Admin" className={isDarkTheme ? 'bg-[#1a1a1a]' : ''}>
                        Admin
                      </option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'Active'
                          ? isDarkTheme
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-green-100 text-green-700'
                          : isDarkTheme
                          ? 'bg-red-900/50 text-red-400'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
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
                        onChange={e => handleStatusChange(user.id, e.target.value)}
                      >
                        <option value="Active" className={isDarkTheme ? 'bg-[#1a1a1a]' : ''}>
                          Active
                        </option>
                        <option value="Suspended" className={isDarkTheme ? 'bg-[#1a1a1a]' : ''}>
                          Suspended
                        </option>
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

      {/* Users Cards - Mobile */}
      <div className="lg:hidden space-y-3">
        {filteredUsers.map(user => (
          <div
            key={user.id}
            className={`p-4 rounded-2xl border shadow-sm ${
              isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-slate-200'
            }`}
          >
            {/* User Header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-black ${
                  isDarkTheme
                    ? 'bg-indigo-900/50 text-indigo-300'
                    : 'bg-gradient-to-tr from-blue-500 to-indigo-500 text-white'
                }`}
              >
                {user.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  isDarkTheme ? 'text-white' : 'text-slate-900'
                }`}>
                  {user.email}
                </p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    user.status === 'Active'
                      ? isDarkTheme
                        ? 'bg-green-900/50 text-green-400'
                        : 'bg-green-100 text-green-700'
                      : isDarkTheme
                      ? 'bg-red-900/50 text-red-400'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {user.status}
                </span>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className={`text-xs font-medium mb-1 block ${
                  isDarkTheme ? 'text-gray-400' : 'text-slate-600'
                }`}>
                  Role
                </label>
                <select
                  className={`w-full text-xs font-medium rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer ${
                    isDarkTheme
                      ? 'bg-[#1a1a1a] border border-gray-700 text-white focus:border-indigo-500'
                      : 'bg-slate-50 border border-slate-200 focus:border-indigo-500'
                  }`}
                  value={user.role}
                  onChange={e => handleRoleChange(user.id, e.target.value)}
                >
                  <option value="User" className={isDarkTheme ? 'bg-[#1a1a1a]' : ''}>
                    User
                  </option>
                  <option value="Staff" className={isDarkTheme ? 'bg-[#1a1a1a]' : ''}>
                    Staff
                  </option>
                  <option value="Admin" className={isDarkTheme ? 'bg-[#1a1a1a]' : ''}>
                    Admin
                  </option>
                </select>
              </div>
              
              <div className="flex-1">
                <label className={`text-xs font-medium mb-1 block ${
                  isDarkTheme ? 'text-gray-400' : 'text-slate-600'
                }`}>
                  Status
                </label>
                <select
                  className={`w-full text-xs font-medium rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer ${
                    isDarkTheme
                      ? 'bg-[#1a1a1a] border border-gray-700 text-white focus:border-indigo-500'
                      : 'bg-slate-50 border border-slate-200 focus:border-indigo-500'
                  }`}
                  value={user.status}
                  onChange={e => handleStatusChange(user.id, e.target.value)}
                >
                  <option value="Active" className={isDarkTheme ? 'bg-[#1a1a1a]' : ''}>
                    Active
                  </option>
                  <option value="Suspended" className={isDarkTheme ? 'bg-[#1a1a1a]' : ''}>
                    Suspended
                  </option>
                </select>
              </div>
              
              <div className="flex items-end">
                <label className={`text-xs font-medium mb-1 block sm:hidden ${
                  isDarkTheme ? 'text-gray-400' : 'text-slate-600'
                }`}>
                  Actions
                </label>
                <button
                  className={`transition-colors p-2 rounded-lg w-full sm:w-auto justify-center flex items-center gap-2 ${
                    isDarkTheme
                      ? 'text-gray-500 hover:bg-red-900/30 hover:text-red-400'
                      : 'text-slate-400 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  <Trash2 size={16} />
                  <span className="text-xs sm:hidden">Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}