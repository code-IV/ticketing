"use client";
import { useEffect, useState } from "react";
import { gameService } from "@/services/adminService"; // Your public service
import { Ticket, Star, Clock, Info, Filter } from "lucide-react";
import Link from "next/link";
import { Game } from "@/types";
import { useRouter } from "next/navigation";

export default function GamesListingPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await gameService.getAll();
        setGames(response.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  const filteredGames =
    filter === "ALL" ? games : games.filter((g) => g.status === filter);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-indigo-600 font-black tracking-widest animate-pulse">
        BORA PARK...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* --- HERO HEADER --- */}
      <div className="bg-slate-900 pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
            World-Class <span className="text-indigo-500">Attractions</span>
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg">
            From heart-pounding roller coasters to family-friendly fun, discover
            the magic waiting for you at Bora Park.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8">
        {/* --- FILTER BAR --- */}
        <div className="bg-white p-2 rounded-2xl shadow-xl flex gap-2 overflow-x-auto no-scrollbar">
          {["ALL", "OPEN", "UPCOMING", "MAINTENANCE"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                filter === f
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* --- GAMES GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-12">
          {filteredGames.map((game) => (
            <div
              onClick={() => router.push(`/game/${game.id}`)}
              key={game.id}
              className="group relative bg-white rounded-[40px] overflow-hidden border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
            >
              {/* Image Container */}
              <div className="relative h-72 overflow-hidden">
                <img
                  src={"/api/placeholder/800/600"}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt={game.name}
                />
                <div className="absolute top-4 right-4">
                  <div
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${
                      game.status === "OPEN"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/20 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {game.status}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                      {game.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-amber-400">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-black text-slate-400">
                        4.9 (High Intensity)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase">
                      From
                    </span>
                    <p className="text-xl font-black text-indigo-600 leading-none">
                      {game.ticket_types?.find((t) => t.category === "adult")
                        ?.price ?? "__"}{" "}
                      <span className="text-xs">ETB</span>
                    </p>
                  </div>
                </div>

                <p className="text-slate-500 text-sm line-clamp-3 mb-8 leading-relaxed">
                  {game.description}
                </p>

                <div className="flex gap-3">
                  <Link href={`/games/${game.id}`} className="flex-1">
                    <button className="w-full py-4 bg-slate-50 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-colors">
                      Learn More
                    </button>
                  </Link>
                  <Link href={`/buy?id=${game.id}`} className="flex-1">
                    <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all">
                      Get Tickets
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
