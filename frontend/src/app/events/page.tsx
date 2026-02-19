'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { eventService } from '@/services/eventService';
import { Event } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Calendar, Clock, Users, Ticket } from 'lucide-react';
import { format } from 'date-fns';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadEvents();
  }, [page]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getActiveEvents(page, 12);
      setEvents(response.data.events || []);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Upcoming Events</h1>
          <p className="text-lg text-gray-600">
            Book your tickets now for these exciting events at Bora Park
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {events.length === 0 && !loading ? (
          <div className="text-center py-12">
            <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Available</h3>
            <p className="text-gray-600">Check back soon for upcoming events!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <h3 className="text-xl font-semibold text-gray-900">{event.name}</h3>
                  </CardHeader>
                  <CardBody className="space-y-3">
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {event.description || 'Join us for an amazing day at Bora Park!'}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-700">
                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                        {format(new Date(event.event_date), 'MMMM dd, yyyy')}
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <Clock className="h-4 w-4 mr-2 text-blue-600" />
                        {event.start_time} - {event.end_time}
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <Users className="h-4 w-4 mr-2 text-blue-600" />
                        {event.available_tickets || event.capacity - event.tickets_sold} tickets available
                      </div>
                    </div>
                    {event.tickets_sold >= event.capacity && (
                      <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-medium">
                        Sold Out
                      </div>
                    )}
                  </CardBody>
                  <CardFooter>
                    <Link href={`/events/${event.id}`} className="w-full">
                      <Button className="w-full" disabled={event.tickets_sold >= event.capacity}>
                        {event.tickets_sold >= event.capacity ? 'Sold Out' : 'View Details & Book'}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
