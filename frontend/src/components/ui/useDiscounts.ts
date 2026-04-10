"use client";

import { useMemo } from "react";

export interface DiscountRule {
  type: "percentage" | "amount";
  value: number;
  reason: string;
  minQuantity?: number;
  maxQuantity?: number;
  gameIds?: string[];
}

export interface AppliedDiscount {
  type: "percentage" | "amount";
  value: number;
  reason: string;
  originalPrice: number;
  discountedPrice: number;
  savings: number;
}

// Random discount generator for demo
const generateRandomDiscount = (gameId: string, quantity: number): DiscountRule | null => {
  const discountTypes: DiscountRule[] = [
    {
      type: "percentage",
      value: 15,
      reason: "Early Bird Special",
      minQuantity: 1,
    },
    {
      type: "percentage", 
      value: 25,
      reason: "Bulk Discount (3+ tickets)",
      minQuantity: 3,
    },
    {
      type: "amount",
      value: 50,
      reason: "Weekend Special",
      minQuantity: 2,
    },
    {
      type: "percentage",
      value: 30,
      reason: "VIP Member Discount",
      minQuantity: 1,
    },
  ];

  // Randomly apply discounts for demo
  const shouldApply = Math.random() > 0.3; // 70% chance of discount
  if (!shouldApply) return null;

  const availableDiscounts = discountTypes.filter(
    discount => !discount.minQuantity || quantity >= discount.minQuantity
  );

  if (availableDiscounts.length === 0) return null;

  return availableDiscounts[Math.floor(Math.random() * availableDiscounts.length)];
};

export const useDiscounts = (
  gameId: string,
  quantity: number,
  originalPrice: number
): AppliedDiscount | null => {
  return useMemo(() => {
    const discountRule = generateRandomDiscount(gameId, quantity);
    
    if (!discountRule) return null;

    const discountedPrice = discountRule.type === "percentage"
      ? originalPrice * (1 - discountRule.value / 100)
      : originalPrice - discountRule.value;

    const savings = originalPrice - discountedPrice;

    return {
      type: discountRule.type,
      value: discountRule.value,
      reason: discountRule.reason,
      originalPrice,
      discountedPrice,
      savings,
    };
  }, [gameId, quantity, originalPrice]);
};

export const useCartDiscounts = (
  cartItems: Record<string, Record<string, number>>,
  games: any[]
): Array<{
  type: "percentage" | "amount";
  value: number;
  reason: string;
}> => {
  return useMemo(() => {
    const allDiscounts: Array<{type: "percentage" | "amount"; value: number; reason: string}> = [];
    
    Object.entries(cartItems).forEach(([gameId, ticketTypes]) => {
      const game = games.find(g => g.id === gameId);
      if (!game) return;

      Object.entries(ticketTypes).forEach(([category, quantity]) => {
        const ticketType = game.ticketTypes?.find((tt: any) => tt.category === category);
        if (!ticketType) return;

        const discount = useDiscounts(gameId, quantity, ticketType.price);
        if (discount && !allDiscounts.find(d => d.reason === discount.reason)) {
          allDiscounts.push({
            type: discount.type,
            value: discount.value,
            reason: discount.reason,
          });
        }
      });
    });

    return allDiscounts;
  }, [cartItems, games]);
};
