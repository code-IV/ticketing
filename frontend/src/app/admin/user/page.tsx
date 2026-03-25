"use client";
import { useState, useEffect } from 'react';
import { Search, Trash2, Users, AlertTriangle, CheckCircle, Shield, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { adminService } from '@/services/adminService';
import { User } from '@/types';

export default function UserManagement() {
  const { isDarkTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning';
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersPerPage] = useState(15);

  const roleOptions = [
    { value: 'VISITOR', label: 'Visitor' },
    { value: 'STAFF', label: 'Staff' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'SUPERADMIN', label: 'Super Admin' },
  ];

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 6000);
  };

  const showConfirmDialog = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' = 'danger') => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm, type });
  };

  const hideConfirmDialog = () => setConfirmDialog(null);

  const goToPage = (page: number) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };
  const goToPreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };

  useEffect(() => {
    loadUsers();
  }, [currentPage, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiRole = roleFilter === "ALL" ? undefined : roleFilter;
      const apiStatus = statusFilter === "ALL" ? undefined : statusFilter.toLowerCase();
      const response = await adminService.getAllUsers(currentPage, usersPerPage, apiRole, apiStatus);
      
      let usersData = response.data?.data || response.data?.users || response.data || [];
      const paginationData = response.data?.pagination;
      
      usersData = usersData.map((user: any) => ({
        ...user,
        role: user.role_name || user.role || 'VISITOR'
      }));
      
      if (paginationData) {
        setTotalPages(paginationData.totalPages || 0);
        setTotalUsers(paginationData.total || 0);
      }
      setUsers(usersData);
    } catch (err: any) {
      setError(`Failed to load users: ${err.message || 'Unknown error'}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    showConfirmDialog('Delete User', `Are you sure you want to delete user "${userEmail}"?`, async () => {
      try {
        await adminService.toggleUserActive(userId);
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        showNotification('success', `User "${userEmail}" has been deleted.`);
      } catch (err: any) {
        showNotification('error', `Failed to delete: ${err.message}`);
      }
    });
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      setUpdatingUsers(prev => new Set(prev).add(userId));
      await adminService.toggleUserActive(userId);
      setUsers(prevUsers => prevUsers.map(user => (user.id === userId ? { ...user, is_active: newStatus === 'Active' } : user)));
      showNotification('success', `User status updated to ${newStatus}`);
    } catch (err: any) {
      showNotification('error', `Failed to update status`);
    } finally {
      setUpdatingUsers(prev => { const n = new Set(prev); n.delete(userId); return n; });
    }
  };

  const handleRoleChange = async (userId: string, newRole: any) => {
    try {
      setUpdatingUsers(prev => new Set(prev).add(userId));
      const response = await adminService.updateUser(userId, { role: newRole });
      setUsers(prevUsers => prevUsers.map(user => {
        if (user.id === userId) {
          const updated = (response.data as any)?.user || (response.data as any) || user;
          return { ...user, role: updated.role_name || updated.role || newRole, ...updated };
        }
        return user;
      }));
      showNotification('success', `User role updated to ${newRole}`);
    } catch (err: any) {
      showNotification('error', `Failed to update role`);
    } finally {
      setUpdatingUsers(prev => { const n = new Set(prev); n.delete(userId); return n; });
    }
  };

  const filteredUsers = users.filter(user => user.email?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 container max-w-7xl mx-auto p-5">
      {/* Original Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all transform ${notification.type === 'success' ? (isDarkTheme ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-800 border border-green-200') : (isDarkTheme ? 'bg-red-800 text-red-100' : 'bg-red-100 text-red-800 border border-red-200')}`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={hideConfirmDialog} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-2">{confirmDialog.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={hideConfirmDialog} className="px-4 py-2">Cancel</button>
              <button onClick={() => { confirmDialog.onConfirm(); hideConfirmDialog(); }} className={`px-4 py-2 rounded-lg text-white ${confirmDialog.type === 'danger' ? 'bg-red-600' : 'bg-yellow-600'}`}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className={`text-2xl font-black tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Manage Users</h1>
        <button onClick={loadUsers} disabled={loading} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${loading ? 'bg-gray-500 text-gray-200' : isDarkTheme ? 'bg-accent text-black hover:bg-accent2' : 'bg-accent2 text-black hover:bg-accent'}`}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Users', value: users.length.toString(), icon: <Users />, color: 'text-green-600' },
          { label: 'Active Users', value: users.filter(u => u.is_active).length.toString(), icon: <CheckCircle />, color: 'text-blue-600' },
          { label: 'Suspended', value: users.filter(u => !u.is_active).length.toString(), icon: <AlertTriangle />, color: 'text-red-600' },
          { label: 'Admins', value: users.filter(u => u.role === 'ADMIN').length.toString(), icon: <Shield />, color: 'text-purple-600' },
        ].map((stat, i) => (
          <div key={i} className={`p-5 rounded-2xl border shadow-sm ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`${stat.color} bg-opacity-10 p-2 rounded-lg`}>{stat.icon}</div>
              <span className={`text-xs font-bold uppercase tracking-wider ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>{stat.label}</span>
            </div>
            <div className={`text-2xl font-black ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className={`p-4 rounded-2xl border shadow-sm flex flex-col gap-4 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-slate-100'}`}>
        <div className="relative w-full">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`} size={16} />
          <input type="text" placeholder="Search by email..." className={`w-full pl-12 pr-4 py-3 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium ${isDarkTheme ? 'bg-[#1a1a1a] text-white placeholder-gray-500' : 'bg-slate-50 text-slate-900 placeholder-slate-400'}`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={`flex-1 px-4 py-2 rounded-xl outline-none ${isDarkTheme ? 'bg-[#1a1a1a] border border-gray-700 text-white' : 'bg-slate-50 border border-slate-200'}`}>
            <option value="ALL">All Roles</option>
            {roleOptions.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`flex-1 px-4 py-2 rounded-xl outline-none ${isDarkTheme ? 'bg-[#1a1a1a] border border-gray-700 text-white' : 'bg-slate-50 border border-slate-200'}`}>
            <option value="ALL">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table - Desktop */}
      <div className="hidden lg:block overflow-hidden rounded-2xl border shadow-sm bg-white dark:bg-[#0A0A0A] dark:border-gray-700">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`text-xs font-black uppercase tracking-wider border-b ${isDarkTheme ? 'bg-[#1a1a1a] border-gray-700 text-gray-400' : 'bg-gray-50/50 border-slate-200 text-slate-500'}`}>
              <th className="px-6 py-4">User Details</th>
              <th className="px-6 py-4">Role Configuration</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkTheme ? 'divide-gray-700' : 'divide-slate-100'}`}>
            {filteredUsers.map(user => (
              <tr key={user.id} className={`transition-colors ${isDarkTheme ? 'hover:bg-gray-800/50' : 'hover:bg-blue-50/30'}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black ${isDarkTheme ? 'bg-indigo-900/50 text-indigo-300' : 'bg-gradient-to-tr from-blue-500 to-indigo-500 text-white'}`}>{(user.email || 'U')[0].toUpperCase()}</div>
                    <span className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{user.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select className={`text-xs font-medium rounded-lg px-3 py-1.5 outline-none border ${isDarkTheme ? 'bg-[#1a1a1a] border-gray-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={user.role || 'VISITOR'} onChange={e => handleRoleChange(user.id, e.target.value as any)} disabled={updatingUsers.has(user.id)}>
                    {roleOptions.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active ? (isDarkTheme ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700') : (isDarkTheme ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700')}`}>{user.is_active ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <select className={`text-[10px] font-bold uppercase rounded-lg px-2 py-1.5 border ${isDarkTheme ? 'bg-zinc-900 border-gray-800 text-white' : 'bg-white border-slate-200'}`} value={user.is_active ? 'Active' : 'Inactive'} onChange={e => handleStatusChange(user.id, e.target.value)} disabled={updatingUsers.has(user.id)}>
                        <option value="Active">Active</option><option value="Inactive">Inactive</option>
                    </select>
                    <button onClick={() => handleDeleteUser(user.id, user.email)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* UPDATED SM (MOBILE) VIEW - Preserving all original styles/colors */}
      <div className="lg:hidden space-y-4">
        {filteredUsers.map(user => (
          <div key={user.id} className={`p-4 rounded-2xl border shadow-sm ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-black ${isDarkTheme ? 'bg-indigo-900/50 text-indigo-300' : 'bg-gradient-to-tr from-blue-500 to-indigo-500 text-white'}`}>
                  {(user.email || 'U')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-bold truncate ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{user.email}</p>
                  <span className={`text-[10px] font-black uppercase ${user.is_active ? 'text-green-500' : 'text-red-500'}`}>
                    {user.is_active ? 'Active' : 'Suspended'}
                  </span>
                </div>
              </div>
              <button onClick={() => handleDeleteUser(user.id, user.email)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-3 border-t dark:border-gray-800">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Role</label>
                <select 
                  className={`w-full text-xs font-bold rounded-lg px-3 py-2 border outline-none ${isDarkTheme ? 'bg-[#1a1a1a] border-gray-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} 
                  value={user.role || 'VISITOR'} 
                  onChange={e => handleRoleChange(user.id, e.target.value as any)}
                  disabled={updatingUsers.has(user.id)}
                >
                  {roleOptions.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Status</label>
                <select 
                  className={`w-full text-xs font-bold rounded-lg px-3 py-2 border outline-none ${isDarkTheme ? 'bg-[#1a1a1a] border-gray-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} 
                  value={user.is_active ? 'Active' : 'Inactive'} 
                  onChange={e => handleStatusChange(user.id, e.target.value)}
                  disabled={updatingUsers.has(user.id)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users</div>
          <div className="flex items-center gap-2">
            <button onClick={goToPreviousPage} disabled={currentPage === 1} className={`px-3 py-2 rounded-lg font-medium ${currentPage === 1 ? 'bg-gray-500 text-gray-200' : isDarkTheme ? 'bg-[#1a1a1a] text-white border border-gray-700' : 'bg-white border border-gray-300'}`}>Previous</button>
            <div className="flex gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => (
                <button key={i} onClick={() => goToPage(i + 1)} className={`w-10 h-10 rounded-lg font-medium ${currentPage === i + 1 ? 'bg-accent2 text-black' : isDarkTheme ? 'bg-[#1a1a1a] text-white border border-gray-700' : 'bg-white border border-gray-300'}`}>{i + 1}</button>
              ))}
            </div>
            <button onClick={goToNextPage} disabled={currentPage === totalPages} className={`px-3 py-2 rounded-lg font-medium ${currentPage === totalPages ? 'bg-gray-500 text-gray-200' : isDarkTheme ? 'bg-[#1a1a1a] text-white border border-gray-700' : 'bg-white border border-gray-300'}`}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}