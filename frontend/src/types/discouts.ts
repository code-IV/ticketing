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
  isAuthenticated: boolean;
}
export interface LimitRuleData {
  limit: number;
  currentUsage: number;
}
export interface ProductRuleData {
  ticketTypeIds: string[];
}
export interface MinPurchaseData {
  minAmount: number;
}

export interface PromotionRule {
  id: string;
  promotionId: string;
  ruleType: RuleType;
  ruleData: AuthRuleData | LimitRuleData | ProductRuleData | MinPurchaseData;
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
  discountType: DiscountType;
  discountValue: number;
  rules: PromotionRule[]; // Nested rules for the engine to check
}
