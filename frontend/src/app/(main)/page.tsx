"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform ,Variants} from "framer-motion";
import {
  Ticket,
  ChevronRight,
  Play,
  ArrowDownRight,
} from "lucide-react";
import { MOCK_IMG } from "@/data/image";
import { gameService } from "@/services/adminService";
import { eventService } from "@/services/eventService";
import { Event, Game } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.2 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 60, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      type: "spring",
      bounce: 0.4,
    },
  },
};

const ACCENT = "#FFD84D";

export default function Home() {
  const { isDarkTheme } = useTheme();
  const [featuredGames, setFeaturedGames] = useState<Game[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 200]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const badgeRotate = useTransform(scrollY, [0, 400], [12, -5]);

  useEffect(() => {
    Promise.all([
      gameService.getActiveGames(),
      eventService.getActiveEvents(1, 6),
    ])
      .then(([gamesRes, eventsRes]) => {
        setFeaturedGames(gamesRes.data?.games.slice(0, 3) || []);
        setEvents(eventsRes.data.events || []);
      })
      .catch(console.log);
  }, []);

  return (
    <div
      className={`min-h-screen ${isDarkTheme ? "bg-[#0A0A0A] text-white" : "bg-white text-gray-900"} overflow-x-hidden`}
    >
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative h-screen flex items-end pb-20 overflow-hidden">
        {/* Background image with parallax */}
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <img
            src="/bora.jpg"
            className="w-full h-full object-cover"
            alt="Bora Park"
          />
          <div
            className={`absolute inset-0 bg-linear-to-t ${isDarkTheme ? "from-[#0A0A0A] via-[#0A0A0A]/20" : "from-white via-white/15"} to-transparent`}
          />
          <div
            className={`absolute inset-0 bg-linear-to-r ${isDarkTheme ? "from-[#0A0A0A]/30" : "from-white/30"} to-transparent`}
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/50 via-black/30 to-transparent" />
          <div
            className={`absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t ${isDarkTheme ? "from-[#0A0A0A]" : "from-white"} to-transparent`}
          />
        </motion.div>

        {/* Floating badge */}
        <motion.div
          style={{ opacity: heroOpacity, rotate: badgeRotate }}
          className="absolute top-48 right-8 md:right-46 bg-[#FFD84D] text-black px-5 py-3 rounded-full font-black text-s uppercase tracking-widest shadow-xl"
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
            <motion.p
              variants={fadeUp}
              className="text-[#FFD84D] font-black text-sm uppercase tracking-[0.3em] mb-6"
            >
              Ethiopia's Premier Amusement Park
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="text-[clamp(4rem,12vw,10rem)] font-black leading-[0.88] tracking-tight mb-10"
              style={{ fontFamily: "'Arial Black', sans-serif" }}
            >
              UNLEASH
              <br />
              <span style={{ color: ACCENT }}>THE</span>
              <br />
              THRILL
            </motion.h1>

            <motion.div
              variants={fadeUp}
              className="flex flex-wrap gap-4 items-center"
            >
              <Link href="/buy">
                <motion.button
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex items-center gap-3 bg-[#FFD84D] text-black font-black text-base px-8 py-4 rounded-full hover:bg-white transition-all duration-300 shadow-2xl shadow-yellow-400/20"
                >
                  <Ticket className="h-5 w-5" />
                  Buy Tickets
                  <ArrowDownRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
                </motion.button>
              </Link>
              <Link href="/games">
                <motion.button
                  whileHover={{ scale: 1.05, rotate: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-3 border-2 font-bold text-base px-8 py-4 rounded-full transition-all duration-300 ${
                    isDarkTheme
                      ? "border-white/20 text-white hover:border-white/60 hover:bg-white/5"
                      : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  <Play className="h-4 w-4 fill-current" />
                  Explore Rides
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <div className="w-px h-16 bg-linear-to-b from-gray-300/0 via-gray-400/40 to-gray-300/0 animate-pulse" />
          <span
            className={`text-[10px] font-bold uppercase tracking-widest ${isDarkTheme ? "text-gray-400" : "text-gray-400"}`}
          >
            Scroll
          </span>
        </motion.div>
      </section>

      {/* ── EVENTS ───────────────────────────────────────────────────────── */}
      <section className="py-25 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div
              variants={fadeUp}
              className="flex justify-between items-end mb-16"
            >
              <div>
                <p className="text-[#FFD84D] font-black text-xs uppercase tracking-[0.3em] mb-3">
                  Exclusive
                </p>
                <h2
                  className="text-5xl md:text-6xl font-black leading-tight"
                  style={{ fontFamily: "'Arial Black', sans-serif" }}
                >
                  Upcoming
                  <br />
                  <p className=" text-accent">Events</p>
                </h2>
              </div>
              <Link
                href="/events"
                className={`hidden md:flex items-center gap-2 font-bold text-sm transition-colors ${
                  isDarkTheme
                    ? "text-white/50 hover:text-[#FFD84D]"
                    : "text-gray-500 hover:text-[#FFD84D]"
                }`}
              >
                Full Calendar <ChevronRight size={16} />
              </Link>
            </motion.div>

            <div className="flex gap-6 overflow-x-auto border-accent2 scrollbar-hide px-2 py-4">
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  variants={fadeUp}
                  whileHover={{ scale: 1.02, y: -8 }}
                  transition={{ duration: 0.4 }}
                  className="group relative rounded-3xl overflow-hidden aspect-3/4 cursor-pointer w-[calc(100vw-100px)] max-w-96 sm:w-[385Px] lg:w-96   mx-auto sm:mx-0 shrink-0 hover:border hover:border-accent2"
                >
                  {event.gallery && event.gallery.length > 0 ? (
                    <>
                      {event.gallery[0].type.startsWith("image") ? (
                        <img
                          src={event.gallery[0].url}
                          alt={event.name}
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : event.gallery[0].type.startsWith("video") ? (
                        <video
                          src={event.gallery[0].url}
                          crossOrigin="anonymous"
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : null}
                    </>
                  ) : (
                    <img
                      src={MOCK_IMG}
                      alt="Placeholder"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 blur-md group-hover:blur-none animate-pulse"
                    />
                  )}
                  <div
                    className={`absolute inset-0 bg-linear-to-t ${isDarkTheme ? "from-black" : "from-gray-800"} via-transparent to-transparent`}
                  />

                  {/* Corner accent */}
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#FFD84D] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                    <ArrowDownRight className="w-5 h-5 text-black -rotate-45" />
                  </div>

                  {/* Sold out overlay */}
                  {!event.isActive && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                      <span className="px-6 py-2 bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-full -rotate-3">
                        Sold Out
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-7">
                    <span className="text-[#FFD84D] font-black text-[10px] uppercase tracking-[0.3em] block mb-2">
                      Special Event
                    </span>
                    <h3 className="text-2xl font-black mb-4 leading-tight">
                      {event.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}
                      >
                        From{" "}
                        <span className="text-xl font-black text-white">
                          {event.ticketTypes?.find(
                            (t) => t.category === "ADULT",
                          )?.price ?? 0}
                        </span>{" "}
                        ETB
                      </p>
                      <Link href={`/buy?event=${event.id}`}>
                        <button
                          disabled={!event.isActive}
                          className={`bg-[#FFD84D] text-black font-black text-xs px-5 py-2.5 rounded-full hover:bg-white transition-colors ${
                            !event.isActive
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
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

      {/* ── ATTRACTIONS ──────────────────────────────────────────────────── */}
      <section
        className={`pb-18 px-2 sm:px-10 lg:px-16 bg-linear-to-b from-transparent ${
          isDarkTheme ? "to-white/3" : "to-gray-50"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            {/* Header */}
            <motion.div
              variants={fadeUp}
              className="flex justify-between items-end mb-16"
            >
              <div>
                <p className="text-[#FFD84D] pl-4 font-black text-xs uppercase tracking-[0.3em] mb-3">
                  Top Picks
                </p>
                <h2
                  className="text-5xl pl-4 md:text-6xl font-black leading-tight"
                  style={{ fontFamily: "'Arial Black', sans-serif" }}
                >
                  Must-Try
                  <br />
                  <p className=" text-accent">Games</p>
                </h2>
              </div>
              <Link
                href="/games"
                className={`hidden md:flex items-center gap-2 font-bold text-sm transition-colors ${
                  isDarkTheme
                    ? "text-white/50 hover:text-[#FFD84D]"
                    : "text-gray-500 hover:text-[#FFD84D]"
                }`}
              >
                View All <ChevronRight size={16} />
              </Link>
            </motion.div>

            {/* Horizontal scroll container */}
            <div className="flex gap-6 overflow-x-auto scrollbar-hide px-2 py-4">
              {featuredGames.map((game) => (
                <motion.div
                  key={game.id}
                  variants={fadeUp}
                  whileHover={{ scale: 1.02, y: -8 }}
                  transition={{ duration: 0.4 }}
                  className="group relative rounded-3xl overflow-hidden aspect-3/4 cursor-pointer 
                             w-[calc(100vw-70px)] max-w-96  lg:w-96 
                             mx-auto sm:mx-0 shrink-0 hover:border hover:border-accent2"
                >
                  {/* Background Image */}
                  {game.gallery && game.gallery.length > 0 ? (
                    <>
                      {game.gallery[0].type.startsWith("image") ? (
                        <img
                          src={game.gallery[0].url}
                          alt={game.name}
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : game.gallery[0].type.startsWith("video") ? (
                        <video
                          src={game.gallery[0].url}
                          crossOrigin="anonymous"
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : null}
                    </>
                  ) : (
                    <img
                      src={MOCK_IMG}
                      alt="Placeholder"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 blur-md animate-pulse"
                    />
                  )}
                  <div
                    className={`absolute inset-0 bg-linear-to-t ${
                      isDarkTheme ? "from-black" : "from-gray-800"
                    } via-transparent to-transparent`}
                  />

                  {/* Corner accent */}
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#FFD84D] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                    <ArrowDownRight className="w-5 h-5 text-black -rotate-45" />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-7">
                    <span className="text-[#FFD84D] font-black text-[10px] uppercase tracking-[0.3em] block mb-2">
                      Thrill Ride
                    </span>
                    <h3 className="text-2xl font-black mb-4 leading-tight">
                      {game.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}
                      >
                        From{" "}
                        <span className="text-xl font-black text-white">
                          {game.ticketTypes?.find((t) => t.category === "ADULT")
                            ?.price ?? "—"}
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
          <div
            className={`grid grid-cols-2 md:grid-cols-4 gap-px rounded-3xl overflow-hidden border ${
              isDarkTheme
                ? "bg-white/8 border-white/8"
                : "bg-gray-200 border-gray-200"
            }`}
          >
            {[
              { num: "15+", label: "Thriller Rides" },
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
                className={`py-12 px-8 text-center ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-white"}`}
              >
                <p
                  className="text-4xl md:text-5xl font-black text-[#FFD84D] mb-2"
                  style={{ fontFamily: "'Arial Black', sans-serif" }}
                >
                  {stat.num}
                </p>
                <p
                  className={`text-xs font-bold uppercase tracking-widest ${isDarkTheme ? "text-white/40" : "text-gray-500"}`}
                >
                  {stat.label}
                </p>
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
            Ready to skip
            <br />
            the lines?
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
