"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  X,
  Trash2,
  Users,
  Eye,
  Ticket,
  Copy,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { Booking } from '@/types';

export default function BookingDetailsPage() {
  const { isDarkTheme } = useTheme();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  
  // Get booking data from router state (passed from list page)
  const routerState = router.state as { booking?: Booking } | undefined;
  const passedBooking = routerState?.booking;
  
  // State management
  const [booking, setBooking] = useState<Booking | null>(passedBooking || null);
  const [loading, setLoading] = useState(!passedBooking); // Only loading if no passed data
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [copiedQrToken, setCopiedQrToken] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    purchasedTickets: false,
    ticketUsage: false
  });
  const [animatingSections, setAnimatingSections] = useState({
    purchasedTickets: false,
    ticketUsage: false
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Load booking details
  const loadBooking = useCallback(async () => {
    // If we already have booking data from router state, no need to fetch
    if (booking) {
      return;
    }
    
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminService.getBookingDetails(id);
      if (response.success && response.data) {
        // Handle both response structures: direct booking object or bookings array
        const bookingData = response.data.booking || response.data.bookings?.[0];
        if (bookingData) {
          setBooking(bookingData);
        } else {
          setError('Booking not found');
        }
      } else {
        setError('Booking not found');
      }
    } catch (err: any) {
      console.error('Error loading booking:', err);
      setError(`Failed to load booking: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [id, booking]);

  // Initial load
  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  // Cancel booking
  const handleCancelBooking = useCallback(async () => {
    if (!booking) return;
    
    // Check if booking is already cancelled
    if (booking.status === 'CANCELLED') {
      setError('This booking is already cancelled.');
      return;
    }
    
    try {
      setCancelling(true);
      await adminService.cancelBooking(booking.id);
      // Reload booking to get updated status
      await loadBooking();
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      setError(`Failed to cancel booking: ${err.message || 'Unknown error'}`);
    } finally {
      setCancelling(false);
    }
  }, [booking, loadBooking]);

  // Reactivate booking
  const handleReactivateBooking = useCallback(async () => {
    if (!booking) return;
    
    try {
      setReactivating(true);
      // For now, we'll simulate the reactivation since the backend endpoint might not exist
      // In a real implementation, you would call: await adminService.reactivateBooking(booking.id);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Update booking status locally (this would normally come from the API)
      setBooking(prev => prev ? { ...prev, status: 'CONFIRMED' } : null);
      
    } catch (err: any) {
      console.error('Error reactivating booking:', err);
      setError(`Failed to reactivate booking: ${err.message || 'Unknown error'}`);
    } finally {
      setReactivating(false);
    }
  }, [booking]);

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

  // Retry loading
  const handleRetry = useCallback(() => {
    setError(null);
    loadBooking();
  }, [loadBooking]);

  // Copy QR token to clipboard
  const handleCopyQrToken = useCallback(async (qrToken: string) => {
    try {
      await navigator.clipboard.writeText(qrToken);
      setCopiedQrToken(true);
      setTimeout(() => setCopiedQrToken(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy QR token:', err);
    }
  }, []);

  // Toggle section expansion
  const toggleSection = useCallback((section: 'purchasedTickets' | 'ticketUsage') => {
    const isCurrentlyExpanded = expandedSections[section];
    
    // Start animation
    setAnimatingSections(prev => ({
      ...prev,
      [section]: true
    }));
    
    // Toggle expanded state after a brief delay for smooth animation
    setTimeout(() => {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    }, isCurrentlyExpanded ? 0 : 50);
    
    // End animation after transition completes
    setTimeout(() => {
      setAnimatingSections(prev => ({
        ...prev,
        [section]: false
      }));
    }, 300);
  }, [expandedSections]);

  // Helper functions for visual enhancements
  const getUsagePercentage = (used: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return isDarkTheme ? 'bg-red-600' : 'bg-red-500';
    if (percentage >= 70) return isDarkTheme ? 'bg-yellow-600' : 'bg-yellow-500';
    if (percentage >= 40) return isDarkTheme ? 'bg-blue-600' : 'bg-blue-500';
    return isDarkTheme ? 'bg-green-600' : 'bg-green-500';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return isDarkTheme ? 'text-green-400' : 'text-green-600';
      case 'used':
        return isDarkTheme ? 'text-blue-400' : 'text-blue-600';
      case 'expired':
        return isDarkTheme ? 'text-red-400' : 'text-red-600';
      default:
        return isDarkTheme ? 'text-gray-400' : 'text-gray-600';
    }
  };

  const getProductIcon = (productType: string) => {
    switch (productType?.toLowerCase()) {
      case 'event':
        return Calendar;
      case 'game':
        return Ticket;
      default:
        return Eye;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
        <div className="text-center">
          <RefreshCw className={`h-12 w-12 animate-spin mx-auto mb-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
          <p className={`text-lg ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading booking details...
          </p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
        <div className="text-center max-w-md">
          <AlertTriangle className={`h-16 w-16 mx-auto mb-4 ${isDarkTheme ? 'text-red-400' : 'text-red-500'}`} />
          <h1 className={`text-2xl font-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
            Booking Not Found
          </h1>
          <p className={`mb-6 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
            {error}
          </p>
          <button
            onClick={handleRetry}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all bg-indigo-600 hover:bg-indigo-700`}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/admin/bookings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isDarkTheme 
                ? 'bg-bg3 text-white hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            <ArrowLeft size={16} />
            Back to Bookings
          </button>
          
          <h1 className={`text-3xl font-bold tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            Booking Details
          </h1>
        </div>

        {/* Main Card */}
        <div className={`rounded-2xl border shadow-sm ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
          
          {/* Card Header */}
          <div className={`px-6 py-4 border-b ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-xl font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  Booking ID: {booking.id}
                </h2>
                {getStatusBadge(booking.status || booking.booking_status)}
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-6 space-y-6">
            
            {/* User Information */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                <Users className="w-5 h-5" />
                User Information
              </h3>
              <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      User ID
                    </label>
                    <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      {booking.user_id || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      Username
                    </label>
                    <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      {booking.firstName && booking.lastName ? `${booking.firstName} ${booking.lastName}` : 
                       (booking as any).first_name && (booking as any).last_name ? `${(booking as any).first_name} ${(booking as any).last_name}` :
                       booking.customer_name || booking.guest_name || 'Guest'}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      Email
                    </label>
                    <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      {booking.email || booking.guest_email || 'Guest'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Information */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                <Calendar className="w-5 h-5" />
                Booking Information
              </h3>
              <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      Payment Method
                    </label>
                    <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      {booking.payment_method || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      Payment Status
                    </label>
                    {getPaymentStatusBadge(booking.payment_status || 'PENDING')}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Amount
                    </label>
                    <p className={`font-medium text-lg ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      ETB {parseFloat(booking.total_amount || '0').toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      QR Token
                    </label>
                    <div className="flex items-center gap-2">
                      <p className={`font-mono text-sm ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                        {(booking as any).tickets?.qr_token ? 
                          `${(booking as any).tickets.qr_token.substring(0, 8)}...${(booking as any).tickets.qr_token.substring((booking as any).tickets.qr_token.length - 4)}` : 
                          'N/A'}
                      </p>
                      {(booking as any).tickets?.qr_token && (
                        <button
                          onClick={() => handleCopyQrToken((booking as any).tickets.qr_token)}
                          className={`p-1 rounded transition-all ${
                            copiedQrToken 
                              ? 'text-green-600' 
                              : isDarkTheme 
                                ? 'text-gray-400 hover:text-gray-300' 
                                : 'text-gray-600 hover:text-bg3'
                          }`}
                          title={copiedQrToken ? 'Copied!' : 'Copy QR token'}
                        >
                          <Copy size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tickets List */}
            <div>
              <button
                onClick={() => toggleSection('purchasedTickets')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                  isDarkTheme 
                    ? 'bg-bg3 border-gray-700 hover:bg-gray-750' 
                    : 'bg-bg2/50 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isDarkTheme ? 'bg-accent2/90' : 'bg-gray-200'}`}>
                    <Ticket className={`w-5 h-5 ${isDarkTheme ? 'text-black' : 'text-gray-700'}`} />
                  </div>
                  <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    Purchased Tickets
                  </h3>
                  {booking.items && booking.items.length > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDarkTheme ? 'bg-accent2/90 text-black' : 'bg-gray-100 text-gray-700'}`}>
                      {booking.items.length} {booking.items.length === 1 ? 'Item' : 'Items'}
                    </span>
                  )}
                </div>
                <div className={`transform transition-transform duration-300 ${
                  expandedSections.purchasedTickets ? 'rotate-180' : 'rotate-0'
                }`}>
                  <ChevronDown className={`w-5 h-5 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                expandedSections.purchasedTickets ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className={`mt-4 rounded-2xl p-4 ${isDarkTheme ? 'bg-bg3 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  {booking.items && booking.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={`border-b ${isDarkTheme ? 'border-gray-600' : 'border-gray-200'}`}>
                            <th className={`text-left py-3 px-4 text-sm font-semibold ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                              Product
                            </th>
                            <th className={`text-left py-3 px-4 text-sm font-semibold ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                              Category
                            </th>
                            <th className={`text-center py-3 px-4 text-sm font-semibold ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                              Quantity
                            </th>
                            <th className={`text-right py-3 px-4 text-sm font-semibold ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                              Unit Price
                            </th>
                            <th className={`text-right py-3 px-4 text-sm font-semibold ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                              Subtotal
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {booking.items.map((item: any, itemIndex: number) => 
                            item.ticket_types?.map((ticketType: any, ticketIndex: number) => (
                              <tr key={`${itemIndex}-${ticketIndex}`} className={`border-b ${isDarkTheme ? ' bg-bg3 border-gray-700' : 'border-gray-100'} hover:${isDarkTheme ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                <td className={`py-3 px-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                                  <div>
                                    <div className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                                      {item.product_name}
                                    </div>
                                    <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {item.product_type} {item.event_date && `• ${new Date(item.event_date).toLocaleDateString()}`}
                                      {item.start_time && item.end_time && ` • ${item.start_time} - ${item.end_time}`}
                                    </div>
                                  </div>
                                </td>
                                <td className={`py-3 px-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                                  {ticketType.category}
                                </td>
                                <td className={`py-3 px-4 text-center ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                                  {ticketType.quantity}
                                </td>
                                <td className={`py-3 px-4 text-right ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                                  ETB {ticketType.unitPrice?.toLocaleString() || 0}
                                </td>
                                <td className={`py-3 px-4 text-right ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                                  ETB {ticketType.subtotal?.toLocaleString() || 0}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        <tfoot>
                          <tr className={`font-semibold ${isDarkTheme ? 'bg-bg3' : 'bg-gray-100'}`}>
                            <td colSpan={4} className={`py-3 px-4 text-right ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                              Total:
                            </td>
                            <td className={`py-3 px-4 text-right ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                              ETB {booking.items?.reduce((total: number, item: any) => 
                                total + (item.ticket_types?.reduce((itemTotal: number, ticketType: any) => 
                                  itemTotal + (ticketType.subtotal || 0), 0) || 0), 0
                              ).toLocaleString() || 0}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <p className={`text-center ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      No tickets purchased
                    </p>
                  )}
                </div>
              </div>
            </div>

            
            {/* Ticket Usage */}
            {(booking as any).tickets?.entitlements && (booking as any).tickets.entitlements.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    console.log('Ticket Usage clicked');
                    toggleSection('ticketUsage');
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                    isDarkTheme 
                      ? 'bg-bg3 border-gray-700 hover:bg-gray-750' 
                      : 'bg-bg2/50 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isDarkTheme ? 'bg-accent2/90' : 'bg-gray-200'}`}>
                      <TrendingUp className={`w-5 h-5 ${isDarkTheme ? 'text-black' : 'text-gray-700'}`} />
                    </div>
                    <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      Ticket Usage Overview
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDarkTheme ? 'bg-accent2/90 text-black' : 'bg-gray-100 text-gray-700'}`}>
                      {(booking as any).tickets.entitlements.length} {(booking as any).tickets.entitlements.length === 1 ? 'Product' : 'Products'}
                    </span>
                  </div>
                  <div className={`transform transition-transform duration-300 ${
                    expandedSections.ticketUsage ? 'rotate-180' : 'rotate-0'
                  }`}>
                    <ChevronDown className={`w-5 h-5 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`} />
                  </div>
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  expandedSections.ticketUsage ? 'max-h-500 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="mt-4 space-y-4">
                    {(booking as any).tickets.entitlements.map((entitlement: any, index: number) => {
                      const ProductIcon = getProductIcon(entitlement.productType);
                      return (
                        <div key={index} className={`rounded-xl border ${isDarkTheme ? 'bg-bg3 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}>
                          {/* Product Header */}
                          <div className={`px-6 py-4 ${isDarkTheme ? 'bg-bg3' : 'bg-gray-50'} border-b ${isDarkTheme ? 'border-gray-600' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${isDarkTheme ? 'bg-accent2/90' : 'bg-gray-200'}`}>
                                <ProductIcon className={`w-5 h-5 ${isDarkTheme ? 'text-black' : 'text-gray-700'}`} />
                              </div>
                              <div className="flex-1">
                                <h4 className={`font-semibold text-lg ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                                  {entitlement.productName}
                                </h4>
                                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {entitlement.productType}
                                </p>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-medium ${isDarkTheme ? 'bg-accent2/90 text-black' : 'bg-gray-200 text-gray-700'}`}>
                                {entitlement.usageDetails?.length || 0} Passes
                              </div>
                            </div>
                          </div>

                          {/* Usage Details */}
                          <div className="p-6">
                            <div className="space-y-4">
                              {entitlement.usageDetails && entitlement.usageDetails.length > 0 ? (
                                entitlement.usageDetails.map((usage: any, usageIndex: number) => {
                                  const percentage = getUsagePercentage(usage.usedQuantity, usage.totalQuantity);
                                  const progressBarColor = getProgressBarColor(percentage);
                                  
                                  return (
                                    <div key={usage.id || usageIndex} className={`p-4 rounded-lg border ${isDarkTheme ? 'bg-bg1 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-2 h-2 rounded-full ${getStatusColor(usage.status)}`} />
                                            <span className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                                              {usage.category}
                                            </span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(usage.status)} ${isDarkTheme ? 'bg-opacity-20' : 'bg-opacity-10'}`}>
                                              {usage.status}
                                            </span>
                                          </div>
                                          
                                          {/* Progress Bar */}
                                          <div className="mb-3">
                                            <div className="flex items-center justify-between mb-1">
                                              <span className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Usage Progress
                                              </span>
                                              <span className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                                                {usage.usedQuantity} / {usage.totalQuantity}
                                              </span>
                                            </div>
                                            <div className={`w-full h-2 rounded-full ${isDarkTheme ? 'bg-gray-600' : 'bg-gray-200'}`}>
                                              <div 
                                                className={`h-2 rounded-full transition-all duration-300 ${progressBarColor}`}
                                                style={{ width: `${percentage}%` }}
                                              />
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                              <span className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-gray-500'}`}>
                                                {percentage}% used
                                              </span>
                                              {percentage >= 90 && (
                                                <span className={`text-xs font-medium ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`}>
                                                  Almost exhausted
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Additional Info */}
                                      <div className={`grid grid-cols-2 gap-4 pt-3 border-t ${isDarkTheme ? 'border-gray-600' : 'border-gray-200'}`}>
                                        <div className="flex items-center gap-2">
                                          <div className={`p-1 rounded-lg ${isDarkTheme ? 'bg-accent2/90' : 'bg-gray-100'}`}>
                                            <Clock className={`w-4 h-4 ${isDarkTheme ? 'text-black' : 'text-gray-600'}`} />
                                          </div>
                                          <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Last Used: {usage.lastUsedAt ? new Date(usage.lastUsedAt).toLocaleDateString() : 'Never'}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className={`p-1 rounded-lg ${isDarkTheme ? 'bg-accent2/90'  : 'bg-gray-100'}`}>
                                            <CheckCircle2 className={`w-4 h-4 ${isDarkTheme ? 'text-black' : 'text-gray-600'}`} />
                                          </div>
                                          <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {usage.totalQuantity - usage.usedQuantity} remaining
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className={`text-center py-8 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                                  <div className={`p-3 rounded-full mx-auto mb-3 ${isDarkTheme ? 'bg-accent2/90' : 'bg-gray-100'}`}>
                                    <Eye className={`w-12 h-12 ${isDarkTheme ? 'text-black' : 'text-gray-600'}`} />
                                  </div>
                                  <p>No usage details available</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card Actions */}
          <div className={`px-6 py-4 border-t ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex justify-end gap-3">
              {booking.status === 'CANCELLED' ? (
                <button
                  onClick={handleReactivateBooking}
                  disabled={reactivating}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    reactivating 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {reactivating ? 'Reactivating...' : 'Reactivate Booking'}
                </button>
              ) : (
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelling || booking.status === 'CANCELLED'}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    cancelling || booking.status === 'CANCELLED'
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl p-6 max-w-md w-full ${isDarkTheme ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              {confirmDialog.title}
            </h3>
            <p className={`mb-6 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
              {confirmDialog.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isDarkTheme 
                    ? 'bg-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                No, Keep Booking
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded-lg font-medium transition-all bg-red-600 text-white hover:bg-red-700`}
              >
                Yes, Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
