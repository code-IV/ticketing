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
  Eye
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { Booking } from '@/types';

export default function BookingDetailsPage() {
  const { isDarkTheme } = useTheme();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  
  // State management
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Load booking details
  const loadBooking = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminService.getBookingDetails(id);
      if (response.success && response.data) {
        setBooking(response.data.booking);
      } else {
        setError('Booking not found');
      }
    } catch (err: any) {
      console.error('Error loading booking:', err);
      setError(`Failed to load booking: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  // Cancel booking
  const handleCancelBooking = useCallback(() => {
    if (!booking) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Booking',
      message: `Are you sure you want to cancel booking "${booking.bookingReference}" for ${booking.firstName} ${booking.lastName}?`,
      onConfirm: async () => {
        try {
          setCancelling(true);
          await adminService.cancelBooking(booking.id);
          // Reload booking to get updated status
          await loadBooking();
          setConfirmDialog(null);
        } catch (err: any) {
          console.error('Error cancelling booking:', err);
          setError(`Failed to cancel booking: ${err.message || 'Unknown error'}`);
        } finally {
          setCancelling(false);
        }
      }
    });
  }, [booking]);

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status.toLowerCase()) {
      case 'confirmed':
        return `${baseClasses} ${isDarkTheme ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'}`;
      case 'pending':
        return `${baseClasses} ${isDarkTheme ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`;
      case 'cancelled':
        return `${baseClasses} ${isDarkTheme ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700'}`;
      case 'refunded':
        return `${baseClasses} ${isDarkTheme ? 'bg-gray-900/50 text-gray-400' : 'bg-gray-100 text-gray-700'}`;
      default:
        return `${baseClasses} ${isDarkTheme ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'}`;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status.toLowerCase()) {
      case 'completed':
        return `${baseClasses} ${isDarkTheme ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'}`;
      case 'pending':
        return `${baseClasses} ${isDarkTheme ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`;
      case 'failed':
        return `${baseClasses} ${isDarkTheme ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700'}`;
      case 'refunded':
        return `${baseClasses} ${isDarkTheme ? 'bg-gray-900/50 text-gray-400' : 'bg-gray-100 text-gray-700'}`;
      default:
        return `${baseClasses} ${isDarkTheme ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'}`;
    }
  };

  // Retry loading
  const handleRetry = useCallback(() => {
    setError(null);
    loadBooking();
  }, [loadBooking]);

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
                ? 'bg-gray-700 text-white hover:bg-gray-600' 
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

        {/* Booking Details Card */}
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Card Header */}
          <div className={`px-6 py-4 border-b ${isDarkTheme ? 'border-gray-700 bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  booking.status === 'cancelled' ? 'bg-red-100' : 
                  booking.status === 'confirmed' ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  {booking.status === 'cancelled' ? (
                    <X className={`w-8 h-8 ${isDarkTheme ? 'text-red-600' : 'text-red-500'}`} />
                  ) : booking.status === 'confirmed' ? (
                    <CheckCircle className={`w-8 h-8 ${isDarkTheme ? 'text-green-600' : 'text-green-500'}`} />
                  ) : (
                    <AlertTriangle className={`w-8 h-8 ${isDarkTheme ? 'text-yellow-600' : 'text-yellow-500'}`} />
                  )}
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {booking.bookingReference}
                  </h2>
                  <div className={getStatusBadge(booking.status)} />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Booking ID: {booking.id}
                </span>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-6 space-y-6">
            
            {/* Customer Information Section */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                <Users className="w-5 h-5" />
                Customer Information
              </h3>
              <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      Full Name
                    </label>
                    <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      {booking.firstName} {booking.lastName}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      Email Address
                    </label>
                    <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      {booking.email || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Information Section */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                <Calendar className="w-5 h-5" />
                Booking Information
              </h3>
              <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      Booking Reference
                    </label>
                    <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      {booking.bookingReference}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      Booking Status
                    </label>
                    <div className={getStatusBadge(booking.status)} />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      Payment Status
                    </label>
                    <div className={getPaymentStatusBadge(booking.paymentStatus || 'PENDING')} />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Amount
                    </label>
                    <p className={`font-medium text-lg ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      ETB {parseFloat(booking.totalAmount).toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      Booked Date
                    </label>
                    <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      {new Date(booking.bookedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Items Section */}
            {booking.passes && (
              <div>
                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  <Eye className="w-5 h-5" />
                  Booking Items
                </h3>
                <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p>Booking items and ticket details would be displayed here based on the passes structure.</p>
                    <p className="mt-2">This section would show detailed information about events, games, and ticket types included in this booking.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card Actions */}
          <div className={`px-6 py-4 border-t ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Download receipt functionality
                    console.log('Download receipt for booking:', booking.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isDarkTheme 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  <Download size={16} />
                  Download Receipt
                </button>
                
                <button
                  onClick={() => {
                    // Resend confirmation email functionality
                    console.log('Resend confirmation for booking:', booking.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isDarkTheme 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  <RefreshCw size={16} />
                  Resend Confirmation
                </button>
              </div>
              
              {booking.status === 'CONFIRMED' && (
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                    cancelling ? 'animate-pulse' : ''
                  }`}
                >
                  {cancelling ? (
                    <>
                      <RefreshCw className={`h-4 w-4 animate-spin mr-2`} />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Cancel Booking
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDialog(null)} />
          <div className={`relative rounded-2xl shadow-2xl max-w-md w-full mx-4 ${
            isDarkTheme ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-red-100`}>
                  <AlertTriangle className={`w-6 h-6 ${isDarkTheme ? 'text-red-600' : 'text-red-500'}`} />
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
