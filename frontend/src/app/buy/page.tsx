"use client";
import React, { useState } from "react";
import {
  Ticket,
  ShoppingCart,
  CheckCircle2,
  Circle,
  Info,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BuyTicketsPage = () => {
  const ticketTypes = [
    { id: "t1", name: "Adult Access", price: 500, description: "Ages 12+" },
    { id: "t2", name: "Child Access", price: 250, description: "Ages 3-11" },
  ];

  const games = [
    {
      id: "g1",
      name: "Roller Coaster",
      price: 150,
      description: "High-speed thrills",
    },
    {
      id: "g2",
      name: "Ferris Wheel",
      price: 100,
      description: "Panoramic views",
    },
    { id: "g3", name: "Bumper Cars", price: 80, description: "Family fun" },
    {
      id: "g4",
      name: "Haunted House",
      price: 120,
      description: "Spooky adventure",
    },
  ];

  const [selectedTicket, setSelectedTicket] = useState<string>("t1");
  const [selectedGames, setSelectedGames] = useState<string[]>([]);

  const toggleGame = (gameId: string) => {
    setSelectedGames((prev) =>
      prev.includes(gameId)
        ? prev.filter((id) => id !== gameId)
        : [...prev, gameId],
    );
  };

  const ticketPrice =
    ticketTypes.find((t) => t.id === selectedTicket)?.price || 0;
  const gamesPrice = selectedGames.reduce(
    (sum, id) => sum + (games.find((g) => g.id === id)?.price || 0),
    0,
  );
  const total = ticketPrice + gamesPrice;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    hover: { scale: 1.04, transition: { duration: 0.25 } },
    selected: {
      scale: 1.03,
      boxShadow: "0 20px 35px -10px rgba(59,130,246,0.4)",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-12">
          {/* Ticket Types */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg">
                <Ticket className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Choose Your Pass
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {ticketTypes.map((type) => {
                const isSelected = selectedTicket === type.id;
                return (
                  <motion.div
                    key={type.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTicket(type.id)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setSelectedTicket(type.id)
                    }
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    className={`relative cursor-pointer rounded-3xl p-6 border-2 transition-shadow overflow-hidden ${
                      isSelected
                        ? "border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-2xl"
                        : "border-gray-200 bg-white shadow-md hover:shadow-xl"
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-24 h-24 bg-blue-600 rounded-bl-full opacity-10"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.6 }}
                      />
                    )}

                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <h3 className="font-bold text-xl text-gray-900">
                          {type.name}
                        </h3>
                        <p className="text-gray-600 mt-1 text-sm">
                          {type.description}
                        </p>
                      </div>
                      <motion.div
                        animate={{ rotate: isSelected ? 360 : 0 }}
                        transition={{ duration: 0.6 }}
                      >
                        <CheckCircle2
                          size={32}
                          className={
                            isSelected
                              ? "text-blue-600 fill-blue-100"
                              : "text-gray-300"
                          }
                        />
                      </motion.div>
                    </div>

                    <p className="mt-6 text-3xl font-black text-blue-700">
                      {type.price}{" "}
                      <span className="text-xl font-bold">ETB</span>
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Games */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-2xl shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Pick Your Adventures
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <AnimatePresence>
                {games.map((game) => {
                  const isSelected = selectedGames.includes(game.id);
                  return (
                    <motion.div
                      key={game.id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleGame(game.id)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && toggleGame(game.id)
                      }
                      role="checkbox"
                      tabIndex={0}
                      aria-checked={isSelected}
                      className={`group cursor-pointer rounded-3xl p-6 flex items-center gap-5 border-2 transition-all ${
                        isSelected
                          ? "border-purple-600 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl"
                          : "border-gray-100 bg-white shadow hover:shadow-2xl hover:border-purple-200"
                      }`}
                    >
                      <motion.div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold transition-colors flex-shrink-0 ${
                          isSelected
                            ? "bg-purple-600 text-white shadow-lg"
                            : "bg-purple-100 text-purple-600 group-hover:bg-purple-200"
                        }`}
                        animate={{ scale: isSelected ? 1.15 : 1 }}
                      >
                        {isSelected ? (
                          <CheckCircle2 size={28} />
                        ) : (
                          <Circle size={28} />
                        )}
                      </motion.div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-base truncate">
                          {game.name}
                        </h4>
                        <p className="text-purple-700 font-extrabold text-sm mt-0.5">
                          +{game.price} ETB
                        </p>
                      </div>

                      <Info
                        size={20}
                        className="text-gray-400 group-hover:text-purple-500"
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Sticky Checkout */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-gradient-to-b from-gray-900 to-black text-white p-8 rounded-3xl shadow-2xl h-fit sticky top-8"
        >
          <h2 className="text-2xl font-extrabold mb-8 flex items-center gap-3">
            <ShoppingCart className="w-6 h-6" /> Your Adventure
          </h2>

          <div className="space-y-6 mb-10">
            <div className="flex justify-between text-gray-400 text-sm font-medium">
              <span>Access Pass</span>
              <span className="text-white font-bold">{ticketPrice} ETB</span>
            </div>

            {selectedGames.length > 0 && (
              <div className="pt-4 border-t border-gray-800">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">
                  Selected Rides
                </p>
                {selectedGames.map((id) => {
                  const game = games.find((g) => g.id === id);
                  return (
                    <div
                      key={id}
                      className="flex justify-between text-sm text-gray-300 py-1"
                    >
                      <span>{game?.name}</span>
                      <span>{game?.price} ETB</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between items-center pt-6 border-t border-gray-700 text-3xl font-black">
              <span>Total</span>
              <span className="text-blue-400">{total} ETB</span>
            </div>
          </div>

          <button
            disabled={total === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-5 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg"
          >
            Proceed to Payment
          </button>

          <p className="text-xs text-gray-500 mt-6 text-center font-semibold uppercase tracking-widest">
            QR code tickets → sent instantly to email
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default BuyTicketsPage;
