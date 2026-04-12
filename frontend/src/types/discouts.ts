//The Core Promotion Interfaces

export enum DiscountType {
  PERCENTAGE = "PERCENTAGE",
  FLAT_AMOUNT = "FLAT_AMOUNT",
}

export enum RuleType {
  REQUIRE_AUTH = "REQUIRE_AUTH",
  GLOBAL_LIMIT = "GLOBAL_LIMIT",
  PRODUCT_SPECIFIC = "PRODUCT_SPECIFIC",
  MIN_PURCHASE = "MIN_PURCHASE",
}

// Specific data shapes for the JSONB column
export interface AuthRuleData {
  is_authenticated: boolean;
}
export interface LimitRuleData {
  limit: number;
  current_usage: number;
}
export interface ProductRuleData {
  ticket_type_ids: string[];
}
export interface MinPurchaseData {
  min_amount: number;
}

export interface PromotionRule {
  id: string;
  promotion_id: string;
  ruleType: RuleType;
  ruleData: AuthRuleData | LimitRuleData | ProductRuleData | MinPurchaseData;
  discountType: DiscountType;
  discountValue: number;
}

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  startsAt: Date;
  endsAt: Date;
  maxGlobalUsages?: number;
  totalUsages: number;
  rules: PromotionRule[]; // Nested rules for the engine to check
}

//The "Engine" Interface

export interface DiscountContext {
  userId?: string;
  isAuthenticated: boolean;
  cartTotal: number;
  productIds: string[]; // IDs of products currently in the booking
  couponCode?: string;
}

export interface AppliedDiscount {
  promotionId: string;
  totalDiscount: number;
  discountedLineItems: {
    productId: string;
    amountSaved: number;
  }[];
}
