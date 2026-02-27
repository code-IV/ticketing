"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Ticket, Star, MapPin, Zap, ChevronRight, Clock } from "lucide-react";
import { gameService } from "@/services/adminService";
import { eventService } from "@/services/eventService";
import { Event, Game } from "@/types";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};

export default function Home() {
  const [featuredGames, setFeaturedGames] = useState<Game[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    Promise.all([gameService.getAll(), eventService.getActiveEvents(1, 12)])
      .then(([gamesRes, eventsRes]) => {
        setFeaturedGames(gamesRes.data || []);
        setEvents(eventsRes.data.events || []);
      })
      .catch(console.log);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative h-[95vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/bora.jpg"
            className="w-full h-full object-cover brightness-[0.35] scale-105"
            alt="Bora Park"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="max-w-3xl"
          >
            <div className="inline-block px-5 py-2 bg-yellow-400/90 backdrop-blur-sm text-black font-black text-sm uppercase tracking-widest rounded-full mb-8 shadow-lg">
              Open Today 9:00 – 22:00
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-none mb-8">
              UNLEASH
              <br />
              <span className="text-blue-500">THE THRILL</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200/90 mb-12 max-w-xl leading-relaxed">
              Ethiopia's premier amusement destination
            </p>
            <div className="flex flex-wrap gap-5">
              <Link href="/buy">
                <Button
                  size="lg"
                  className="h-16 px-10 text-lg font-black bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-2xl shadow-blue-600/30"
                >
                  <Ticket className="mr-3 h-6 w-6" />
                  Buy Tickets
                </Button>
              </Link>
              <Link href="/games">
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-16 px-10 text-lg font-black border-2 border-white/30 text-white hover:bg-white/10 rounded-2xl backdrop-blur-md"
                >
                  Explore Rides
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900">
                Upcoming Events
              </h2>
              <p className="text-slate-500 mt-2">Don't miss the magic</p>
            </div>
            <Link
              href="/events"
              className="hidden md:flex items-center gap-2 text-blue-600 font-bold hover:underline"
            >
              Full Calendar <ChevronRight size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <motion.div
                key={event.id}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group bg-white rounded-3xl border border-slate-100 shadow-md hover:shadow-2xl transition-all overflow-hidden flex flex-col"
              >
                <div className="relative h-64">
                  <img
                    src="/api/placeholder/600/400"
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-5 left-5 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2 shadow-lg text-center min-w-[68px]">
                    <p className="text-xs font-black text-blue-600 uppercase tracking-tight">
                      {new Date(event.start_time).toLocaleString("default", {
                        month: "short",
                      })}
                    </p>
                    <p className="text-2xl font-black text-slate-900 leading-none">
                      {new Date(event.event_date).getDate()}
                    </p>
                  </div>
                  {!event.is_active && (
                    <div className="absolute inset-0 bg-black/65 flex items-center justify-center backdrop-blur-sm">
                      <span className="px-8 py-3 bg-red-600 text-white font-black text-sm uppercase tracking-widest rounded-full border-2 border-white/40 rotate-[-4deg] shadow-xl">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-7 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-3">
                    <Clock size={14} className="text-blue-600" />
                    {new Date(event.start_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3 line-clamp-2">
                    {event.name}
                  </h3>
                  <p className="text-slate-600 mb-8 line-clamp-3 flex-1">
                    {event.description}
                  </p>

                  <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-400 uppercase block">
                        From
                      </span>
                      <p className="text-2xl font-black text-slate-900">
                        {event.ticket_types?.find((t) => t.category === "adult")
                          ?.price ?? 0}
                        <span className="text-base font-bold"> ETB</span>
                      </p>
                    </div>
                    <Link href={`/buy?event=${event.id}`}>
                      <Button
                        disabled={!event.is_active}
                        className={`rounded-2xl font-black px-8 h-12 ${
                          !event.is_active
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200/40"
                        }`}
                      >
                        {event.is_active ? "Book Now" : "Full"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FEATURED ATTRACTIONS */}
      <section className="py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="flex justify-between items-end mb-14">
              <div>
                <h2 className="text-5xl font-black text-gray-900">
                  Must-Try Attractions
                </h2>
                <p className="text-gray-600 mt-3 text-lg">
                  The rides everyone talks about
                </p>
              </div>
              <Link
                href="/buy"
                className="hidden md:flex items-center gap-2 text-blue-600 font-bold hover:underline"
              >
                View All <ChevronRight size={22} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {featuredGames.map((game) => (
                <motion.div
                  key={game.id}
                  whileHover={{ scale: 1.04, y: -10 }}
                  className="group relative rounded-3xl overflow-hidden shadow-lg aspect-[4/5.2] hover:shadow-2xl transition-all duration-500"
                >
                  <img
                    src="/api/placeholder/600/800"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-800"
                    alt={game.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-9">
                    <span className="text-blue-400 font-black text-xs uppercase tracking-widest mb-3">
                      {"Thrill"}
                    </span>
                    <h3 className="text-3xl font-black text-white mb-5">
                      {game.name}
                    </h3>
                    <div className="flex justify-between items-center">
                      <p className="text-white/90 text-base">
                        From{" "}
                        <span className="text-2xl font-black text-white">
                          {game.ticket_types?.find(
                            (t) => t.category === "adult",
                          )?.price ?? "—"}
                        </span>{" "}
                        ETB
                      </p>
                      <Link href="/buy">
                        <Button
                          size="sm"
                          className="bg-white text-black font-black hover:bg-yellow-400 rounded-xl px-6"
                        >
                          BOOK
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-gradient-to-br from-slate-900 to-black py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { num: "25+", label: "Thriller Rides" },
            { num: "10k+", label: "Happy Visitors" },
            { num: "100%", label: "Safe & Secure" },
            { num: "4.9", label: "User Rating" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <p className="text-5xl md:text-6xl font-black text-white mb-3">
                {stat.num}
              </p>
              <p className="text-slate-400 text-sm md:text-base font-bold uppercase tracking-widest">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl"
        >
          <Zap className="absolute -top-20 -right-20 text-white/5 w-96 h-96" />
          <h2 className="text-5xl md:text-7xl font-black text-white mb-10 relative z-10">
            Ready to skip the lines?
          </h2>
          <Link href="/buy">
            <Button
              size="lg"
              className="bg-white text-blue-700 hover:bg-yellow-400 hover:text-black font-black px-16 h-18 text-2xl rounded-3xl shadow-2xl relative z-10"
            >
              GET TICKETS NOW
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
