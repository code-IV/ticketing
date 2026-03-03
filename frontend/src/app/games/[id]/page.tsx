"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gameService } from "@/services/adminService";
import { Game } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Play, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Users, 
  Clock, 
  Ticket,
  Star,
  Share2,
  Heart,
  Zap,
  Sparkles,
  ArrowUpRight
} from "lucide-react";

// Game-specific media for better visual testing
const gameMedia = {
  "1": { // Thunder Coaster
    images: [
      "https://images.unsplash.com/photo-1571003123894-1fbae28f2b73?w=1200&q=80", // Roller coaster
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80", // Theme park
      "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=1200&q=80", // Amusement ride
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80" // Park view
    ],
    videos: [
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    ]
  },
  "2": { // Splash Mountain
    images: [
      "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80", // Water park
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80", // Water slide
      "https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=1200&q=80", // Water ride
      "https://images.unsplash.com/photo-1533560904424-a0c61dc306fc?w=1200&q=80" // Splash
    ],
    videos: [
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
    ]
  },
  "3": { // Haunted Mansion
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=80", // Haunted house
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80", // Dark ride
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80", // Mansion
      "https://images.unsplash.com/photo-1476231682828-37e571bc172f?w=1200&q=80" // Spooky
    ],
    videos: [
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
    ]
  }
};

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const gameId = resolvedParams.id;
  const router = useRouter();
  
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    loadGame();
  }, [gameId]);

  const loadGame = async () => {
    // Use mock data for design testing
    const mockGames = {
      "1": {
        id: "1",
        name: "Thunder Coaster",
        description: "Experience the ultimate adrenaline rush on Ethiopia's tallest roller coaster. With breathtaking drops, high-speed twists, and gravity-defying loops, this state-of-the-art coaster reaches speeds of up to 120 km/h while offering spectacular views of the entire park.",
        rules: "Minimum height: 140cm. Secure all loose items. Follow staff instructions. Not recommended for pregnant riders or those with heart conditions. Keep hands and feet inside at all times.",
        status: "OPEN" as const,
        ticket_types: [
          {
            id: "1",
            event_id: "1",
            name: "Express Pass",
            category: "ADULT" as const,
            price: 250,
            description: "Skip the lines with priority access",
            max_quantity_per_booking: 6,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: "2", 
            event_id: "1",
            name: "Standard Ticket",
            category: "ADULT" as const,
            price: 180,
            description: "Regular admission to Thunder Coaster",
            max_quantity_per_booking: 6,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: "3", 
            event_id: "1",
            name: "Child Ticket",
            category: "CHILD" as const,
            price: 120,
            description: "For children under 12 (minimum height 140cm)",
            max_quantity_per_booking: 6,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        category: "Thrill Ride",
        capacity: 24,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      "2": {
        id: "2",
        name: "Splash Mountain",
        description: "Cool off on this epic water adventure! Navigate through winding rapids, experience thrilling drops, and get soaked in the final splash finale. Perfect for hot days and families looking for refreshing fun.",
        rules: "You will get wet! Secure electronic devices. Wear appropriate swimwear. Minimum height: 100cm. Life jackets provided for children under 8.",
        status: "OPEN" as const,
        ticket_types: [
          {
            id: "4",
            event_id: "2",
            name: "Family Package",
            category: "GROUP" as const,
            price: 450,
            description: "2 adults + 2 children bundle",
            max_quantity_per_booking: 4,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: "5", 
            event_id: "2",
            name: "Adult Ticket",
            category: "ADULT" as const,
            price: 150,
            description: "Single adult admission",
            max_quantity_per_booking: 6,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: "6", 
            event_id: "2",
            name: "Child Ticket",
            category: "CHILD" as const,
            price: 100,
            description: "For children under 12",
            max_quantity_per_booking: 6,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        category: "Water Ride",
        capacity: 8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      "3": {
        id: "3",
        name: "Haunted Mansion",
        description: "Step into a world of mystery and suspense in this haunted house adventure. Navigate through dark corridors, encounter spooky surprises, and solve puzzles to escape the supernatural realm.",
        rules: "Not recommended for children under 8. No flash photography. Stay with your group. Touching props is prohibited. Emergency exits are clearly marked.",
        status: "OPEN" as const,
        ticket_types: [
          {
            id: "7",
            event_id: "3",
            name: "VIP Experience",
            category: "ADULT" as const,
            price: 200,
            description: "Skip lines + exclusive behind-the-scenes access",
            max_quantity_per_booking: 4,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: "8", 
            event_id: "3",
            name: "Standard Admission",
            category: "ADULT" as const,
            price: 130,
            description: "Regular haunted house experience",
            max_quantity_per_booking: 6,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        category: "Dark Ride",
        capacity: 6,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };

    setLoading(true);
    
    // Simulate loading delay for better UX testing
    setTimeout(() => {
      const mockGame = mockGames[gameId as keyof typeof mockGames] || mockGames["1"];
      setGame(mockGame);
      setLoading(false);
    }, 1000);
  };

  const getMediaItems = () => {
    if (!game) return [];
    
    const items = [];
    const media = gameMedia[gameId as keyof typeof gameMedia] || gameMedia["1"];
    
    // Add main image
    items.push({
      type: 'image',
      url: media.images[0],
      thumbnail: media.images[0],
      alt: `${game.name} - Main View`
    });
    
    // Add additional images
    for (let i = 1; i < media.images.length; i++) {
      items.push({
        type: 'image',
        url: media.images[i],
        thumbnail: media.images[i],
        alt: `${game.name} - View ${i + 1}`
      });
    }
    
    // Add video if available
    if (media.videos.length > 0) {
      items.push({
        type: 'video',
        url: media.videos[0],
        thumbnail: media.images[media.images.length - 1],
        alt: `${game.name} - Video Tour`
      });
    }
    
    return items;
  };

  const navigateMedia = (direction: 'prev' | 'next') => {
    const mediaItems = getMediaItems();
    if (direction === 'prev') {
      setSelectedMediaIndex((prev) => prev === 0 ? mediaItems.length - 1 : prev - 1);
    } else {
      setSelectedMediaIndex((prev) => prev === mediaItems.length - 1 ? 0 : prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Zap className="w-12 h-12 text-gray-400 animate-bounce" />
          <span className="text-gray-800 font-black tracking-[0.5em] uppercase italic">Loading Adventure...</span>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-black text-gray-800 mb-4">Game Not Found</h2>
          <p className="text-gray-500 mb-8">The adventure you're looking for doesn't exist.</p>
          <button 
            onClick={() => router.push("/games")}
            className="px-8 py-4 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2 mx-auto shadow-sm"
          >
            <ArrowLeft size={16} /> Back to Games
          </button>
        </div>
      </div>
    );
  }

  const mediaItems = getMediaItems();
  const currentMedia = mediaItems[selectedMediaIndex];
  const gameIndex = parseInt(gameId) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Video/Image Background */}
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          {currentMedia?.type === 'video' ? (
            <video
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              poster={currentMedia.thumbnail}
            >
              <source src={currentMedia.url} type="video/mp4" />
            </video>
          ) : (
            <img 
              src={currentMedia?.url || gameMedia["1"].images[0]} 
              className="w-full h-full object-cover" 
              alt={currentMedia?.alt || game.name}
            />
          )}
          <div className="absolute inset-0 bg-linear-to-b from-gray-50/50 via-gray-50/30 to-gray-50" />
        </div>

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push("/games")}
          className="absolute top-8 left-8 z-20 flex items-center gap-2 px-6 py-3 bg-white/70 backdrop-blur-md border border-white/50 text-gray-800 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/90 transition-all shadow-sm"
        >
          <ArrowLeft size={16} /> Back to Games
        </motion.button>

        {/* Share & Favorite Buttons */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-8 right-8 z-20 flex gap-3"
        >
          <button className="w-12 h-12 bg-white/70 backdrop-blur-md border border-white/50 text-gray-700 rounded-2xl flex items-center justify-center hover:bg-white/90 transition-all shadow-sm">
            <Share2 size={18} />
          </button>
          <button className="w-12 h-12 bg-white/70 backdrop-blur-md border border-white/50 text-gray-700 rounded-2xl flex items-center justify-center hover:bg-white/90 transition-all shadow-sm">
            <Heart size={18} />
          </button>
        </motion.div>

        {/* Game Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-8 md:p-16">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-600 text-white px-4 py-2 rounded-full shadow-md">
                <span className="text-[10px] font-black uppercase tracking-widest">{game.status}</span>
              </div>
              <div className="flex items-center gap-1 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill={i < 4 ? "currentColor" : "none"} />
                ))}
                <span className="text-gray-600 text-sm ml-2">4.8 (324 reviews)</span>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black text-gray-800 tracking-tighter uppercase italic leading-none mb-6">
              {game.name}
            </h1>
            
            <p className="text-xl text-gray-600 font-medium leading-relaxed mb-8 max-w-3xl">
              {game.description}
            </p>

            <div className="flex flex-wrap gap-6 text-gray-500 text-sm">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-blue-500" />
                <span>Zone B-0{gameIndex + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={18} className="text-blue-500" />
                <span>{game.capacity || "Unlimited"} Players</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-blue-500" />
                <span>15-20 min</span>
              </div>
              <div className="flex items-center gap-2">
                <Ticket size={18} className="text-blue-500" />
                <span>From {game.ticket_types?.[0]?.price || "0"} ETB</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Media Navigation */}
        <div className="absolute bottom-8 right-8 z-20 flex items-center gap-3">
          <button
            onClick={() => navigateMedia('prev')}
            className="w-12 h-12 bg-white/70 backdrop-blur-md border border-white/50 text-gray-700 rounded-2xl flex items-center justify-center hover:bg-white/90 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => navigateMedia('next')}
            className="w-12 h-12 bg-white/70 backdrop-blur-md border border-white/50 text-gray-700 rounded-2xl flex items-center justify-center hover:bg-white/90 transition-all shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* Media Gallery */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="text-4xl md:text-6xl font-black text-gray-800 tracking-tighter uppercase italic mb-4">
              Explore <span className="text-blue-500">Gallery</span>
            </h2>
            <p className="text-gray-500 text-lg">Get a closer look at the adventure</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mediaItems.map((item, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  setSelectedMediaIndex(index);
                  setIsLightboxOpen(true);
                }}
                className={`relative aspect-video rounded-2xl overflow-hidden border-2 transition-all shadow-md ${
                  selectedMediaIndex === index ? 'border-blue-500 shadow-lg shadow-blue-500/30' : 'border-transparent hover:border-blue-500/50'
                }`}
              >
                <img 
                  src={item.thumbnail} 
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
                {item.type === 'video' && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white" fill="white" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Game Details */}
      <section className="py-20 px-6 md:px-12 bg-gray-100/80">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-black text-gray-800 tracking-tighter uppercase italic mb-6">
                About This <span className="text-blue-500">Adventure</span>
              </h3>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 text-lg leading-relaxed">
                  {game.description}
                </p>
                <p className="text-gray-600 text-lg leading-relaxed mt-4">
                  Experience the thrill of a lifetime at Bora Park's premier attraction. This state-of-the-art game combines cutting-edge technology with heart-pounding excitement to create an unforgettable adventure for visitors of all ages.
                </p>
              </div>
            </motion.div>

            {/* Rules */}
            {game.rules && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-3xl font-black text-gray-800 tracking-tighter uppercase italic mb-6">
                  Safety <span className="text-blue-500">Rules</span>
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-8">
                  <p className="text-yellow-800 text-sm leading-relaxed">{game.rules}</p>
                </div>
              </motion.div>
            )}

            {/* Requirements */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-3xl font-black text-gray-800 tracking-tighter uppercase italic mb-6">
                Requirements & <span className="text-blue-500">Info</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h4 className="text-accent font-black text-sm uppercase tracking-widest mb-2">Age Requirement</h4>
                  <p className="text-gray-800 text-2xl font-black">8+ Years</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h4 className="text-accent font-black text-sm uppercase tracking-widest mb-2">Duration</h4>
                  <p className="text-gray-800 text-2xl font-black">15-20 Min</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h4 className="text-accent font-black text-sm uppercase tracking-widest mb-2">Group Size</h4>
                  <p className="text-gray-800 text-2xl font-black">2-6 Players</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h4 className="text-accent font-black text-sm uppercase tracking-widest mb-2">Difficulty</h4>
                  <p className="text-gray-800 text-2xl font-black">Medium</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="sticky top-8"
            >
              <div className="bg-white/70 backdrop-blur-md border border-white/50 rounded-[48px] p-8 shadow-xl">
                <div className="text-center mb-8">
                  <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-black text-gray-800 tracking-tighter uppercase italic mb-2">
                    Ready to <span className="text-blue-500">Play?</span>
                  </h3>
                  <p className="text-gray-500 text-sm">Book your adventure now</p>
                </div>

                <div className="space-y-4 mb-8">
                  {game.ticket_types?.map((ticket) => (
                    <div key={ticket.id} className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-gray-800 font-black">{ticket.category}</p>
                          <p className="text-gray-500 text-sm">{ticket.name}</p>
                        </div>
                        <p className="text-gray-800 font-black text-xl">{ticket.price} ETB</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => router.push(`/buy?id=${game.id}`)}
                  className="w-full py-4 bg-white text-accent rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm border border-gray-200"
                >
                  Get Tickets <ArrowUpRight size={18} />
                </button>

                <p className="text-gray-400 text-xs text-center mt-4">
                  Instant confirmation • Mobile tickets
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-8 right-8 w-12 h-12 bg-white/70 backdrop-blur-md border border-white/50 text-gray-800 rounded-2xl flex items-center justify-center hover:bg-white/90 transition-all z-10 shadow-sm"
            >
              <X size={24} />
            </motion.button>

            <div className="relative max-w-6xl max-h-[90vh] w-full">
              {mediaItems[selectedMediaIndex]?.type === 'video' ? (
                <video
                  className="w-full h-full rounded-3xl"
                  controls
                  autoPlay
                  playsInline
                >
                  <source src={mediaItems[selectedMediaIndex]?.url} type="video/mp4" />
                </video>
              ) : (
                <img
                  src={mediaItems[selectedMediaIndex]?.url}
                  alt={mediaItems[selectedMediaIndex]?.alt}
                  className="w-full h-full object-contain rounded-3xl"
                />
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateMedia('prev');
              }}
              className="absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/70 backdrop-blur-md border border-white/50 text-gray-800 rounded-2xl flex items-center justify-center hover:bg-white/90 transition-all shadow-sm"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateMedia('next');
              }}
              className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/70 backdrop-blur-md border border-white/50 text-gray-800 rounded-2xl flex items-center justify-center hover:bg-white/90 transition-all shadow-sm"
            >
              <ChevronRight size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}