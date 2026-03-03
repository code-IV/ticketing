"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Game } from "@/types";
import { 
  MapPin, 
  Clock, 
  Users, 
  Sparkles,
  Ticket,
  ArrowUpRight,
  Zap
} from "lucide-react";
import { useTheme } from '@/contexts/ThemeContext';

const gameVisuals = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=800&q=80",
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
];

export default function GamesListingPage() {
  const { isDarkTheme } = useTheme();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const mockGames = [
      {
        id: "1",
        name: "Thunder Coaster",
        description: "Ethiopia's tallest roller coaster with breathtaking drops and high-speed twists",
        status: "OPEN" as const,
        ticket_types: [
          { 
            id: "1", 
            event_id: "1",
            name: "Express Pass",
            category: "ADULT" as const, 
            price: 250,
            description: "Skip the lines",
            max_quantity_per_booking: 6,
            is_active: true,
            created_at: "",
            updated_at: ""
          }
        ],
        category: "Thrill Ride",
        capacity: 24,
        created_at: "",
        updated_at: ""
      },
      {
        id: "2",
        name: "Splash Mountain",
        description: "Epic water adventure with thrilling drops and refreshing fun",
        status: "OPEN" as const,
        ticket_types: [
          { 
            id: "4", 
            event_id: "2",
            name: "Family Package",
            category: "GROUP" as const, 
            price: 450,
            description: "2 adults + 2 children",
            max_quantity_per_booking: 4,
            is_active: true,
            created_at: "",
            updated_at: ""
          }
        ],
        category: "Water Ride",
        capacity: 8,
        created_at: "",
        updated_at: ""
      },
      {
        id: "3",
        name: "Haunted Mansion",
        description: "Spooky adventure through dark corridors and supernatural realms",
        status: "OPEN" as const,
        ticket_types: [
          { 
            id: "7", 
            event_id: "3",
            name: "VIP Experience",
            category: "ADULT" as const, 
            price: 200,
            description: "Skip lines + exclusive access",
            max_quantity_per_booking: 4,
            is_active: true,
            created_at: "",
            updated_at: ""
          }
        ],
        category: "Dark Ride",
        capacity: 6,
        created_at: "",
        updated_at: ""
      }
    ];
    
    setTimeout(() => {
      setGames(mockGames);
      setLoading(false);
    }, 500);
  }, []);

  const filteredGames = filter === "ALL" ? games : games.filter((g) => g.status === filter);

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-white'}`} >
      <div className="flex flex-col items-center gap-4">
        <Zap className="w-12 h-12 animate-pulse" />
        <span className={`font-light tracking-wider ${isDarkTheme ? 'text-gray-400' : 'text-gray-400'}`}>loading adventures...</span>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-white'}`} >
      {/* Abstract shapes in background with #ffd84f */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255,216,79,0.2) 0%, transparent 70%)' }}
        />
        <div 
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255,216,79,0.2) 0%, transparent 70%)' }}
        />
      </div>

      {/* Hero – crisp and minimal */}
      <section className="relative pt-24 pb-12 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >

          <h1 className={`text-5xl md:text-7xl font-black tracking-tight mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
            pure <span style={{ color: '#ffd84f' }}>adrenaline</span>
          </h1>
          <p className={`text-lg font-light max-w-2xl mx-auto ${isDarkTheme ? 'text-gray-400' : 'text-gray-400'}`}>
            clean design. bold thrills. zero clutter.
          </p>
        </motion.div>
      </section>

      {/* Filter – subtle underline style */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex flex-wrap justify-center gap-8">
          {["ALL", "OPEN", "UPCOMING", "MAINTENANCE"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-lg font-extrabold transition-all pb-1 ${
                filter === f
                  ? "border-b-2"
                  : "text-gray-300 hover:text-gray-500"
              }`}
              style={filter === f ? { color: '#ffd84f', borderBottomColor: '#ffd84f' } : {}}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Card grid – original dark card design with #ffd84f accents */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              onClick={() => router.push(`/games/${game.id}`)}
              className="group relative h-[520px] rounded-[48px] overflow-hidden border-2 border-transparent transition-all duration-500 cursor-pointer shadow-xl hover:border-[#ffd84f]/30"
            >
              {/* Image Background Layer */}
              <div className="absolute inset-0">
                <img 
                  src={gameVisuals[index % 3]} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                  alt={game.name} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
              </div>

              {/* Status Badge */}
              <div className="absolute top-8 left-8">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full">
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">
                    {game.status}
                  </span>
                </div>
              </div>

              {/* Price Tag Overlay – #ffd84f background with black text for contrast */}
              <div className="absolute top-8 right-8 w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-lg transform -rotate-12 group-hover:rotate-0 transition-transform"
                   style={{ backgroundColor: '#ffd84f' }}>
                <span className="text-[8px] font-black uppercase opacity-80 text-black">From</span>
                <span className="text-sm font-black italic text-black">
                  {game.ticket_types?.[0]?.price ?? "0"}
                </span>
              </div>

              {/* Bottom Content Area */}
              <div className="absolute bottom-0 left-0 right-0 p-10">
                <div className="flex items-center gap-2 mb-3">
                    <MapPin size={14} style={{ color: '#ffd84f' }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#ffd84f' }}>Zone B-0{index + 1}</span>
                </div>
                
                <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none mb-4 group-hover transition-colors"
                    style={{ '--hover-color': '#ffd84f' } as React.CSSProperties}>
                  {game.name}
                </h3>

                <p className="text-slate-300/80 text-sm line-clamp-2 mb-8 font-medium leading-relaxed group-hover:text-white transition-colors">
                  {game.description}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="flex-1 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all"
                          style={{ hover: { color: '#000' } } as React.CSSProperties} // fallback: we'll use a class for hover text color
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#000')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '')}>
                    Quick View
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); router.push(`/buy?id=${game.id}`); }}
                    className="flex-[1.5] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#ffd84f', color: '#000' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e6c247')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffd84f')}
                  >
                    Get Tickets <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-300 font-light">no games match your filter.</p>
          </div>
        )}
      </div>

      {/* Minimal footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-300 font-light">
        <span>© Bora Park – fresh perspective</span>
      </footer>

      <style jsx>{`
        .group:hover h3 {
          color: #ffd84f;
        }
        .group:hover .quick-view {
          color: #000;
        }
      `}</style>
    </div>
  );
}