"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/services/bookingService";
import { Bookings, GameBookingItemDetail } from "@/types"; // Uses the new Discriminated Union
import { Button } from "@/components/ui/Button";
import {
  Calendar,
  CreditCard,
  Eye,
  Gamepad2,
  Ticket,
  ListChecks,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function MyBookingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Bookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "EVENT" | "GAME">("ALL");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) loadBookings();
  }, [user, authLoading]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getMyBookings(1, 50);
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error("Failed to load bookings", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = bookings.filter((item) => {
    if (activeTab === "ALL") return true;
    return item.type === activeTab;
  });

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              My <span className="text-indigo-600">Tickets</span>
            </h1>
            <p className="text-slate-500 mt-2">
              Your gateway to Bora Park adventures.
            </p>
          </div>

          <div className="flex p-1 bg-slate-200/50 rounded-2xl w-fit">
            {(["ALL", "EVENT", "GAME"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
                  activeTab === tab
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab === "ALL" ? "ALL" : tab + "S"}
              </button>
            ))}
          </div>
        </div>

        {/* LIST */}
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[24px] border border-slate-100 overflow-hidden flex flex-col md:flex-row"
              >
                {/* Visual Indicator */}
                <div
                  className={`w-full md:w-32 flex flex-col items-center justify-center p-6 ${
                    item.type === "EVENT"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-purple-50 text-purple-600"
                  }`}
                >
                  {item.type === "EVENT" ? (
                    <Calendar size={32} />
                  ) : (
                    <Gamepad2 size={32} />
                  )}
                  <span className="text-[10px] font-black uppercase mt-2 opacity-60 tracking-widest">
                    {item.type}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h3 className="text-xl font-black text-slate-800">
                      {item.type === "EVENT"
                        ? item.event_name
                        : "Park Attractions"}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        item.booking_status === "confirmed"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      {item.booking_status}
                    </span>
                  </div>

                  {/* Dynamic Middle Section */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        Date
                      </span>
                      <span className="text-sm font-bold text-slate-700">
                        {item.type === "EVENT"
                          ? item.event_name
                          : "Anytime Access"}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        Reference
                      </span>
                      <span className="text-sm font-mono font-bold text-slate-700">
                        #{item.booking_reference.slice(0, 8)}
                      </span>
                    </div>

                    <div className="flex flex-col col-span-2 md:col-span-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        Activity Summary
                      </span>
                      <span className="text-sm font-medium text-slate-600 line-clamp-1">
                        {item.type === "GAME"
                          ? item.items
                              .map(
                                (i: GameBookingItemDetail) =>
                                  `${i.quantity}x ${i.game_name}`,
                              )
                              .join(", ")
                          : "Full Access Pass"}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        Total
                      </span>
                      <span className="text-sm font-black text-indigo-600">
                        {(parseFloat(item.total_amount) || 0).toFixed(2)} ETB
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="p-6 bg-slate-50/50 md:bg-transparent border-t md:border-t-0 md:border-l border-slate-100 flex items-center justify-center">
                  <Button
                    onClick={() => router.push(`/bookings/${item.id}`)}
                    className="w-full md:w-auto rounded-xl bg-slate-900 text-white font-bold px-8"
                  >
                    View Details
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
