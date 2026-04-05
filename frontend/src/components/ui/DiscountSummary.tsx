"use client";

import React from "react";
import { motion } from "framer-motion";
import { DiscountBadge } from "./DiscountBadge";

interface DiscountSummaryProps {
  originalTotal: number;
  discountedTotal: number;
  discounts: Array<{
    type: "percentage" | "amount";
    value: number;
    reason: string;
  }>;
  className?: string;
}

export const DiscountSummary: React.FC<DiscountSummaryProps> = ({
  originalTotal,
  discountedTotal,
  discounts,
  className = "",
}) => {
  const totalSavings = originalTotal - discountedTotal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-linear-to-r from-[#FFD84D]/10 to-[#FFD84D]/5
        border border-[#FFD84D]/30 rounded-2xl p-4
        ${className}
      `}
    >
      <h3 className="text-lg font-black text-[#FFD84D] uppercase tracking-widest mb-3">
        💰 Discount Applied
      </h3>

      {/* Discount breakdown */}
      <div className="space-y-2 mb-4">
        {discounts.map((discount, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between bg-white/10 rounded-xl p-3"
          >
            <div className="flex items-center gap-2">
              <DiscountBadge 
                type={discount.type}
                percentage={discount.type === "percentage" ? discount.value : undefined}
                amount={discount.type === "amount" ? discount.value : undefined}
                size="sm"
              />
              <span className="text-white text-sm">{discount.reason}</span>
            </div>
            <span className="text-[#FFD84D] font-black text-sm">
              -{discount.type === "percentage" 
                ? `${discount.value}%`
                : `${discount.value} ETB`
              }
            </span>
          </motion.div>
        ))}
      </div>

      {/* Total savings */}
      <div className="border-t border-white/20 pt-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/60 text-sm">Original Total:</span>
          <span className="text-white/50 line-through">{originalTotal} ETB</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/60 text-sm">Discounted Total:</span>
          <span className="text-white font-black text-lg">{discountedTotal} ETB</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#FFD84D] font-black uppercase tracking-widest text-sm">
            You Saved:
          </span>
          <span className="text-[#FFD84D] font-bold text-xl">
            {totalSavings} ETB
          </span>
        </div>
      </div>
    </motion.div>
  );
};
