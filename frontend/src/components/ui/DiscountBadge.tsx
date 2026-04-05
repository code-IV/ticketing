"use client";

import React from "react";
import { motion } from "framer-motion";

interface DiscountBadgeProps {
  customText?: string;        // Custom text instead of percentage/amount
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const DiscountBadge: React.FC<DiscountBadgeProps> = ({
  customText,
  className = "",
  size = "sm",
}) => {
  const sizeClasses = {
    sm: "px-2 py-1 text-[10px]",
    md: "px-3 py-1.5 text-xs",
    lg: "px-4 py-2 text-sm",
  };

  // Use custom text or fallback
  const discountText = customText || "OFFER";

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ 
        scale: [1, 1.05, 1],
        opacity: 1,
        transition: {
          scale: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          },
          opacity: {
            duration: 0.3,
            ease: "easeOut"
          }
        }
      }}
      className={`
        relative inline-flex items-center justify-center
        bg-[#FFD84D] text-black font-black uppercase tracking-widest
        rounded-full shadow-lg
        ${sizeClasses[size]}
        ${className}
      `}
      style={{
        // Remove all conflicting animations
      }}
    >
      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-full opacity-40"
        style={{
          background: "radial-gradient(circle, #FFD84D 0%, transparent 60%)",
          filter: "blur(12px)",
        }}
      />
      
      {/* Badge content */}
      <span className="relative z-10">{discountText}</span>
    </motion.div>
  );
};
