"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { gameService } from "@/services/gameService";
import { Game } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card";
import { Gamepad2, Users, Ticket, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// Fallback emojis and images per index since backend doesn't return them
const gameVisuals = [
  { emoji: "🎢", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop" },
  { emoji: "🎡", image: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=400&h=250&fit=crop" },
  { emoji: "🚗", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=250&fit=crop" },
  { emoji: "👻", image: "https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=400&h=250&fit=crop" },
  { emoji: "🎠", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop" },
  { emoji: "🎯", image: "https://images.unsplash.com/photo-1533560904424-a0c61dc306fc?w=400&h=250&fit=crop" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  hover: { y: -6, transition: { duration: 0.2 } },
};

const BuyTicketsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchGames = async () => {
      if (!user) return; // Don't fetch if not authenticated
      
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching games for user:', user.id);
        const response = await gameService.getActiveGames(page, 12);
        console.log('Games response:', response);
        setGames(response.data.games || []);
        setTotalPages(response.data.pagination.totalPages);
      } catch (err: any) {
        console.error('Error fetching games:', err);
        console.error('Error response:', err.response);
        if (err.response?.status === 401) {
          setError('Please log in to view games');
          router.push('/login');
        } else {
          setError(err.response?.data?.message || "Failed to load games");
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (!authLoading) {
      fetchGames();
    }
  }, [user, authLoading, page]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-3" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Available Games</h1>
          <p className="text-lg text-gray-600">
            Choose your adventure and purchase tickets for exciting games at Bora Park
          </p>
        </div>

        {error && !loading && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm">{error}</p>
              {error.includes('log in') && (
                <button
                  onClick={() => router.push('/login')}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  Go to Login
                </button>
              )}
            </div>
          </div>
        )}

        {games.length === 0 && !loading ? (
          <div className="text-center py-12">
            <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Games Available</h3>
            <p className="text-gray-600">Check back soon for available games!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <AnimatePresence>
                {games.map((game, index) => {
                  const visual = gameVisuals[index % gameVisuals.length];
                  return (
                    <motion.div
                      key={game.id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      whileTap={{ scale: 0.97 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                          <h3 className="text-xl font-semibold text-gray-900">{game.name}</h3>
                        </CardHeader>
                        <CardBody className="space-y-3">
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {game.description || 'Experience this amazing game at Bora Park!'}
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-700">
                              <Gamepad2 className="h-4 w-4 mr-2 text-purple-600" />
                              <span>{game.category || 'Adventure Game'}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-700">
                              <Users className="h-4 w-4 mr-2 text-purple-600" />
                              <span>{game.capacity || 'Unlimited'} players</span>
                            </div>
                            {game.ticket_types && game.ticket_types.length > 0 && (
                              <div className="flex items-center text-sm text-gray-700">
                                <Ticket className="h-4 w-4 mr-2 text-purple-600" />
                                <span>Starting from {game.ticket_types[0]?.price} ETB</span>
                              </div>
                            )}
                          </div>
                        </CardBody>
                        <CardFooter>
                          <Link href={`/buy/${game.id}`} className="w-full">
                            <Button className="w-full">
                              View Details & Purchase
                            </Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
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
};

export default BuyTicketsPage;