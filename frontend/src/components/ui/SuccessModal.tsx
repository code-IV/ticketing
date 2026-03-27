"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X, Download, Share2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  bookingReference?: string;
  bookingId?: string;
  showActions?: boolean;
  router?: any; // Add router prop
  user?: any; // Add user prop for guest detection
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  bookingReference,
  bookingId,
  showActions = true,
  router,
  user,
}: SuccessModalProps) {
  const { isDarkTheme } = useTheme();
  const modalRouter = router || useRouter(); // Use passed router or create new one

  const handleDownload = () => {
    // Create a simple text file with booking details
    const bookingDetails = `
BORA PARK - BOOKING CONFIRMATION
================================
Booking Reference: ${bookingReference || "N/A"}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

${title}
${message}

Thank you for choosing Bora Park!
    `.trim();

    // Create blob and download
    const blob = new Blob([bookingDetails], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bora-park-booking-${bookingReference || 'confirmation'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Bora Park Booking Confirmation",
          text: `Booking Reference: ${bookingReference}`,
        });
      } catch (err) {
        console.log("Share failed:", err);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className={`relative w-full max-w-md rounded-4xl overflow-hidden shadow-2xl ${
              isDarkTheme ? "bg-gray-800" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className={`relative p-8 text-center ${
                isDarkTheme ? "bg-linear-to-b from-gray-900 to-gray-800" : "bg-linear-to-b from-white to-gray-50"
              }`}
            >
              <button
                onClick={onClose}
                className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                  isDarkTheme
                    ? "bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600"
                    : "bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                }`}
              >
                <X size={20} />
              </button>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center"
              >
                <CheckCircle className="w-8 h-8 text-green-600" />
              </motion.div>

              <h2
                className={`text-2xl font-black mb-2 ${
                  isDarkTheme ? "text-white" : "text-gray-900"
                }`}
              >
                {title}
              </h2>

              {bookingReference && (
                <div className="mb-4">
                  <p
                    className={`text-xs font-medium uppercase tracking-widest mb-1 ${
                      isDarkTheme ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Reference
                  </p>
                  <p
                    className={`font-mono text-sm font-bold ${
                      isDarkTheme ? "text-green-400" : "text-green-600"
                    }`}
                  >
                    {bookingReference}
                  </p>
                </div>
              )}

              <p
                className={`text-sm ${
                  isDarkTheme ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {message}
              </p>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="p-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDownload}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                      isDarkTheme
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Download size={16} />
                    Download
                  </button>
                  <button
                    onClick={handleShare}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                      isDarkTheme
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Share2 size={16} />
                    Share
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (user) {
                      // Logged-in users: Navigate to booking details using booking ID
                      if (bookingId) {
                        modalRouter.push(`/my-bookings/${bookingId}`);
                      } else {
                        onClose();
                      }
                    } else {
                      // Guests: Navigate to my-bookings list to see all their bookings
                      modalRouter.push("/my-bookings");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-colors bg-[#ffd84f] text-gray-900 hover:bg-[#f0c63f]"
                >
                  See Details <ArrowRight size={16} />
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
