"use client";
import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, Users, AlertTriangle, CheckCircle, Shield, RefreshCw, CheckCircle2, ArrowLeft, X, Calendar, CreditCard, User as UserIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { adminService } from '@/services/adminService';
import { User } from '@/types';

export default function UserManagement() {
  const { isDarkTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // The actual search being executed
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

  // User detail view state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [updatingBookings, setUpdatingBookings] = useState<Set<string>>(new Set());

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

  // Mock bookings data based on real Booking interface
  const generateMockBookings = (userId: string) => [
    {
      id: 'BK001',
      bookingReference: 'BORA-2024-001',
      userId: userId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      totalAmount: '2500.00',
      status: 'CONFIRMED' as const,
      paymentStatus: 'COMPLETED' as const,
      paymentMethod: 'CREDIT_CARD' as const,
      bookedAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      passes: {
        events: [{
          type: 'EVENT' as const,
          name: 'Summer Music Festival',
          eventId: 'EVT001',
          eventDate: '2024-06-15',
          startTime: '18:00',
          endTime: '23:00',
          ticketTypes: [{
            category: 'ADULT',
            quantity: 2,
            unitPrice: '500.00',
            subtotal: '1000.00'
          }]
        }],
        games: [{
          type: 'GAME' as const,
          name: 'Thunder Coaster',
          gameId: 'GM001',
          ticketTypes: [{
            category: 'ADULT',
            quantity: 3,
            unitPrice: '500.00',
            subtotal: '1500.00'
          }]
        }]
      },
      ticket: {
        id: 'TKT001',
        status: 'ACTIVE' as const,
        expiresAt: '2024-12-31T23:59:59Z'
      }
    },
    {
      id: 'BK002',
      bookingReference: 'BORA-2024-002',
      userId: userId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      totalAmount: '1200.00',
      status: 'PENDING' as const,
      paymentStatus: 'PENDING' as const,
      paymentMethod: 'TELEBIRR' as const,
      bookedAt: '2024-01-20T14:15:00Z',
      updatedAt: '2024-01-20T14:15:00Z',
      passes: {
        events: [{
          type: 'EVENT' as const,
          name: 'Water Park Party',
          eventId: 'EVT002',
          eventDate: '2024-07-20',
          startTime: '12:00',
          endTime: '18:00',
          ticketTypes: [{
            category: 'CHILD',
            quantity: 2,
            unitPrice: '300.00',
            subtotal: '600.00'
          }, {
            category: 'ADULT',
            quantity: 2,
            unitPrice: '300.00',
            subtotal: '600.00'
          }]
        }]
      },
      ticket: {
        id: 'TKT002',
        status: 'ACTIVE' as const,
        expiresAt: '2024-12-31T23:59:59Z'
      }
    },
    {
      id: 'BK003',
      bookingReference: 'BORA-2024-003',
      userId: userId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      totalAmount: '800.00',
      status: 'CANCELLED' as const,
      paymentStatus: 'REFUNDED' as const,
      paymentMethod: 'CASH' as const,
      bookedAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-12T15:30:00Z',
      passes: {
        games: [{
          type: 'GAME' as const,
          name: 'Splash Mountain',
          gameId: 'GM002',
          ticketTypes: [{
            category: 'ADULT',
            quantity: 2,
            unitPrice: '400.00',
            subtotal: '800.00'
          }]
        }]
      },
      ticket: {
        id: 'TKT003',
        status: 'CANCELLED' as const,
        expiresAt: '2024-12-31T23:59:59Z'
      }
    }
  ];

  // Helper functions
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setLoadingBookings(true);
    // Simulate API call delay
    setTimeout(() => {
      setUserBookings(generateMockBookings(user.id));
      setLoadingBookings(false);
    }, 500);
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
    setUserBookings([]);
    setSelectedBooking(null);
    setBookingModalOpen(false);
  };

  const handleBookingClick = (booking: any) => {
    setSelectedBooking(booking);
    setBookingModalOpen(true);
  };

  const handleBookingStatusToggle = async (bookingId: string, newStatus: string) => {
    setUpdatingBookings(prev => new Set(prev).add(bookingId));
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUserBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus as any }
          : booking
      ));
      
      showNotification('success', `Booking status updated to ${newStatus}`);
    } catch (error: any) {
      showNotification('error', 'Failed to update booking status');
    } finally {
      setUpdatingBookings(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

  const loadUsers = useCallback(async () => {
    console.log('loadUsers called with:', { currentPage, roleFilter, statusFilter, searchQuery });
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      // Use search endpoint if there's a search query, otherwise use regular getAllUsers
      if (searchQuery.trim()) {
        response = await adminService.searchUsers(searchQuery.trim(), currentPage, usersPerPage);
      } else {
        const apiRole = roleFilter === "ALL" ? undefined : roleFilter;
        const apiStatus = statusFilter === "ALL" ? undefined : statusFilter.toLowerCase();
        response = await adminService.getAllUsers(currentPage, usersPerPage, apiRole, apiStatus);
      }
      
      console.log('API response:', response);
      
      const responseData = response.data;
      console.log('Response data:', responseData);
      let usersData = responseData?.users || [];
      const paginationData = responseData?.pagination;
      
      console.log('Users data:', usersData);
      console.log('Pagination data:', paginationData);
      
      usersData = usersData.map((user: any) => ({
        ...user,
        role: (user.role_name || user.role || 'VISITOR') as "SUPERADMIN" | "ADMIN" | "STAFF" | "VISITOR"
      }));
      
      if (paginationData) {
        setTotalPages(paginationData.totalPages || 0);
        setTotalUsers(paginationData.total || 0);
      }
      setUsers(usersData);
      console.log('Users set successfully:', usersData.length);
    } catch (err: any) {
      console.error('Error in loadUsers:', err);
      setError(`Failed to load users: ${err.message || 'Unknown error'}`);
      setUsers([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [currentPage, roleFilter, statusFilter, usersPerPage, searchQuery]);

  const handleSearchSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    // Only search if term is different from current search query
    if (searchTerm.trim() !== searchQuery) {
      setIsSearching(true);
      setSearchQuery(searchTerm.trim());
      setCurrentPage(1); // Reset to first page when searching
    }
  }, [searchTerm, searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
    setSearchQuery("");
    setCurrentPage(1);
  }, []);

  const goToPage = (page: number) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };
  const goToPreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };

  useEffect(() => {
    loadUsers();
  }, [currentPage, roleFilter, statusFilter, searchQuery, loadUsers]);

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
    showConfirmDialog(
      'Change User Status',
      `Are you sure you want to change this user's status to ${newStatus}?`,
      async () => {
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
      },
      'warning'
    );
  };

  const handleRoleChange = async (userId: string, newRole: any) => {
    showConfirmDialog(
      'Change User Role',
      `Are you sure you want to change this user's role to ${newRole}?`,
      async () => {
        try {
          setUpdatingUsers(prev => new Set(prev).add(userId));
          const response = await adminService.updateUser(userId, { role: newRole });
          if (response.success) {
            showNotification('success', 'User role updated successfully');
            loadUsers();
          } else {
            showNotification('error', response.message || 'Failed to update user role');
          }
        } catch (err: any) {
          showNotification('error', `Failed to update user role: ${err.message || 'Unknown error'}`);
        } finally {
          setUpdatingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }
      },
      'warning'
    );
  };

  const filteredUsers = users; // No client-side filtering needed

  return (
    <div className="space-y-6 container max-w-7xl mx-auto p-5">
      {/* User Detail View */}
      {selectedUser && (
        <div className="space-y-6">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToUsers}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDarkTheme ? "hover:bg-white/8 text-white/50 hover:text-white" : "hover:bg-black/5 text-black/40 hover:text-black"}`}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className={`text-2xl font-black tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>User Details</h1>
              <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mt-0.5`}>{selectedUser.email}</p>
            </div>
          </div>

          {/* User Profile Card */}
          <div className={`p-6 rounded-2xl border shadow-sm ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-start gap-6">
              {/* User Avatar */}
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-black ${isDarkTheme ? 'bg-indigo-900/50 text-indigo-300' : 'bg-linear-to-tr from-blue-500 to-indigo-500 text-white'}`}>
                {(selectedUser.email || 'U')[0].toUpperCase()}
              </div>
              
              {/* User Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    {selectedUser.first_name} {selectedUser.last_name}
                  </h2>
                  <p className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>{selectedUser.email}</p>
                  {selectedUser.phone && <p className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>{selectedUser.phone}</p>}
                </div>

                {/* Role and Status Management */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className={`text-[10px] font-black uppercase ml-1 mb-1 block ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>Role Configuration</label>
                    <select 
                      className={`w-full text-sm font-medium rounded-lg px-4 py-2 outline-none border ${isDarkTheme ? 'bg-[#1a1a1a] border-gray-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                      value={selectedUser.role || 'VISITOR'}
                      onChange={async (e) => {
                        try {
                          const response = await adminService.updateUser(selectedUser.id, { role: e.target.value });
                          if (response.success) {
                            setSelectedUser({ ...selectedUser, role: e.target.value as any });
                            showNotification('success', 'User role updated successfully');
                          }
                        } catch (error: any) {
                          showNotification('error', 'Failed to update user role');
                        }
                      }}
                    >
                      {roleOptions.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <label className={`text-[10px] font-black uppercase ml-1 mb-1 block ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>Active Status</label>
                    <button
                      onClick={async () => {
                        try {
                          const newStatus = !selectedUser.is_active;
                          const response = await adminService.updateUser(selectedUser.id, { is_active: newStatus });
                          if (response.success) {
                            setSelectedUser({ ...selectedUser, is_active: newStatus });
                            showNotification('success', `User ${newStatus ? 'activated' : 'deactivated'} successfully`);
                          }
                        } catch (error: any) {
                          showNotification('error', 'Failed to update user status');
                        }
                      }}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedUser.is_active 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {selectedUser.is_active ? 'Deactivate User' : 'Activate User'}
                    </button>
                  </div>
                </div>

                {/* User Metadata */}
                <div className={`grid grid-cols-2 gap-4 pt-4 border-t ${isDarkTheme ? 'border-gray-700' : 'border-slate-200'}`}>
                  <div>
                    <p className={`text-[10px] font-black uppercase ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>User ID</p>
                    <p className={`text-sm font-mono ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>{selectedUser.id}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] font-black uppercase ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>Joined</p>
                    <p className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                      {new Date(selectedUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bookings Section */}
          <div className={`p-6 rounded-2xl border shadow-sm ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>User Bookings</h3>
            
            {loadingBookings ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className={`h-6 w-6 animate-spin ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`ml-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>Loading bookings...</span>
              </div>
            ) : userBookings.length === 0 ? (
              <div className="text-center py-8">
                <p className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>No bookings found for this user</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`text-xs font-black uppercase tracking-wider border-b ${isDarkTheme ? 'border-gray-700 text-gray-400' : 'border-slate-200 text-slate-500'}`}>
                      <th className="text-left pb-3">Booking ID</th>
                      <th className="text-left pb-3">Status</th>
                      <th className="text-left pb-3">Type</th>
                      <th className="text-left pb-3">Tickets</th>
                      <th className="text-left pb-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkTheme ? 'divide-gray-700' : 'divide-slate-100'}`}>
                    {userBookings.map(booking => {
                      const totalTickets = booking.passes?.events?.reduce((sum: number, event: any) => sum + event.ticketTypes.reduce((s: number, t: any) => s + t.quantity, 0), 0) || 0 +
                                         booking.passes?.games?.reduce((sum: number, game: any) => sum + game.ticketTypes.reduce((s: number, t: any) => s + t.quantity, 0), 0) || 0;
                      const bookingType = booking.passes?.events?.length > 0 ? 'EVENT' : 'GAME';
                      
                      return (
                        <tr 
                          key={booking.id}
                          className={`cursor-pointer transition-colors ${isDarkTheme ? 'hover:bg-gray-800/50' : 'hover:bg-blue-50/30'}`}
                          onClick={() => handleBookingClick(booking)}
                        >
                          <td className="py-3">
                            <span className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                              {booking.bookingReference}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              booking.status === 'CONFIRMED' ? (isDarkTheme ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700') :
                              booking.status === 'PENDING' ? (isDarkTheme ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700') :
                              booking.status === 'CANCELLED' ? (isDarkTheme ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700') :
                              (isDarkTheme ? 'bg-gray-900/50 text-gray-400' : 'bg-gray-100 text-gray-700')
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                              {bookingType}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                              {totalTickets}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                              ETB {booking.totalAmount}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

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
        <div className="fixed inset-0 z-200 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={hideConfirmDialog} />
          <div className={`relative rounded-4xl shadow-xl max-w-md w-full mx-4 p-6 ${isDarkTheme ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'}`}>
            <h3 className={`text-xl font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{confirmDialog.title}</h3>
            <p className={`mb-6 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>{confirmDialog.message}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={hideConfirmDialog} className={`px-4 py-2 rounded-lg ${isDarkTheme ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>Cancel</button>
              <button onClick={() => { confirmDialog.onConfirm(); hideConfirmDialog(); }} className={`px-4 py-2 rounded-lg text-black  ${confirmDialog.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-accent2 hover:bg-accent'}`}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      {bookingModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setBookingModalOpen(false)}
          />
          <div className={`relative rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden ${isDarkTheme ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'}`}>
            {/* Modal Header */}
            <div className={`p-6 border-b ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    Booking Details
                  </h3>
                  <p className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    {selectedBooking.bookingReference}
                  </p>
                </div>
                <button
                  onClick={() => setBookingModalOpen(false)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDarkTheme ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-6">
                  {/* Booking Status */}
                  <div className={`p-4 rounded-xl border ${isDarkTheme ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                      Status Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Booking Status</span>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          selectedBooking.status === 'CONFIRMED' ? (isDarkTheme ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700') :
                          selectedBooking.status === 'PENDING' ? (isDarkTheme ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700') :
                          selectedBooking.status === 'CANCELLED' ? (isDarkTheme ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700') :
                          (isDarkTheme ? 'bg-gray-900/50 text-gray-400' : 'bg-gray-100 text-gray-700')
                        }`}>
                          {selectedBooking.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Payment Status</span>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          selectedBooking.paymentStatus === 'COMPLETED' ? (isDarkTheme ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700') :
                          selectedBooking.paymentStatus === 'PENDING' ? (isDarkTheme ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700') :
                          selectedBooking.paymentStatus === 'FAILED' ? (isDarkTheme ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700') :
                          (isDarkTheme ? 'bg-gray-900/50 text-gray-400' : 'bg-gray-100 text-gray-700')
                        }`}>
                          {selectedBooking.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className={`p-4 rounded-xl border ${isDarkTheme ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                      Booking Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'} />
                        <div>
                          <p className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-gray-500'}`}>Booked Date</p>
                          <p className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                            {new Date(selectedBooking.bookedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <CreditCard size={16} className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'} />
                        <div>
                          <p className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-gray-500'}`}>Payment Method</p>
                          <p className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                            {selectedBooking.paymentMethod}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <UserIcon size={16} className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'} />
                        <div>
                          <p className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-gray-500'}`}>Customer</p>
                          <p className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                            {selectedBooking.firstName} {selectedBooking.lastName}
                          </p>
                          <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                            {selectedBooking.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Items and Actions */}
                <div className="space-y-6">
                  {/* Booking Items */}
                  <div className={`p-4 rounded-xl border ${isDarkTheme ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                      Booking Items
                    </h4>
                    <div className="space-y-3">
                      {selectedBooking.passes?.events?.map((event: any, index: number) => (
                        <div key={`event-${index}`} className={`p-3 rounded-lg border ${isDarkTheme ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                              {event.name}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium`}>
                              EVENT
                            </span>
                          </div>
                          <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                            {new Date(event.eventDate).toLocaleDateString()} • {event.startTime} - {event.endTime}
                          </p>
                          <div className="space-y-1">
                            {event.ticketTypes.map((ticket: any, ticketIndex: number) => (
                              <div key={ticketIndex} className="flex justify-between text-xs">
                                <span className={isDarkTheme ? 'text-gray-300' : 'text-gray-700'}>
                                  {ticket.category} × {ticket.quantity}
                                </span>
                                <span className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                                  ETB {ticket.subtotal}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {selectedBooking.passes?.games?.map((game: any, index: number) => (
                        <div key={`game-${index}`} className={`p-3 rounded-lg border ${isDarkTheme ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                              {game.name}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium`}>
                              GAME
                            </span>
                          </div>
                          <div className="space-y-1">
                            {game.ticketTypes.map((ticket: any, ticketIndex: number) => (
                              <div key={ticketIndex} className="flex justify-between text-xs">
                                <span className={isDarkTheme ? 'text-gray-300' : 'text-gray-700'}>
                                  {ticket.category} × {ticket.quantity}
                                </span>
                                <span className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                                  ETB {ticket.subtotal}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className={`p-4 rounded-xl border ${isDarkTheme ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Total Amount</span>
                      <span className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                        ETB {selectedBooking.totalAmount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-6 border-t ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <button
                    onClick={() => setBookingModalOpen(false)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${isDarkTheme ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                  >
                    Close
                  </button>
                </div>
                <div className="flex gap-3">
                  {selectedBooking.status === 'CONFIRMED' && (
                    <button
                      onClick={() => {
                        handleBookingStatusToggle(selectedBooking.id, 'CANCELLED');
                        setBookingModalOpen(false);
                      }}
                      disabled={updatingBookings.has(selectedBooking.id)}
                      className={`px-6 py-3 rounded-xl font-medium transition-all ${
                        updatingBookings.has(selectedBooking.id)
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                    >
                      {updatingBookings.has(selectedBooking.id) ? 'Updating...' : 'Cancel Booking'}
                    </button>
                  )}
                  {selectedBooking.status === 'CANCELLED' && (
                    <button
                      onClick={() => {
                        handleBookingStatusToggle(selectedBooking.id, 'CONFIRMED');
                        setBookingModalOpen(false);
                      }}
                      disabled={updatingBookings.has(selectedBooking.id)}
                      className={`px-6 py-3 rounded-xl font-medium transition-all ${
                        updatingBookings.has(selectedBooking.id)
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {updatingBookings.has(selectedBooking.id) ? 'Updating...' : 'Reactivate Booking'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User List - Only show when not in detail view */}
      {!selectedUser && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <h1 className={`text-2xl font-black tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Manage Users</h1>
            <button onClick={loadUsers} disabled={loading || isSearching} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${(loading || isSearching) ? 'bg-gray-500 text-gray-200' : isDarkTheme ? 'bg-accent text-black hover:bg-accent2' : 'bg-accent2 text-black hover:bg-accent'}`}>
              <RefreshCw className={`h-4 w-4 ${(loading || isSearching) ? 'animate-spin' : ''}`} /> {(loading || isSearching) ? (isSearching ? 'Searching...' : 'Loading...') : 'Refresh'}
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
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`} size={16} />
              <input 
                type="text" 
                placeholder="Search by name, email, or phone..." 
                className={`w-full pl-12 pr-12 py-3 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium ${isDarkTheme ? 'bg-[#1a1a1a] text-white placeholder-gray-500' : 'bg-slate-50 text-slate-900 placeholder-slate-400'}`} 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${isDarkTheme ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                >
                  <X size={14} />
                </button>
              )}
            </form>
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
      <div className={`hidden lg:block overflow-hidden rounded-2xl border shadow-sm ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-slate-100'}`}>
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
              <tr 
                key={user.id} 
                className={`transition-colors cursor-pointer ${isDarkTheme ? 'hover:bg-gray-800/50' : 'hover:bg-blue-50/30'}`}
                onClick={() => handleUserSelect(user)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black ${isDarkTheme ? 'bg-indigo-900/50 text-indigo-300' : 'bg-linear-to-tr from-blue-500 to-indigo-500 text-white'}`}>{(user.email || 'U')[0].toUpperCase()}</div>
                    <span className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{user.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select 
                    className={`text-xs font-medium rounded-lg px-3 py-1.5 outline-none border ${isDarkTheme ? 'bg-[#1a1a1a] border-gray-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                    value={user.role || 'VISITOR'} 
                    onChange={e => handleRoleChange(user.id, e.target.value as any)} 
                    disabled={updatingUsers.has(user.id)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {roleOptions.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active ? (isDarkTheme ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700') : (isDarkTheme ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700')}`}>{user.is_active ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <select 
                      className={`text-[10px] font-bold uppercase rounded-lg px-2 py-1.5 border ${isDarkTheme ? 'bg-zinc-900 border-gray-800 text-white' : 'bg-white border-slate-200'}`} 
                      value={user.is_active ? 'Active' : 'Inactive'} 
                      onChange={e => handleStatusChange(user.id, e.target.value)} 
                      disabled={updatingUsers.has(user.id)}
                      onClick={(e) => e.stopPropagation()}
                    >
                        <option value="Active">Active</option><option value="Inactive">Inactive</option>
                    </select>
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
          <div 
            key={user.id} 
            className={`p-4 rounded-2xl border shadow-sm cursor-pointer transition-colors hover:shadow-md ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700 hover:bg-gray-800/50' : 'bg-white border-slate-200 hover:bg-blue-50/30'}`}
            onClick={() => handleUserSelect(user)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-black ${isDarkTheme ? 'bg-indigo-900/50 text-indigo-300' : 'bg-linear-to-tr from-blue-500 to-indigo-500 text-white'}`}>
                  {(user.email || 'U')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-bold truncate ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{user.email}</p>
                  <span className={`text-[10px] font-black uppercase ${user.is_active ? 'text-green-500' : 'text-red-500'}`}>
                    {user.is_active ? 'Active' : 'Suspended'}
                  </span>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteUser(user.id, user.email);
                }} 
                className={`p-2 transition-colors ${isDarkTheme ? 'text-gray-400 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className={`grid grid-cols-2 gap-3 pt-3 border-t ${isDarkTheme ? 'border-gray-700' : 'border-slate-100'}`}>
              <div className="space-y-1">
                <label className={`text-[10px] font-black uppercase ml-1 ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>Role</label>
                <select 
                  className={`w-full text-xs font-bold rounded-lg px-3 py-2 border outline-none ${isDarkTheme ? 'bg-[#1a1a1a] border-gray-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} 
                  value={user.role || 'VISITOR'} 
                  onChange={e => handleRoleChange(user.id, e.target.value as any)}
                  disabled={updatingUsers.has(user.id)}
                  onClick={(e) => e.stopPropagation()}
                >
                  {roleOptions.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className={`text-[10px] font-black uppercase ml-1 ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>Status</label>
                <select 
                  className={`w-full text-xs font-bold rounded-lg px-3 py-2 border outline-none ${isDarkTheme ? 'bg-[#1a1a1a] border-gray-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} 
                  value={user.is_active ? 'Active' : 'Inactive'} 
                  onChange={e => handleStatusChange(user.id, e.target.value)}
                  disabled={updatingUsers.has(user.id)}
                  onClick={(e) => e.stopPropagation()}
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
          <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-600'}`}>Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users</div>
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
        </>
      )}
    </div>
  );
}