"use client";

import { use, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { eventService } from "@/services/eventService";
import { bookingService } from "@/services/bookingService";
import { guestCookieUtils } from "@/utils/cookies";
import { Event, BookingItem, MediaDisplayItem } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  MapPin,
  Calendar,
  ArrowLeft,
  Ticket,
  Play,
  Share2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowRight,
  Star,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import SuccessModal from "@/components/ui/SuccessModal";

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkTheme } = useTheme();

  // ── STATE ──
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [booking, setBooking] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "credit_card" | "debit_card" | "telebirr" | "cash"
  >("telebirr");
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxSource, setLightboxSource] = useState<"hero" | "gallery">(
    "hero",
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingReference, setBookingReference] = useState<string>("");
  const [bookingId, setBookingId] = useState<string>("");
  const [showToast, setShowToast] = useState(false);

  // ── MEDIA HANDLING ──

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEventById(id);

      if (response.success && response.data) {
        // Event data is directly in response.data
        const eventData = response.data?.event;
        setEvent(eventData);
      } else {
        setError(response.message || "Event not found");
      }
    } catch (err: any) {
      console.error("Failed to load event:", err);
      setError(err.response?.data?.message || "Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  const updateCart = (ticketTypeId: string, quantity: number) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (quantity <= 0) delete newCart[ticketTypeId];
      else newCart[ticketTypeId] = quantity;
      return newCart;
    });
  };

  const getTotalAmount = () => {
    if (!event?.ticketTypes) return 0;
    return Object.entries(cart).reduce((total, [ticketTypeId, quantity]) => {
      const ticketType = event.ticketTypes?.find((t) => t.id === ticketTypeId);
      return total + (ticketType ? ticketType.price * quantity : 0);
    }, 0);
  };

  const getTotalTickets = () =>
    Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const handleBooking = async () => {
    if (getTotalTickets() === 0) {
      setError("Please select at least one ticket");
      return;
    }
    if (!event) {
      setError("Event not found");
      return;
    }

    setBooking(true);
    setError("");

    try {
      // Prepare booking items from cart
      const bookingItems: BookingItem[] = Object.entries(cart)
        .filter(([_, quantity]) => quantity > 0)
        .map(([ticketTypeId, quantity]) => ({
          ticketTypeId,
          quantity,
        }));

      // Create booking with backend (no guest info required)
      const response = await bookingService.createBooking({
        eventId: event.id,
        items: bookingItems,
        paymentMethod: paymentMethod,
      });

      if (response.success && response.data) {
        setBookingReference(response.data.booking.bookingReference);
        setBookingId(response.data.booking.id);
        setShowSuccessModal(true);
        setCart({}); // Clear cart after successful booking

        // Save guest booking to cookies if user is not authenticated
        if (!user) {
          // Save the entire API response with all fields
          const bookingForCookie = {
            // Map API response to our expected structure
            id: (response.data.booking as any).id,
            bookingReference: (response.data.booking as any).booking_reference,
            totalAmount: (response.data.booking as any).total_amount,
            status: (response.data.booking as any).status,
            type: "EVENT" as const,
            eventDate:
              (response.data.booking as any).created_at ||
              new Date().toISOString(),
            bookedAt:
              (response.data.booking as any).created_at ||
              new Date().toISOString(),
            // Guest-specific fields
            firstName: "Guest",
            lastName: "User",
            email:
              (response.data.booking as any).guest_email || "guest@bora.com",
            paymentStatus: "COMPLETED",
            paymentMethod: "TELEBIRR",
            // Save the complete ticket structure from API
            passes: {
              games: [],
              events: [], // Events API doesn't seem to have passes array in current response
            },
            ticket: {
              status: (response.data.booking as any).ticket?.status || "ACTIVE",
              expiresAt:
                (response.data.booking as any).ticket?.expires_at ||
                new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
              ticket_code: (response.data.booking as any).ticket?.ticket_code,
              qr_token: (response.data.booking as any).ticket?.qr_token,
              // Create passDetails for list display
              passDetails: [
                {
                  productName: "Event Ticket",
                  totalQuantity: 1,
                  usedQuantity: 0,
                },
              ],
            },
            // Save additional API fields
            ticketCode: (response.data.booking as any).ticket?.ticket_code,
            qrToken: (response.data.booking as any).ticket?.qr_token,
          };
          guestCookieUtils.setGuestBooking(bookingForCookie as any);
        }
      } else {
        setError(response.message || "Booking failed");
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      setError(
        err.response?.data?.message || "Booking failed. Please try again.",
      );
    } finally {
      setBooking(false);
    }
  };

  // Media handling functions with useMemo to prevent race conditions
  const mediaItems = useMemo((): MediaDisplayItem[] => {
    if (!event) return [];

    // Filter for banner-labeled images from gallery
    const bannerImages = (event.gallery || [])
      .filter(
        (item) => item.label && (item.label.toLowerCase().includes("banner") || item.label.toLowerCase().includes("poster")),
      )
      .map((item, index) => ({
        type: "image" as const,
        url: item.url,
        thumbnail: item.thumbnailUrl || item.url,
        alt: item.label || `${event.name} banner ${index + 1}`,
      }));

    // If banner images exist, use them
    if (bannerImages.length > 0) {
      return bannerImages;
    }

    // Use fallback banner when no banner-labeled images exist
    return [
      {
        type: "image" as const,
        url: "/banner.jpg",
        thumbnail: "/banner.jpg",
        alt: `${event.name} banner`,
      },
    ];
  }, [event]);

  const currentMedia: MediaDisplayItem | undefined = mediaItems[selectedMediaIndex];

  // Get current lightbox media based on source
  const getLightboxMedia = () => {
    const items = lightboxSource === "hero" ? mediaItems : galleryItems;
    return items[selectedMediaIndex] || null;
  };

  // Gallery items with different fallbacks (img.jpg and vid.mp4)
  const galleryItems = useMemo(() => {
    if (!event) return [];

    // If event has gallery items, separate images first, then videos
    if (event.gallery && event.gallery.length > 0) {
      const images = event.gallery
        .filter((item) => item.type?.startsWith("image") || !item.type) // assume image if no type
        .map((item, index) => ({
          type: "image" as const,
          url: item.url,
          thumbnail: item.thumbnailUrl || item.url,
          alt: item.label || `${event.name} gallery image ${index + 1}`,
        }));

      const videos = event.gallery
        .filter((item) => item.type?.startsWith("video"))
        .map((item, index) => ({
          type: "video" as const,
          url: item.url,
          thumbnail: item.thumbnailUrl || item.url,
          alt: item.label || `${event.name} gallery video ${index + 1}`,
        }));

      // Return images first, then videos
      return [...images, ...videos];
    }

    // Use fallback gallery media when no gallery exists
    return [
      {
        type: "image" as const,
        url: "/banner.jpg",
        thumbnail: "/banner.jpg",
        alt: `${event.name} gallery image`,
      },
      {
        type: "video" as const,
        url: "/vid.mp4",
        thumbnail: "/banner.jpg",
        alt: `${event.name} gallery video`,
      },
    ];
  }, [event]);

  // Auto-cycle media every 4 seconds (only for multiple banner images, not placeholder)
  useEffect(() => {
    // Don't cycle if only one item or if using placeholder banner
    if (mediaItems.length <= 1 || mediaItems[0]?.url === "/banner.jpg") return;

    const interval = setInterval(() => {
      setSelectedMediaIndex((prev) => (prev + 1) % mediaItems.length);
    }, 4000); // 4 seconds

    return () => clearInterval(interval);
  }, [mediaItems.length, mediaItems]);

  const navigateMedia = (direction: "prev" | "next") => {
    setSelectedMediaIndex((prev) => {
      if (direction === "prev") {
        return prev === 0 ? mediaItems.length - 1 : prev - 1;
      } else {
        return prev === mediaItems.length - 1 ? 0 : prev + 1;
      }
    });
  };

  if (loading)
    return (
      <div
        className={`min-h-screen ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-gray-50"} flex items-center justify-center`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#ffd84f] border-t-transparent rounded-full animate-spin" />
          <span
            className={`font-black tracking-[0.5em] uppercase italic ${isDarkTheme ? "text-white" : "text-gray-800"}`}
          >
            Loading Event...
          </span>
        </div>
      </div>
    );

  if (!event)
    return (
      <div
        className={`min-h-screen ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-gray-50"} flex items-center justify-center`}
      >
        <div className="text-center">
          <h2
            className={`text-3xl font-black mb-4 ${isDarkTheme ? "text-white" : "text-gray-800"}`}
          >
            Event Not Found
          </h2>
          <p
            className={`mb-8 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}
          >
            The event you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.push("/events")}
            className={`px-8 py-4 backdrop-blur-sm border rounded-2xl font-black text-xs uppercase tracking-widest hover:transition-all flex items-center gap-2 mx-auto shadow-sm ${
              isDarkTheme
                ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                : "bg-white/80 border-gray-200 text-gray-800 hover:bg-white"
            }`}
          >
            <ArrowLeft size={16} /> Back to Events
          </button>
        </div>
      </div>
    );

  const isSoldOut = event.capacity - event.ticketsSold <= 0;

  return (
    <div
      className={`min-h-screen ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-gray-50"}`}
    >
      {/* Hero Section with Video/Image Background */}
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          {mediaItems.length > 0 ? (
            <>
              {currentMedia?.type === "video" ? (
                <video
                  className="w-full h-full object-cover"
                  autoPlay
                  crossOrigin="anonymous"
                  muted
                  loop
                  playsInline
                  poster={currentMedia.thumbnail}
                >
                  <source src={currentMedia.url} type="video/mp4" />
                </video>
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={currentMedia?.url || ""}
                    alt={currentMedia?.alt || event.name}
                    fill
                    crossOrigin="anonymous"
                    className="object-cover"
                    sizes="100vw"
                    priority
                  />
                </div>
              )}
            </>
          ) : (
            <div
              className={`w-full h-full ${isDarkTheme ? "bg-linear-to-br from-[#1a1a1a] to-[#2a2a2a]" : "bg-linear-to-br from-gray-200 to-gray-300"}`}
            />
          )}
          <div
            className={`absolute inset-0 bg-linear-to-b ${
              isDarkTheme
                ? "from-[#0A0A0A]/20 via-[#0A0A0A]/10 to-[#0A0A0A]"
                : "from-gray-40/20 via-gray-50/10 to-gray-50"
            }`}
          />
        </div>

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 150 }}
          onClick={() => router.push("/events")}
          className={`absolute top-8 left-8 z-20 flex items-center gap-2 px-6 py-3 backdrop-blur-md border border-accent rounded-2xl font-black text-[10px] uppercase tracking-widest hover:transition-all shadow-sm ${
            isDarkTheme
              ? "bg-white/10 text-white hover:bg-white/20"
              : "bg-white/70 text-gray-800 hover:bg-white/90"
          }`}
        >
          <ArrowLeft size={16} /> Back to Events
        </motion.button>

        {/* Share Button */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
          className="absolute top-8 right-8 z-20"
        >
          <button
            onClick={() => {
              const url = window.location.href;
              const title = event.name;

              if (navigator.share) {
                navigator
                  .share({
                    title: title,
                    text: `Check out this event at Bora Park: ${title}`,
                    url: url,
                  })
                  .catch(() => {
                    // Fallback to copying URL
                    navigator.clipboard.writeText(url);
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                  });
              } else {
                // Fallback for desktop browsers
                navigator.clipboard.writeText(url);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
              }
            }}
            className={`w-12 h-12 backdrop-blur-md border rounded-2xl flex items-center justify-center transition-all shadow-sm ${
              isDarkTheme
                ? "bg-black/70 border border-accent text-white hover:bg-black/90"
                : "bg-white/70 border-white/50 text-gray-700 hover:bg-white/90"
            }`}
          >
            <Share2 size={18} />
          </button>
        </motion.div>

        {/* Event Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-8 md:p-16">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.1,
              duration: 1.2,
              type: "spring",
              stiffness: 80,
            }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#ffd84f] text-gray-900 px-4 py-2 rounded-full shadow-md font-black text-[10px] uppercase tracking-widest">
                {event.ticketsSold >= event.capacity ? "SOLD OUT" : "ON SALE"}
              </div>
              <div className="flex items-center gap-1 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < 4 ? "currentColor" : "none"}
                  />
                ))}
                <span
                  className={`text-sm ml-2 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}
                >
                  4.8 (120 reviews)
                </span>
              </div>
            </div>

            <motion.h1
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: 0.3,
                duration: 1,
                type: "spring",
                stiffness: 100,
              }}
              className={`text-6xl md:text-8xl font-black ${isDarkTheme ? "text-white" : "text-gray-800"} tracking-tighter uppercase italic leading-none mb-6`}
            >
              {event.name}
            </motion.h1>

            <motion.p
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: 0.5,
                duration: 0.8,
                type: "spring",
                stiffness: 120,
              }}
              className={`text-xl ${isDarkTheme ? "text-gray-300" : "text-gray-600"} font-medium leading-relaxed mb-8 max-w-3xl`}
            >
              {event.description}
            </motion.p>

            <div
              className={`flex flex-wrap gap-6 ${isDarkTheme ? "text-gray-400" : "text-gray-500"} text-sm`}
            >
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-[#ffd84f]" />
                <span>{format(new Date(event.eventDate), "MMM dd, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[#ffd84f]" />
                <span>{event.startTime}</span>
              </div>

              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#ffd84f]" />
                <span>Capacity: {event.capacity}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Media Navigation */}
        {mediaItems.length > 1 && (
          <div className="absolute bottom-8 right-8 z-20 flex items-center gap-3">
            <button
              onClick={() => navigateMedia("prev")}
              className="w-12 h-12 bg-white/70 backdrop-blur-md border border-white/50 text-gray-700 rounded-2xl flex items-center justify-center hover:bg-white/90 transition-all shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => navigateMedia("next")}
              className="w-12 h-12 bg-white/70 backdrop-blur-md border border-white/50 text-gray-700 rounded-2xl flex items-center justify-center hover:bg-white/90 transition-all shadow-sm"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
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
            <h2
              className={`text-4xl md:text-6xl font-black ${isDarkTheme ? "text-white" : "text-gray-800"} tracking-tighter uppercase italic mb-4`}
            >
              Explore <span className="text-[#ffd84f]">Gallery</span>
            </h2>
            <p
              className={`text-lg ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}
            >
              Get a closer look at the experience
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryItems.length > 0 ? (
              galleryItems.map((item, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => {
                    setSelectedMediaIndex(index);
                    setLightboxSource("gallery");
                    setIsLightboxOpen(true);
                  }}
                  className={`relative aspect-video rounded-2xl overflow-hidden border-2 transition-all shadow-md ${
                    selectedMediaIndex === index
                      ? "border-[#ffd84f] shadow-lg shadow-[#ffd84f]/30"
                      : "border-transparent hover:border-[#ffd84f]/50"
                  }`}
                >
                  <img
                    src={item.thumbnail}
                    crossOrigin="anonymous"
                    alt={item.alt}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                  {item.type === "video" && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" fill="white" />
                    </div>
                  )}
                </motion.button>
              ))
            ) : (
              <div
                className={`col-span-full text-center py-12 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}
              >
                <p>No media available for this event</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Event Details */}
      <section
        className={`py-20 px-6 md:px-12 ${isDarkTheme ? "" : "bg-gray-100/80"}`}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, x: -80 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
            >
              <motion.h3
                initial={{ opacity: 0, x: -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className={`text-3xl font-black tracking-tighter uppercase italic mb-6 ${isDarkTheme ? "text-white" : "text-gray-800"}`}
              >
                About This <span className="text-[#ffd84f]">Event</span>
              </motion.h3>
              <div
                className={`prose max-w-none ${isDarkTheme ? "prose-invert" : "prose-gray"}`}
              >
                <p
                  className={`text-lg leading-relaxed ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}
                >
                  {event.description ||
                    "Experience a world-class production at Bora Park. Featuring state-of-the-art visuals and performances that redefine entertainment."}
                </p>
              </div>
            </motion.div>

            {/* Event Info Cards */}
            <motion.div
              initial={{ opacity: 0, x: -80 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
            >
              <h3
                className={`text-3xl font-black tracking-tighter uppercase italic mb-6 ${isDarkTheme ? "text-white" : "text-gray-800"}`}
              >
                Event <span className="text-[#ffd84f]">Details</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className={`backdrop-blur-sm border rounded-2xl p-6 shadow-sm ${
                    isDarkTheme
                      ? "bg-[#1a1a1a]/70 border-gray-700"
                      : "bg-white/70 border-gray-200"
                  }`}
                >
                  <h4 className="text-[#ffd84f] font-black text-sm uppercase tracking-widest mb-2">
                    Date
                  </h4>
                  <p
                    className={`text-2xl font-black ${isDarkTheme ? "text-white" : "text-gray-800"}`}
                  >
                    {format(new Date(event.eventDate), "MMM dd, yyyy")}
                  </p>
                </div>
                <div
                  className={`backdrop-blur-sm border rounded-2xl p-6 shadow-sm ${
                    isDarkTheme
                      ? "bg-[#1a1a1a]/70 border-gray-700"
                      : "bg-white/70 border-gray-200"
                  }`}
                >
                  <h4 className="text-[#ffd84f] font-black text-sm uppercase tracking-widest mb-2">
                    Time
                  </h4>
                  <p
                    className={`text-2xl font-black ${isDarkTheme ? "text-white" : "text-gray-800"}`}
                  >
                    {event.startTime}
                  </p>
                </div>

                <div
                  className={`backdrop-blur-sm border rounded-2xl p-6 shadow-sm ${
                    isDarkTheme
                      ? "bg-[#1a1a1a]/70 border-gray-700"
                      : "bg-white/70 border-gray-200"
                  }`}
                >
                  <h4 className="text-[#ffd84f] font-black text-sm uppercase tracking-widest mb-2">
                    Capacity
                  </h4>
                  <p
                    className={`text-2xl font-black ${isDarkTheme ? "text-white" : "text-gray-800"}`}
                  >
                    {event.capacity} people
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 80 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
              className="sticky top-8"
            >
              <div
                className={`backdrop-blur-md border rounded-[48px] p-8 shadow-xl ${
                  isDarkTheme
                    ? "bg-[#1a1a1a]/70 border-gray-700"
                    : "bg-white/70 border-white/50"
                }`}
              >
                <div className="text-center mb-8">
                  <Ticket className={`w-12 h-12 mx-auto mb-4 text-accent`} />
                  <motion.h3
                    initial={{ opacity: 0, x: 60 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className={`text-2xl font-black tracking-tighter uppercase italic mb-2 ${isDarkTheme ? "text-white" : "text-gray-800"}`}
                  >
                    Secure Your <span className="text-[#ffd84f]">Spot</span>
                  </motion.h3>
                  <p
                    className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Select passes and check out
                  </p>
                </div>

                {/* Ticket Selection - Unified */}
                <div className="mb-8">
                  <h4
                    className={`text-xs font-black uppercase tracking-widest mb-4 ${isDarkTheme ? "text-gray-400" : "text-gray-400"}`}
                  >
                    Select Tickets
                  </h4>
                  <div className="space-y-4">
                    {event.ticketTypes?.map((type, index) => (
                      <div key={type.id}>
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <p
                              className={`font-black ${isDarkTheme ? "text-white" : "text-gray-800"}`}
                            >
                              {type.category}
                            </p>
                            <p
                              className={`text-xs ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}
                            >
                              {/*type.description */ " "}
                            </p>
                          </div>
                          <p
                            className={`font-black text-xl ${isDarkTheme ? "text-white" : "text-gray-800"}`}
                          >
                            {type.price} ETB
                          </p>
                        </div>
                        <div
                          className={`flex items-center justify-between p-2 rounded-xl ${isDarkTheme ? "bg-[#1a1a1a]" : "bg-gray-50"}`}
                        >
                          <span
                            className={`text-xs font-black uppercase ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}
                          >
                            Quantity
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                updateCart(type.id, (cart[type.id] || 0) - 1)
                              }
                              disabled={isSoldOut}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors shadow-sm ${
                                isDarkTheme
                                  ? "bg-gray-600 text-gray-400 hover:bg-red-900/50 hover:text-red-400 active:bg-gray-500"
                                  : "bg-white text-gray-500 hover:bg-red-50 hover:text-red-500 active:bg-gray-100"
                              } disabled:opacity-30`}
                            >
                              <Minus size={14} />
                            </button>
                            <span
                              className={`font-black w-4 text-center ${isDarkTheme ? "text-white" : "text-gray-800"}`}
                            >
                              {cart[type.id] || 0}
                            </span>
                            <button
                              onClick={() =>
                                updateCart(type.id, (cart[type.id] || 0) + 1)
                              }
                              disabled={isSoldOut}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors shadow-sm ${
                                isDarkTheme
                                  ? "bg-gray-600 text-white hover:bg-[#ffd84f] hover:text-gray-900 active:bg-gray-500"
                                  : "bg-white text-gray-800 hover:bg-[#ffd84f] hover:text-gray-900 active:bg-gray-100"
                              } disabled:opacity-30`}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        {index < (event.ticketTypes?.length || 0) - 1 && (
                          <div
                            className={`mt-4 border-t ${isDarkTheme ? "border-gray-700/50" : "border-gray-200/50"}`}
                          ></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary - Integrated into main card */}
                {getTotalTickets() > 0 && (
                  <div className="mb-8">
                    <h4
                      className={`text-xs font-black uppercase tracking-widest mb-4 ${isDarkTheme ? "text-gray-400" : "text-gray-400"}`}
                    >
                      Order Summary
                    </h4>
                    {Object.entries(cart).map(([tid, qty]) => {
                      const t = event.ticketTypes?.find((x) => x.id === tid);
                      return (
                        <div
                          key={tid}
                          className={`flex justify-between items-center mb-3 pb-3 border-b ${isDarkTheme ? "border-gray-700/50" : "border-gray-200/50"}`}
                        >
                          <div>
                            <p
                              className={`text-sm font-black ${isDarkTheme ? "text-white" : "text-gray-800"}`}
                            >
                              {t?.category}
                            </p>
                            <p
                              className={`text-[10px] ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}
                            >
                              x{qty}
                            </p>
                          </div>
                          <p
                            className={`font-black ${isDarkTheme ? "text-white" : "text-gray-800"}`}
                          >
                            {t ? t.price * qty : 0} ETB
                          </p>
                        </div>
                      );
                    })}
                    <div className="flex justify-between items-center pt-2">
                      <span
                        className={`text-sm font-black ${isDarkTheme ? "text-white" : "text-gray-800"}`}
                      >
                        Total
                      </span>
                      <span className="text-2xl font-black text-[#ffd84f]">
                        {getTotalAmount()} ETB
                      </span>
                    </div>
                  </div>
                )}

                {/* Payment & Booking */}
                <div className="space-y-4">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className={`w-full px-4 py-3 border rounded-xl text-sm font-black uppercase tracking-widest outline-none focus:border-[#ffd84f] ${
                      isDarkTheme
                        ? "bg-[#1a1a1a] border-gray-700 text-white"
                        : "bg-white border-gray-200 text-gray-800"
                    }`}
                  >
                    <option value="telebirr">Telebirr</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="cash">Pay at Gate</option>
                  </select>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-black uppercase">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleBooking}
                    disabled={getTotalTickets() === 0 || booking || isSoldOut}
                    className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
                      isSoldOut
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-[#ffd84f] text-gray-900 hover:bg-[#f0c63f]"
                    } disabled:opacity-30`}
                  >
                    {booking
                      ? "Processing..."
                      : isSoldOut
                        ? "Sold Out"
                        : "Buy Tickets"}{" "}
                    <ArrowRight size={18} />
                  </button>

                  <p className="text-gray-400 text-xs text-center">
                    Instant confirmation • Secure checkout
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen &&
          (() => {
            const items = lightboxSource === "hero" ? mediaItems : galleryItems;
            return items.length > 0;
          })() && (
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
                className={`absolute top-8 right-8 w-12 h-12 backdrop-blur-md border border-accent rounded-2xl flex items-center justify-center transition-all z-10 shadow-sm ${
                  isDarkTheme
                    ? "bg-black/70 text-white hover:bg-black/90"
                    : "bg-white/70 text-gray-800 hover:bg-white/90"
                }`}
              >
                <X size={24} />
              </motion.button>

              <div className="relative max-w-6xl max-h-[90vh] w-full">
                {(() => {
                  const items =
                    lightboxSource === "hero" ? mediaItems : galleryItems;
                  const currentLightboxMedia = items[selectedMediaIndex];
                  return currentLightboxMedia?.type === "video" ? (
                    <video
                      className="w-full h-full rounded-3xl"
                      crossOrigin="anonymous"
                      controls
                      autoPlay
                      muted
                      playsInline
                    >
                      <source
                        src={currentLightboxMedia?.url}
                        type="video/mp4"
                      />
                    </video>
                  ) : (
                    <img
                      src={currentLightboxMedia?.url}
                      alt={currentLightboxMedia?.alt}
                      className="w-full h-full object-contain rounded-3xl"
                    />
                  );
                })()}
              </div>

              {(() => {
                const items =
                  lightboxSource === "hero" ? mediaItems : galleryItems;
                return items.length > 1;
              })() && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateMedia("prev");
                    }}
                    className={`absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 backdrop-blur-md border border-accent rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                      isDarkTheme
                        ? "bg-black/70 text-white hover:bg-black/90"
                        : "bg-white/70 text-gray-800 hover:bg-white/90"
                    }`}
                  >
                    <ChevronLeft size={24} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateMedia("next");
                    }}
                    className={`absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 backdrop-blur-md border border-accent rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                      isDarkTheme
                        ? "bg-black/70 text-white hover:bg-black/90"
                        : "bg-white/70 text-gray-800 hover:bg-white/90"
                    }`}
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </motion.div>
          )}
      </AnimatePresence>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Event Tickets Booked!"
        message="Your event tickets have been confirmed. Get ready for an amazing experience at Bora Park!"
        bookingReference={bookingReference}
        bookingId={bookingId}
        showActions={true}
        user={user}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl shadow-2xl border ${
              isDarkTheme
                ? "bg-[#1a1a1a] border-[#ffd84f] text-white"
                : "bg-white border-[#ffd84f] text-gray-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#ffd84f] rounded-full flex items-center justify-center">
                <Share2 size={16} className="text-black" />
              </div>
              <div>
                <p className="font-bold text-sm">Link Copied!</p>
                <p
                  className={`text-xs ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}
                >
                  Event link copied to clipboard
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
