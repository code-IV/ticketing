"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Ticket, ChevronRight, Clock, Play, ArrowDownRight } from "lucide-react";
import { gameService } from "@/services/adminService";
import { eventService } from "@/services/eventService";
import { Event, Game } from "@/types";

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

const ACCENT = "#FFD84D";

export default function Home() {
  const [featuredGames, setFeaturedGames] = useState<Game[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    Promise.all([gameService.getAll(), eventService.getActiveEvents(1, 6)])
      .then(([gamesRes, eventsRes]) => {
        setFeaturedGames(gamesRes.data?.slice(0, 3) || []);
        setEvents(eventsRes.data.events || []);
      })
      .catch(console.log);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative h-screen flex items-end pb-20 overflow-hidden">
        {/* Background image with parallax */}
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <img
            src="/bora.jpg"
            className="w-full h-full object-cover"
            alt="Bora Park"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/60 to-transparent" />
        </motion.div>

        {/* Floating badge */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="absolute top-48 right-8 md:right-46 bg-[#FFD84D] text-black px-5 py-3 rounded-full font-black text-s uppercase tracking-widest shadow-xl rotate-12"
        >
          Open Today · 9:00–22:00
        </motion.div>

        <div className="relative z-10 w-full px-6 sm:px-16 lg:px-28 mr-90">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-7xl mx-auto"
          >
            <motion.p variants={fadeUp} className="text-[#FFD84D] font-black text-sm uppercase tracking-[0.3em] mb-6">
              Ethiopia's Premier Amusement Park
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="text-[clamp(4rem,12vw,10rem)] font-black leading-[0.88] tracking-tight mb-10"
              style={{ fontFamily: "'Arial Black', sans-serif" }}
            >
              UNLEASH<br />
              <span style={{ color: ACCENT }}>THE</span><br />
              THRILL
            </motion.h1>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 items-center">
              <Link href="/buy">
                <button className="group flex items-center gap-3 bg-[#FFD84D] text-black font-black text-base px-8 py-4 rounded-full hover:bg-white transition-all duration-300 shadow-2xl shadow-yellow-400/20">
                  <Ticket className="h-5 w-5" />
                  Buy Tickets
                  <ArrowDownRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
                </button>
              </Link>
              <Link href="/games">
                <button className="flex items-center gap-3 border-2 border-white/20 text-white font-bold text-base px-8 py-4 rounded-full hover:border-white/60 hover:bg-white/5 transition-all duration-300 backdrop-blur-sm">
                  <Play className="h-4 w-4 fill-current" />
                  Explore Rides
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <div className="w-px h-16 bg-gradient-to-b from-white/0 via-white/40 to-white/0 animate-pulse" />
          <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Scroll</span>
        </motion.div>
      </section>

      {/* ── EVENTS ───────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="flex justify-between items-end mb-16">
              <div>
                <p className="text-[#FFD84D] font-black text-xs uppercase tracking-[0.3em] mb-3">What's On</p>
                <h2 className="text-5xl md:text-6xl font-black leading-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                  Upcoming<br />Events
                </h2>
              </div>
              <Link href="/events" className="hidden md:flex items-center gap-2 text-white/50 hover:text-[#FFD84D] font-bold text-sm transition-colors">
                Full Calendar <ChevronRight size={16} />
              </Link>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="group bg-white/5 border border-white/8 rounded-3xl overflow-hidden hover:border-[#FFD84D]/30 hover:bg-white/8 transition-all duration-500"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src="/api/placeholder/600/400"
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
                    <div className="absolute top-4 left-4 bg-[#FFD84D] text-black rounded-2xl px-4 py-2 text-center min-w-[56px] shadow-lg">
                      <p className="text-[10px] font-black uppercase tracking-tight">
                        {new Date(event.start_time).toLocaleString("default", { month: "short" })}
                      </p>
                      <p className="text-2xl font-black leading-none">
                        {new Date(event.event_date).getDate()}
                      </p>
                    </div>
                    {!event.is_active && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                        <span className="px-6 py-2 bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-full -rotate-3">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase mb-3">
                      <Clock size={12} className="text-[#FFD84D]" />
                      {new Date(event.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <h3 className="text-xl font-black mb-2 line-clamp-1">{event.name}</h3>
                    <p className="text-white/50 text-sm mb-6 line-clamp-2 leading-relaxed">{event.description}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/8">
                      <div>
                        <span className="text-white/30 text-[10px] font-bold uppercase block mb-0.5">From</span>
                        <p className="text-2xl font-black">
                          {event.ticket_types?.find((t) => t.category === "adult")?.price ?? 0}
                          <span className="text-sm font-bold text-white/50 ml-1">ETB</span>
                        </p>
                      </div>
                      <Link href={`/buy?event=${event.id}`}>
                        <button
                          disabled={!event.is_active}
                          className={`rounded-2xl font-black text-sm px-6 py-3 transition-all ${
                            !event.is_active
                              ? "bg-white/10 text-white/30 cursor-not-allowed"
                              : "bg-[#FFD84D] text-black hover:bg-white"
                          }`}
                        >
                          {event.is_active ? "Book Now" : "Full"}
                        </button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── ATTRACTIONS ──────────────────────────────────────────────────── */}
      <section className="py-28 px-6 sm:px-10 lg:px-16 bg-gradient-to-b from-transparent to-white/3">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="flex justify-between items-end mb-16">
              <div>
                <p className="text-[#FFD84D] font-black text-xs uppercase tracking-[0.3em] mb-3">Top Picks</p>
                <h2 className="text-5xl md:text-6xl font-black leading-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                  Must-Try<br />Attractions
                </h2>
              </div>
              <Link href="/games" className="hidden md:flex items-center gap-2 text-white/50 hover:text-[#FFD84D] font-bold text-sm transition-colors">
                View All <ChevronRight size={16} />
              </Link>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredGames.map((game, i) => (
                <motion.div
                  key={game.id}
                  variants={fadeUp}
                  whileHover={{ scale: 1.02, y: -8 }}
                  transition={{ duration: 0.4 }}
                  className="group relative rounded-3xl overflow-hidden aspect-[3/4] cursor-pointer"
                >
                  <img
                    src="/api/placeholder/600/800"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt={game.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                  {/* Corner accent */}
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#FFD84D] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                    <ArrowDownRight className="w-5 h-5 text-black rotate-[-45deg]" />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-7">
                    <span className="text-[#FFD84D] font-black text-[10px] uppercase tracking-[0.3em] block mb-2">
                      Thrill Ride
                    </span>
                    <h3 className="text-2xl font-black mb-4 leading-tight">{game.name}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-white/70 text-sm">
                        From{" "}
                        <span className="text-xl font-black text-white">
                          {game.ticket_types?.find((t) => t.category === "adult")?.price ?? "—"}
                        </span>{" "}
                        ETB
                      </p>
                      <Link href="/buy">
                        <button className="bg-[#FFD84D] text-black font-black text-xs px-5 py-2.5 rounded-full hover:bg-white transition-colors">
                          BOOK
                        </button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/8 rounded-3xl overflow-hidden border border-white/8">
            {[
              { num: "25+", label: "Thriller Rides" },
              { num: "10k+", label: "Happy Visitors" },
              { num: "100%", label: "Safe & Secure" },
              { num: "4.9★", label: "User Rating" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-[#0A0A0A] py-12 px-8 text-center"
              >
                <p className="text-4xl md:text-5xl font-black text-[#FFD84D] mb-2" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                  {stat.num}
                </p>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 sm:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto relative overflow-hidden rounded-[2.5rem] bg-[#FFD84D] p-12 md:p-20 text-center"
        >
          {/* Background decoration */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-black/8" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-black/5" />

          <h2
            className="text-5xl md:text-7xl font-black text-black mb-10 relative z-10 leading-tight"
            style={{ fontFamily: "'Arial Black', sans-serif" }}
          >
            Ready to skip<br />the lines?
          </h2>
          <Link href="/buy" className="relative z-10 inline-block">
            <button className="bg-black text-[#FFD84D] font-black text-xl px-14 py-5 rounded-full hover:bg-white hover:text-black transition-all duration-300 shadow-2xl">
              GET TICKETS NOW →
            </button>
          </Link>
        </motion.div>
      </section>

    </div>
  );
}