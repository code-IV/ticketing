"use client";

import React from "react";
import { motion } from "framer-motion";
import { DiscountBadge } from "./DiscountBadge";

interface DiscountedTicketProps {
  category: string;
  originalPrice: number;
  discount?: {
    type: "percentage" | "amount";
    value: number;
  };
  quantity: number;
  onQuantityChange: (delta: number) => void;
  className?: string;
}

export const DiscountedTicket: React.FC<DiscountedTicketProps> = ({
  category,
  originalPrice,
  discount,
  quantity,
  onQuantityChange,
  className = "",
}) => {
  // Calculate discounted price
  const discountedPrice = discount
    ? discount.type === "percentage"
      ? originalPrice * (1 - discount.value / 100)
      : originalPrice - discount.value
    : originalPrice;

  const savings = originalPrice - discountedPrice;

  return (
    <div
      className={`
        flex justify-between items-center 
        bg-white/10 backdrop-blur-md 
        rounded-2xl p-3 border border-white/10
        ${className}
      `}
    >
      <div className="flex-1">
        <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">
          {category}
        </p>
        
        {/* Price display with strikethrough if discounted */}
        <div className="flex items-center gap-2">
          {discount && (
            <span className="text-white/50 line-through text-xs">
              {originalPrice} ETB
            </span>
          )}
          <p className="text-white font-black text-sm">
            {discountedPrice} ETB
          </p>
        </div>

        {/* Savings indicator */}
        {discount && (
          <p className="text-[#FFD84D] text-[8px] font-black uppercase tracking-widest">
            SAVE {savings} ETB
          </p>
        )}
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-3 bg-white/20 rounded-xl p-1 px-2">
        <button
          onClick={() => onQuantityChange(-1)}
          className="text-white hover:text-red-400 transition-colors"
        >
          <span className="w-4 h-4 flex items-center justify-center">−</span>
        </button>
        <span className="text-white font-black text-sm w-4 text-center">
          {quantity}
        </span>
        <button
          onClick={() => onQuantityChange(1)}
          className="text-white hover:text-indigo-400 transition-colors"
        >
          <span className="w-4 h-4 flex items-center justify-center">+</span>
        </button>
      </div>

      {/* Discount badge */}
      {discount && (
        <div className="absolute -top-2 -right-2">
          <DiscountBadge 
            type={discount.type}
            percentage={discount.type === "percentage" ? discount.value : undefined}
            amount={discount.type === "amount" ? discount.value : undefined}
            size="sm"
          />
        </div>
      )}
    </div>
  );
};
