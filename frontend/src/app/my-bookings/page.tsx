"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/services/bookingService";
import { Booking } from "@/types";
import { Button } from "@/components/ui/Button";
import {
  Calendar,
  Clock,
  CreditCard,
  Eye,
  XCircle,
  Gamepad2,
  Ticket,
  ChevronRight,
  MapPin,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function MyBookingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "EVENTS" | "GAMES">("ALL");

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = bookings.filter((item) => {
    if (activeTab === "EVENTS") return !!item.event_id;
    if (activeTab === "GAMES") return !item.event_id;
    return true;
  });

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">
            Fetching your adventures...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              My <span className="text-indigo-600">Tickets</span>
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Manage your upcoming visits and past memories.
            </p>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex p-1 bg-slate-200/50 rounded-2xl w-fit">
            {["ALL", "EVENTS", "GAMES"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === tab
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT GRID */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-[32px] p-20 text-center border-2 border-dashed border-slate-200">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ticket className="text-slate-400 w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">
              No tickets found
            </h3>
            <p className="text-slate-500 mt-2 mb-8">
              Ready for some fun? Your next adventure is just a click away.
            </p>
            <Button
              onClick={() => router.push("/buy")}
              className="rounded-2xl px-8 py-6"
            >
              Explore Attractions
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={item.id}
                  className="group bg-white rounded-[24px] border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all p-2 flex flex-col md:flex-row items-stretch"
                >
                  {/* Left Icon Section */}
                  <div
                    className={`w-full md:w-32 rounded-[20px] flex flex-col items-center justify-center p-6 ${
                      item.event_id
                        ? "bg-blue-50 text-blue-600"
                        : "bg-indigo-50 text-indigo-600"
                    }`}
                  >
                    {item.event_id ? (
                      <Calendar size={32} />
                    ) : (
                      <Gamepad2 size={32} />
                    )}
                    <span className="text-[10px] font-black uppercase mt-2 tracking-tighter opacity-60">
                      {item.event_id ? "Event" : "Game"}
                    </span>
                  </div>

                  {/* Main Details */}
                  <div className="flex-1 p-6 flex flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">
                        {item.event_id
                          ? (item as any).event_name
                          : (item as any).activity_name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          (item as any).booking_status === "confirmed" ||
                          (item as any).status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        {(item as any).booking_status || (item as any).status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          Date
                        </span>
                        <span className="text-sm font-bold text-slate-700">
                          {item.event_date
                            ? format(new Date(item.event_date), "MMM dd, yyyy")
                            : "Open Access"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          Reference
                        </span>
                        <span className="text-sm font-mono font-bold text-slate-700">
                          {(item as any).booking_reference?.substring(0, 8) ||
                            "G-" + item.id.substring(0, 6)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          Cost
                        </span>
                        <span className="text-sm font-black text-indigo-600">
                          {parseFloat(
                            item.total_amount ||
                              (item as any).total_price ||
                              "0",
                          ).toFixed(2)}{" "}
                          <span className="text-[10px]">ETB</span>
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          Status
                        </span>
                        <span className="text-sm font-bold text-slate-700">
                          {(item as any).payment_status || "Paid"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 md:p-6 border-t md:border-t-0 md:border-l border-slate-50 flex items-center">
                    <Button
                      onClick={() =>
                        item.event_id
                          ? router.push(`/bookings/${item.id}`)
                          : router.push(`/tickets/${item.id}`)
                      }
                      className="w-full md:w-auto rounded-xl bg-slate-900 text-white hover:bg-indigo-600 transition-colors px-6 py-4 flex items-center gap-2"
                    >
                      <Eye size={18} />
                      <span className="font-bold text-sm">View Ticket</span>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
