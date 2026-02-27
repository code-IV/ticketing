'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/services/bookingService';
import { Booking, GameTicket } from '@/types';
import ticketService from '@/services/ticketService';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Calendar, Clock, CreditCard, Eye, XCircle, Gamepad2, Ticket } from 'lucide-react';
import { format } from 'date-fns';

export default function MyBookingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [gameTickets, setGameTickets] = useState<GameTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadBookings();
    }
  }, [user, authLoading]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load both bookings and game tickets in parallel
      const [bookingsResponse, ticketsResponse] = await Promise.all([
        bookingService.getMyBookings(1, 50),
        ticketService.getMyTickets(1, 50)
      ]);
      
      setBookings(bookingsResponse.data.bookings || []);
      setGameTickets(ticketsResponse.data.tickets || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load bookings and tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    setCancelling(bookingId);
    try {
      await bookingService.cancelBooking(bookingId);
      await loadBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelling(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING_PAYMENT': return 'bg-yellow-100 text-yellow-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Combine bookings and game tickets, sort by creation date
  const getAllItems = () => {
    const items = [
      ...bookings.map(booking => ({ ...booking, itemType: 'BOOKING' as const })),
      ...gameTickets.map(ticket => ({ ...ticket, itemType: 'GAME_TICKET' as const }))
    ];
    
    return items.sort((a, b) => {
      const dateA = new Date(a.itemType === 'BOOKING' ? (a as any).booked_at : (a as any).purchased_at);
      const dateB = new Date(b.itemType === 'BOOKING' ? (b as any).booked_at : (b as any).purchased_at);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-lg text-gray-600">View and manage your ticket bookings</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {getAllItems().length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings or Tickets Yet</h3>
              <p className="text-gray-600 mb-6">You haven't made any bookings or purchased any game tickets. Start exploring events and games!</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => router.push('/events')}>Browse Events</Button>
                <Button onClick={() => router.push('/buy')} variant="secondary">Buy Game Tickets</Button>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {getAllItems().map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {item.itemType === 'GAME_TICKET' ? (
                          <>
                            <Gamepad2 className="w-5 h-5 text-purple-600" />
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">GAME TICKET</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">EVENT BOOKING</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {item.itemType === 'GAME_TICKET' ? (item as any).game_name : (item as any).event_name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.itemType === 'GAME_TICKET' 
                          ? `Ticket Code: ${(item as any).ticket_code}`
                          : `Booking Reference: ${(item as any).booking_reference}`
                        }
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        item.itemType === 'GAME_TICKET' ? (item as any).status : (item as any).booking_status
                      )}`}>
                        {(item.itemType === 'GAME_TICKET' ? (item as any).status : (item as any).booking_status)?.toUpperCase()}
                      </span>
                      {item.itemType === 'BOOKING' && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor((item as any).payment_status)}`}>
                          {(item as any).payment_status?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {item.itemType === 'GAME_TICKET' ? (
                      <>
                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                          <Gamepad2 className="h-4 w-4 text-purple-600" />
                          <span>{(item as any).game_name}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                          <CreditCard className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold">{(item as any).total_price.toFixed(2)} ETB</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                          <Ticket className="h-4 w-4 text-purple-600" />
                          <span>Qty: {(item as any).quantity}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span>{(item as any).event_date ? format(new Date((item as any).event_date), 'MMM dd, yyyy') : 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span>{(item as any).start_time} - {(item as any).end_time}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">{parseFloat((item as any).total_amount).toFixed(2)} ETB</span>
                        </div>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    {item.itemType === 'GAME_TICKET' 
                      ? `Purchased on ${format(new Date((item as any).purchased_at), 'MMM dd, yyyy HH:mm')}`
                      : `Booked on ${format(new Date((item as any).booked_at), 'MMM dd, yyyy HH:mm')}`
                    }
                  </p>
                </CardBody>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => item.itemType === 'GAME_TICKET' 
                      ? router.push(`/tickets/${(item as any).game_id}`)
                      : router.push(`/bookings/${item.id}`)
                    }
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {item.itemType === 'BOOKING' && (item as any).booking_status === 'confirmed' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleCancelBooking((item as any).id)}
                      isLoading={cancelling === (item as any).id}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
