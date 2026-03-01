"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/services/bookingService";
import { Bookings, GameBookingItemDetail } from "@/types";
import { format } from "date-fns";
import { 
  Ticket, 
  Info, 
  Sparkles, 
  MapPin, 
  QrCode, 
  X, 
  Download, 
  Share2 
} from "lucide-react";

// ── COMPONENTS ─────────────────────────────────────────────────────────────

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestName: string;
  refId: string;
  qrValue?: string;
}

interface CollectorGameCardProps {
  item: {
    id: string;
    game_name: string;
    image: string;
    location: string;
    ticket_types: Array<{
      id: string;
      category: string;
      purchased: number;
      used: number;
    }>;
  };
  index: number;
}

const QRModal = ({ isOpen, onClose, guestName, refId, qrValue }: QRModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-slate-900 p-8 text-center relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white/50 hover:text-white">
              <X size={20} />
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-4">
              <Sparkles size={12} /> Master Pass
            </div>
            <h2 className="text-white font-black text-2xl uppercase tracking-tighter">{guestName}</h2>
            <p className="text-indigo-300/60 font-mono text-xs uppercase tracking-widest mt-1">ID: {refId}</p>
          </div>

          <div className="p-10 flex flex-col items-center">
            <div className="bg-slate-50 p-6 rounded-[32px] border-4 border-slate-100 mb-8 relative group">
              <QrCode size={180} strokeWidth={1.5} className="text-slate-900" />
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <button className="flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">
                <Download size={16} /> Save
              </button>
              <button className="flex items-center justify-center gap-2 py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const CollectorGameCard = ({ item, index }: CollectorGameCardProps) => {
  const totalPurchased = item.ticket_types.reduce((s, t) => s + t.purchased, 0);
  const totalUsed = item.ticket_types.reduce((s, t) => s + t.used, 0);
  const available = totalPurchased - totalUsed;
  const isFullyUsed = available === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`group relative h-95 w-full rounded-4xl overflow-hidden border border-slate-100 shadow-sm transition-all ${
        isFullyUsed ? "grayscale opacity-80" : "hover:shadow-2xl hover:scale-[1.02]"
      }`}
    >
      <img src={item.image} alt={item.game_name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-black/80" />

      <div className="absolute top-0 left-0 right-0 p-7 flex justify-between items-start z-10">
        <div>
          <h3 className="font-black text-3xl text-white tracking-tighter drop-shadow-lg leading-none">{item.game_name}</h3>
          <p className="flex items-center gap-1.5 text-white/60 text-[10px] font-bold uppercase mt-2">
            <MapPin size={12} /> {item.location}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-white/10 text-right text-white">
          <span className="text-[9px] font-black opacity-50 uppercase block mb-1">Rides Left</span>
          <span className="font-black text-4xl tracking-tighter leading-none">{available}</span>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6 z-10">
        <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10 shadow-xl">
          <div className="flex justify-between items-center text-white/80 text-[11px] font-black uppercase mb-4">
            <span>Summary</span>
            <span className="flex items-center gap-1.5 opacity-50"><Ticket size={12}/> {totalUsed}/{totalPurchased}</span>
          </div>
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(available / totalPurchased) * 100}%` }} className="h-full bg-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ── PAGE ───────────────────────────────────────────────────────────────────

export default function GameBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Bookings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (params.id) {
      loadBooking(params.id as string);
    }
  }, [user, params.id]);

  const loadBooking = async (bookingId: string) => {
    try {
      setLoading(true);
      console.log('🔍 Fetching booking with ID:', bookingId);
      const response = await bookingService.getBookingById(bookingId);
      console.log('📦 Full API Response:', response);
      console.log('📋 Booking Data:', response.data);
      console.log('🎯 Booking Type:', response.data?.type);
      console.log('📝 Booking Items:', response.data?.items);
      
      if (response.data) {
        setBooking(response.data);
        console.log('✅ Booking set successfully');
      }
    } catch (err: any) {
      console.error('❌ Error loading booking:', err);
      setError(err.response?.data?.message || "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#345271] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Booking Not Found</h2>
          <p className="text-slate-500 mb-4">{error || "The booking you're looking for doesn't exist."}</p>
          <button 
            onClick={() => router.push("/my-bookings")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-500 transition-all"
          >
            Back to My Bookings
          </button>
        </div>
      </div>
    );
  }

  // Transform booking items to match expected format for CollectorGameCard
  console.log('🔄 Starting data transformation...');
  console.log('🎮 Booking type check:', (booking as any)?.type);
  console.log('📦 Available items:', (booking as any)?.items);
  
  const gameItems = (booking as any)?.type === 'GAME' ? (booking as any)?.items?.map((item: GameBookingItemDetail) => {
    console.log('🎯 Processing item:', item);
    console.log('📋 Item properties:', Object.keys(item));
    
    const transformedItem = {
      id: item.id,
      game_name: item.game_name || 'Unknown Game',
      image: "https://images.unsplash.com/photo-1616091216791-a5360b5fc78a?q=80&w=600&auto=format&fit=crop",
      location: (item as any).location || "Main Zone", // Type assertion for missing property
      ticket_types: [
        {
          id: item.id,
          category: "general",
          purchased: item.quantity || 1,
          used: 0, // We'll need to calculate this from tickets
        }
      ],
    };
    
    console.log('✨ Transformed item:', transformedItem);
    return transformedItem;
  }) || [] : [];
  
  console.log('🎪 Final gameItems array:', gameItems);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 pt-10 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* UPDATED HEADER SECTION */}
<header className="mb-14 flex flex-col md:flex-row md:items-center justify-between gap-8">
  <div className="flex flex-col md:flex-row items-center gap-6">
    
    {/* Pulsing QR Trigger */}
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setIsQRModalOpen(true)}
      className="relative group shrink-0"
    >
      <div className="absolute -inset-2 bg-linear-to-tr from-indigo-600 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-40 animate-pulse transition duration-1000"></div>
      <div className="relative bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1">
        <QrCode size={32} className="text-slate-900" />
        <span className="text-[8px] font-black text-indigo-600 uppercase tracking-tighter">Tap Pass</span>
      </div>
    </motion.button>

    <div className="text-center md:text-left">
      
      <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
        Your <span className="text-indigo-600">Adventure</span>
      </h1>
      <p className="text-slate-500 mt-1 text-sm font-medium">
        Pass for <span className="text-slate-900 font-bold">{user?.first_name ? `${user.first_name} ${user.last_name}` : "Guest"}</span> · ID: <span className="font-mono">{booking.booking_reference}</span>
      </p>
    </div>
  </div>

  {/* STATS: Changed 'hidden lg:flex' to 'hidden sm:flex' to show on tablets */}
  <div className="hidden sm:flex items-center gap-4 bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
    <div className="text-right">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Total Rides</p>
      <p className="text-xl font-black text-slate-900">12</p>
    </div>
    <div className="w-px h-8 bg-slate-100 mx-2" />
    <div className="text-right">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Ready</p>
      <p className="text-xl font-black text-indigo-600">7</p>
    </div>
  </div>
</header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {gameItems.length > 0 ? (
              gameItems.map((item: any, i: number) => (
                <CollectorGameCard key={item.id} item={item} index={i} />
              ))
            ) : (
              // Fallback mock data for testing UI
              [
                {
                  id: "mock-1",
                  game_name: "Bumper Ride",
                  image: "https://images.unsplash.com/photo-1616091216791-a5360b5fc78a?q=80&w=600&auto=format&fit=crop",
                  location: "Zone A: Thrill Alley",
                  ticket_types: [
                    { id: "tt-1a", category: "adult", purchased: 2, used: 1 },
                    { id: "tt-1b", category: "child", purchased: 4, used: 0 },
                  ],
                },
                {
                  id: "mock-2",
                  game_name: "Haunted House",
                  image: "https://images.unsplash.com/photo-1518005068251-3721d0140231?q=80&w=600&auto=format&fit=crop",
                  location: "Zone C: The Crypt",
                  ticket_types: [
                    { id: "tt-2a", category: "adult", purchased: 3, used: 0 },
                  ],
                },
                {
                  id: "mock-3",
                  game_name: "Ferris Wheel",
                  image: "https://images.unsplash.com/photo-1541019183-5c08d5113d50?q=80&w=600&auto=format&fit=crop",
                  location: "Zone B: Panorama View",
                  ticket_types: [
                    { id: "tt-3a", category: "adult", purchased: 2, used: 2 },
                    { id: "tt-3b", category: "child", purchased: 2, used: 2 },
                  ],
                },
              ].map((item, i) => (
                <CollectorGameCard key={item.id} item={item} index={i} />
              ))
            )}
          </AnimatePresence>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-20 bg-slate-900 rounded-[40px] p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-white/10 text-indigo-400 flex items-center justify-center shrink-0 border border-white/10">
            <Info size={32} />
          </div>
          <div className="text-center md:text-left flex-1">
            <h4 className="font-black text-white uppercase text-sm tracking-widest mb-2">Getting Scanned</h4>
            <p className="text-sm text-slate-400 font-medium">Show the Master QR code at any attraction entrance. Operators will scan it to deduct a ride from your balance.</p>
          </div>
          <button onClick={() => setIsQRModalOpen(true)} className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all">
            Show QR Now
          </button>
        </motion.div>
      </div>

      <QRModal 
        isOpen={isQRModalOpen} 
        onClose={() => setIsQRModalOpen(false)} 
        guestName={user?.first_name ? `${user.first_name} ${user.last_name}` : "Guest"}
        refId={booking.booking_reference}
      />
    </div>
  );
}