"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Search, 
  Calendar, 
  Download, 
  Eye, 
  X, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  ChevronLeft,
  ChevronRight,
  Trash2,
  Users
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { Booking } from '@/types';

export default function BookingManagement() {
  const { isDarkTheme } = useTheme();
  const router = useRouter();
  
  // State management
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingDetailsModalOpen, setBookingDetailsModalOpen] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [bookingsPerPage] = useState(15);
  
  // Bulk operations state
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkCancelModal, setShowBulkCancelModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    bookingCount: number;
    onConfirm: () => void;
  } | null>(null);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    bookingCount: number;
    onConfirm: () => void;
  } | null>(null);

  // Auto-refresh interval
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load bookings data
  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllBookings(
        currentPage,
        15,
        statusFilter !== 'ALL' ? statusFilter : undefined
      );
      if (response.success) {
        setBookings(response.data.bookings || []);
        const paginationData = response.data.pagination;
        if (paginationData) {
          setTotalPages(paginationData.totalPages || 0);
          setTotalBookings(paginationData.total || 0);
        }
      }
    } catch (err) {
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  // Initial load
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Search submit handler
  const handleSearchSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    loadBookings();
  }, [loadBookings]);

  // Filter change handlers
  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  }, []);

  const handlePaymentStatusFilterChange = useCallback((status: string) => {
    setPaymentStatusFilter(status);
    setCurrentPage(1);
  }, []);

  // Selection handlers
  const handleSelectBooking = useCallback((bookingId: string) => {
    const newSelection = new Set(selectedBookings);
    if (newSelection.has(bookingId)) {
      newSelection.delete(bookingId);
    } else {
      newSelection.add(bookingId);
    }
    setSelectedBookings(newSelection);
    setSelectAll(newSelection.size === bookings.length && bookings.length > 0);
  }, [selectedBookings, bookings.length]);

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedBookings(new Set());
    } else {
      setSelectedBookings(new Set(bookings.map(b => b.id)));
    }
    setSelectAll(!selectAll);
  }, [selectAll, bookings]);

  // View booking details
  const handleViewBooking = useCallback((booking: Booking) => {
    setSelectedBooking(booking);
    setBookingDetailsModalOpen(true);
  }, []);

  // Cancel booking
  const handleCancelBooking = useCallback((booking: Booking) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Booking',
      message: `Are you sure you want to cancel booking "${booking.bookingReference}" for ${booking.firstName} ${booking.lastName}?`,
      bookingCount: 1,
      onConfirm: async () => {
        try {
          await adminService.cancelBooking(booking.id);
          setBookings(prev => prev.filter(b => b.id !== booking.id));
          setConfirmDialog(null);
          // Show success notification
        } catch (err: any) {
          console.error('Error cancelling booking:', err);
          // Show error notification
        }
      }
    });
  }, []);

  // Bulk cancel bookings
  const handleBulkCancel = useCallback(() => {
    const selectedBookingList = bookings.filter(b => selectedBookings.has(b.id));
    const bookingNames = selectedBookingList.map(b => `"${b.bookingReference}"`).join(', ');
    
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Multiple Bookings',
      message: `Are you sure you want to cancel ${selectedBookings.size} bookings: ${bookingNames}?`,
      bookingCount: selectedBookings.size,
      onConfirm: async () => {
        try {
          // Cancel all selected bookings
          await Promise.all(selectedBookingList.map(booking => adminService.cancelBooking(booking.id)));
          setBookings(prev => prev.filter(b => !selectedBookings.has(b.id)));
          setSelectedBookings(new Set());
          setSelectAll(false);
          setConfirmDialog(null);
          // Show success notification
        } catch (err: any) {
          console.error('Error bulk cancelling bookings:', err);
          // Show error notification
        }
      }
    });
  }, [selectedBookings, bookings]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    loadBookings();
  }, [loadBookings]);

  // Status badge styling
  const getStatusBadge = (status: string | undefined) => {
    if (!status) {
      status = 'PENDING'; // Default fallback
    }
    
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    let statusClass;
    let statusText;
    
    switch (status.toLowerCase()) {
      case 'confirmed':
        statusClass = isDarkTheme ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700';
        statusText = 'Confirmed';
        break;
      case 'pending':
        statusClass = isDarkTheme ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700';
        statusText = 'Pending';
        break;
      case 'cancelled':
        statusClass = isDarkTheme ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700';
        statusText = 'Cancelled';
        break;
      case 'refunded':
        statusClass = isDarkTheme ? 'bg-gray-900/50 text-gray-400' : 'bg-gray-100 text-gray-700';
        statusText = 'Refunded';
        break;
      default:
        statusClass = isDarkTheme ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700';
        statusText = status;
    }
    
    return <span className={`${baseClasses} ${statusClass}`}>{statusText}</span>;
  };

  const getPaymentStatusBadge = (status: string | undefined) => {
    if (!status) {
      status = 'PENDING'; // Default fallback
    }
    
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    let statusClass;
    let statusText;
    
    switch (status.toLowerCase()) {
      case 'completed':
        statusClass = isDarkTheme ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700';
        statusText = 'Completed';
        break;
      case 'pending':
        statusClass = isDarkTheme ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700';
        statusText = 'Pending';
        break;
      case 'failed':
        statusClass = isDarkTheme ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700';
        statusText = 'Failed';
        break;
      case 'refunded':
        statusClass = isDarkTheme ? 'bg-gray-900/50 text-gray-400' : 'bg-gray-100 text-gray-700';
        statusText = 'Refunded';
        break;
      default:
        statusClass = isDarkTheme ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700';
        statusText = status;
    }
    
    return <span className={`${baseClasses} ${statusClass}`}>{statusText}</span>;
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className={`text-3xl font-bold tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            Manage Bookings
          </h1>
          
          <button
            onClick={handleRefresh} 
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              loading 
                ? 'bg-gray-500 text-gray-200' 
                : isDarkTheme 
                  ? 'bg-accent text-black hover:bg-accent2' 
                  : 'bg-accent2 text-black hover:bg-accent'
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Search and Filters */}
        <div className={`rounded-2xl border shadow-sm p-6 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkTheme ? 'text-gray-500' : 'text-gray-400'}`} size={16} />
              <input
                type="text"
                placeholder="Search by booking reference, customer name, or email..."
                className={`w-full pl-12 pr-4 py-3 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium ${
                  isDarkTheme ? 'bg-[#1a1a1a] text-white placeholder-gray-500' : 'bg-gray-50 text-gray-900 placeholder-gray-400'
                }`}
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                    loadBookings();
                  }}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                    isDarkTheme ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                  }`}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Booking Status
                </label>
                <select
                  value={statusFilter}
                  onChange={e => {
                    handleStatusFilterChange(e.target.value);
                  }}
                  className={`w-full px-4 py-2 rounded-lg outline-none border ${
                    isDarkTheme ? 'bg-[#1a1a1a] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="ALL">All Status</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING">Pending</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Payment Status
                </label>
                <select
                  value={paymentStatusFilter}
                  onChange={e => {
                    handlePaymentStatusFilterChange(e.target.value);
                  }}
                  className={`w-full px-4 py-2 rounded-lg outline-none border ${
                    isDarkTheme ? 'bg-[#1a1a1a] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="ALL">All Payment Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Bulk Actions */}
        {selectedBookings.size > 0 && (
          <div className={`rounded-2xl border shadow-sm p-4 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                {selectedBookings.size} booking{selectedBookings.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkCancel}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all bg-red-600 hover:bg-red-700`}
                >
                  <Trash2 size={16} />
                  Cancel Selected
                </button>
                <button
                  onClick={() => {
                    setSelectedBookings(new Set());
                    setSelectAll(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isDarkTheme ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Table */}
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Table Header */}
          <div className={`px-6 py-4 border-b ${isDarkTheme ? 'border-gray-700 bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                Bookings ({totalBookings} total)
              </h2>
              
              {/* Select All Checkbox */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className={`text-sm font-medium ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    Select All
                  </span>
                </label>
                
                {/* Page Info */}
                <span className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className={`h-8 w-8 animate-spin ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`ml-3 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                Loading bookings...
              </span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className={`h-12 w-12 ${isDarkTheme ? 'text-red-400' : 'text-red-500'} mb-4`} />
              <p className={`text-lg font-medium ${isDarkTheme ? 'text-red-400' : 'text-red-500'}`}>
                {error}
              </p>
              <button
                onClick={() => {
                  setError(null);
                  loadBookings();
                }}
                className={`mt-4 px-4 py-2 rounded-lg font-medium text-white transition-all bg-indigo-600 hover:bg-indigo-700`}
              >
                Retry
              </button>
            </div>
          )}

          {/* Bookings List */}
          {!loading && !error && bookings.length === 0 && (
            <div className="text-center py-12">
              <p className={`text-lg ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                No bookings found
              </p>
            </div>
          )}

          {!loading && !error && bookings.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkTheme ? 'bg-[#1a1a1a]' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkTheme ? 'text-gray-400 border-gray-600' : 'text-gray-700 border-gray-200'
                    }`}>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkTheme ? 'text-gray-400 border-gray-600' : 'text-gray-700 border-gray-200'
                    }`}>
                      Reference
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkTheme ? 'text-gray-400 border-gray-600' : 'text-gray-700 border-gray-200'
                    }`}>
                      Customer
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkTheme ? 'text-gray-400 border-gray-600' : 'text-gray-700 border-gray-200'
                    }`}>
                      Amount
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkTheme ? 'text-gray-400 border-gray-600' : 'text-gray-700 border-gray-200'
                    }`}>
                      Booking Status
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkTheme ? 'text-gray-400 border-gray-600' : 'text-gray-700 border-gray-200'
                    }`}>
                      Payment Status
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkTheme ? 'text-gray-400 border-gray-600' : 'text-gray-700 border-gray-200'
                    }`}>
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkTheme ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {bookings.map((booking) => (
                    <tr 
                      key={booking.id}
                      onClick={() => router.push(`/admin/bookings/${booking.id}`, { state: { booking } })}
                      className={`hover:bg-opacity-80 transition-colors cursor-pointer ${
                        selectedBookings.has(booking.id)
                          ? isDarkTheme ? 'bg-indigo-900/20' : 'bg-indigo-50'
                          : ''
                      } ${isDarkTheme ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}
                    >
                      <td className={`px-6 py-4 ${isDarkTheme ? 'border-gray-600' : 'border-gray-200'}`}>
                        <input
                          type="checkbox"
                          checked={selectedBookings.has(booking.id)}
                          onChange={() => handleSelectBooking(booking.id)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                      </td>
                      <td className={`px-6 py-4 font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                        {booking.booking_reference}
                      </td>
                      <td className={`px-6 py-4 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {booking.customer_name || booking.guest_name || 'Unknown'}
                          </div>
                          {booking.guest_email && (
                            <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                              {booking.guest_email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                        ETB {parseFloat(booking.total_amount).toLocaleString()}
                      </td>
                      <td className={`px-6 py-4`}>
                        {getStatusBadge(booking.booking_status)}
                      </td>
                      <td className={`px-6 py-4`}>
                        {getPaymentStatusBadge(booking.payment_status || 'PENDING')}
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                        {new Date(booking.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`px-6 py-4 border-t ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPage === 1 || loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isDarkTheme
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-white text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => currentPage + i).map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        pageNum === currentPage
                          ? 'bg-indigo-600 text-white'
                          : isDarkTheme
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-white text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPage === totalPages || loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isDarkTheme
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-white text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {bookingDetailsModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setBookingDetailsModalOpen(false)} />
          <div className={`relative rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden ${
            isDarkTheme ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'
          }`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-xl font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  Booking Details
                </h3>
                <button
                  onClick={() => setBookingDetailsModalOpen(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkTheme ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h4 className={`text-lg font-semibold mb-3 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    Customer Information
                  </h4>
                  <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Full Name</p>
                        <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                          {selectedBooking.firstName} {selectedBooking.lastName}
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Email</p>
                        <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                          {selectedBooking.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Information */}
                <div>
                  <h4 className={`text-lg font-semibold mb-3 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    Booking Information
                  </h4>
                  <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Reference</p>
                        <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                          {selectedBooking.bookingReference}
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
                        <div>{getStatusBadge(selectedBooking.status)}</div>
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Payment Status</p>
                        <div>{getPaymentStatusBadge(selectedBooking.paymentStatus || 'PENDING')}</div>
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount</p>
                        <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                          ETB {parseFloat(selectedBooking.totalAmount).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Booked Date</p>
                        <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                          {new Date(selectedBooking.bookedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Items */}
                {selectedBooking.passes && (
                  <div>
                    <h4 className={`text-lg font-semibold mb-3 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      Booking Items
                    </h4>
                    <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      {/* This would show event/game details based on the booking structure */}
                      <div className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                        Booking items and ticket details would be displayed here based on the passes structure.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`px-6 py-4 border-t ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setBookingDetailsModalOpen(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isDarkTheme ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDialog(null)} />
          <div className={`relative rounded-2xl shadow-2xl max-w-md w-full mx-4 ${
            isDarkTheme ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  confirmDialog.bookingCount > 1 ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                  {confirmDialog.bookingCount > 1 ? (
                    <Trash2 className={`w-6 h-6 ${isDarkTheme ? 'text-red-600' : 'text-red-500'}`} />
                  ) : (
                    <AlertTriangle className={`w-6 h-6 ${isDarkTheme ? 'text-yellow-600' : 'text-yellow-500'}`} />
                  )}
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {confirmDialog.title}
                  </h3>
                  <p className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
                    {confirmDialog.message}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isDarkTheme ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className={`px-4 py-2 rounded-lg font-medium text-white transition-all bg-red-600 hover:bg-red-700`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
