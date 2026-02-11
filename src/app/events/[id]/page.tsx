'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { eventService } from '@/services/eventService';
import { bookingService } from '@/services/bookingService';
import { Event, TicketType, BookingItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Calendar, Clock, MapPin, Users, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [booking, setBooking] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'debit_card' | 'telebirr' | 'cash'>('telebirr');

  useEffect(() => {
    loadEvent();
  }, [params.id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEventById(params.id);
      setEvent(response.data?.event || null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const updateCart = (ticketTypeId: string, quantity: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (quantity <= 0) {
        delete newCart[ticketTypeId];
      } else {
        newCart[ticketTypeId] = quantity;
      }
      return newCart;
    });
  };

  const getTotalAmount = () => {
    if (!event?.ticket_types) return 0;
    return Object.entries(cart).reduce((total, [ticketTypeId, quantity]) => {
      const ticketType = event.ticket_types?.find(t => t.id === ticketTypeId);
      return total + (ticketType ? parseFloat(ticketType.price) * quantity : 0);
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const handleBooking = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (getTotalTickets() === 0) {
      setError('Please select at least one ticket');
      return;
    }

    setBooking(true);
    setError('');

    try {
      const items: BookingItem[] = Object.entries(cart).map(([ticketTypeId, quantity]) => ({
        ticketTypeId,
        quantity,
      }));

      const response = await bookingService.createBooking({
        eventId: params.id,
        items,
        paymentMethod,
      });

      router.push(`/bookings/${response.data?.booking.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/events')}>Back to Events</Button>
        </div>
      </div>
    );
  }

  const availableTickets = event.capacity - event.tickets_sold;
  const isSoldOut = availableTickets <= 0;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
              </CardHeader>
              <CardBody className="space-y-6">
                <p className="text-gray-700 text-lg">{event.description || 'Join us for an amazing experience at Bora Park!'}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Date</p>
                      <p className="text-gray-600">{format(new Date(event.event_date), 'EEEE, MMMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Time</p>
                      <p className="text-gray-600">{event.start_time} - {event.end_time}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Location</p>
                      <p className="text-gray-600">Bora Amusement Park, Addis Ababa</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Availability</p>
                      <p className="text-gray-600">{availableTickets} / {event.capacity} tickets remaining</p>
                    </div>
                  </div>
                </div>

                {isSoldOut && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    This event is sold out. Please check other available events.
                  </div>
                )}
              </CardBody>
            </Card>

            {!isSoldOut && event.ticket_types && event.ticket_types.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <h2 className="text-2xl font-bold text-gray-900">Select Tickets</h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  {event.ticket_types.map((ticketType) => (
                    <div key={ticketType.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{ticketType.name}</h3>
                        <p className="text-sm text-gray-600">{ticketType.description}</p>
                        <p className="text-lg font-bold text-blue-600 mt-1">{parseFloat(ticketType.price).toFixed(2)} ETB</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => updateCart(ticketType.id, (cart[ticketType.id] || 0) - 1)}
                          disabled={!cart[ticketType.id]}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-medium">{cart[ticketType.id] || 0}</span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => updateCart(ticketType.id, (cart[ticketType.id] || 0) + 1)}
                          disabled={(cart[ticketType.id] || 0) >= ticketType.max_quantity_per_booking}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Booking Summary
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                {getTotalTickets() === 0 ? (
                  <p className="text-gray-600 text-center py-4">No tickets selected</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {Object.entries(cart).map(([ticketTypeId, quantity]) => {
                        const ticketType = event.ticket_types?.find(t => t.id === ticketTypeId);
                        if (!ticketType) return null;
                        return (
                          <div key={ticketTypeId} className="flex justify-between text-sm">
                            <span className="text-gray-700">{quantity}x {ticketType.name}</span>
                            <span className="font-medium">{(parseFloat(ticketType.price) * quantity).toFixed(2)} ETB</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-blue-600">{getTotalAmount().toFixed(2)} ETB</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{getTotalTickets()} ticket(s)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="telebirr">Telebirr</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="debit_card">Debit Card</option>
                        <option value="cash">Cash (Pay at Park)</option>
                      </select>
                    </div>
                  </>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}
              </CardBody>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handleBooking}
                  disabled={getTotalTickets() === 0 || booking || isSoldOut}
                  isLoading={booking}
                >
                  {user ? 'Complete Booking' : 'Login to Book'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
