'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { GameTicketDetail } from '@/types';
import ticketService from '@/services/ticketService';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Gamepad2, Ticket, Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function GameTicketDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [gameData, setGameData] = useState<any>(null);
  const [tickets, setTickets] = useState<GameTicketDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gameId, setGameId] = useState<string>('');

  useEffect(() => {
    const id = Array.isArray(params.gameId) ? params.gameId[0] : params.gameId;
    setGameId(id || '');
  }, [params.gameId]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      console.log('Params:', params); // Debug log
      console.log('GameId:', gameId); // Debug log
      
      if (gameId) {
        loadGameTickets();
      } else {
        setError('No game ID provided');
        setLoading(false);
      }
    }
  }, [user, authLoading, gameId]);

  const loadGameTickets = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading tickets for gameId:', gameId); // Debug log
      console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL); // Debug log
      
      const response = await ticketService.getGameTicketsDetails(gameId);
      console.log('Response:', response); // Debug log
      
      if (response && response.data) {
        setGameData(response.data.game);
        setTickets(response.data.tickets);
      } else {
        setError('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Error loading game tickets:', err); // Debug log
      console.error('Error response:', err.response); // Debug log
      setError(err.response?.data?.message || 'Failed to load game tickets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'PENDING_PAYMENT': return 'bg-yellow-100 text-yellow-800';
      case 'USED': return 'bg-blue-100 text-blue-800';
      case 'EXPIRED':
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'AVAILABLE': return <CheckCircle className="w-4 h-4" />;
      case 'PENDING_PAYMENT': return <AlertCircle className="w-4 h-4" />;
      case 'USED': return <Clock className="w-4 h-4" />;
      case 'EXPIRED':
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardBody className="text-center py-12">
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Tickets</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/my-bookings')}>Back to Bookings</Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/my-bookings')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bookings
          </Button>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-2xl shadow-lg">
                <Gamepad2 className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{gameData?.name}</h1>
                <p className="text-gray-600 mb-4">{gameData?.description}</p>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4" />
                    <span>{tickets.length} Ticket{tickets.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Purchased {format(new Date(tickets[0]?.purchased_at || ''), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {gameData?.rules && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Game Rules</h4>
                <p className="text-yellow-700 text-sm">{gameData.rules}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket, index) => (
            <Card key={ticket.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5" />
                    <span className="font-semibold">Ticket #{index + 1}</span>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.ticket_game_status)}`}>
                    {getStatusIcon(ticket.ticket_game_status)}
                    <span>{ticket.ticket_game_status}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardBody className="p-6">
                {/* QR Code Placeholder */}
                <div className="bg-gray-100 rounded-lg p-4 mb-4 flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-black rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <div className="grid grid-cols-3 gap-1">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className={`w-2 h-2 ${i % 2 === 0 ? 'bg-white' : 'bg-black'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">QR Code</p>
                  </div>
                </div>
                
                {/* Ticket Details */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Ticket Code</p>
                    <p className="font-mono text-sm font-semibold bg-gray-100 px-2 py-1 rounded">
                      {ticket.ticket_code}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.ticket_game_status)}`}>
                      {getStatusIcon(ticket.ticket_game_status)}
                      <span>{ticket.ticket_game_status}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Price</p>
                    <p className="font-semibold">{ticket.total_price.toFixed(2)} ETB</p>
                  </div>
                  
                  {ticket.used_at && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Used At</p>
                      <p className="text-sm">{format(new Date(ticket.used_at), 'MMM dd, yyyy HH:mm')}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Expires</p>
                    <p className="text-sm">{format(new Date(ticket.expires_at), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
