/**
 * @typedef {Object} DiscountContext
 * @property {string} [userId]
 * @property {boolean} isAuthenticated
 * @property {Array<string>} ticketTypeIds
 * @property {number} cartTotal
 */

class PromotionEngine {
  /**
   * Evaluates if a promotion's rules are met
   */
  static validateRules(rules, context) {
    for (const rule of rules) {
      const { rule_type, rule_data } = rule;

      switch (rule_type) {
        case "REQUIRE_AUTH":
          if (!context.isAuthenticated) return false;
          break;

        case "GLOBAL_LIMIT":
          if (rule_data.current_usage >= rule_data.limit) return false;
          break;

        case "MIN_PURCHASE":
          if (context.cartTotal < rule_data.min_amount) return false;
          break;

        case "PRODUCT_SPECIFIC":
          // Check if any ticket type in this game matches the allowed ticket_type_ids
          const contextIds = context.ticketTypeIds ?? [];
          const allowedIds = rule_data.ticket_type_ids ?? [];
          const hasMatch = contextIds.some((id) => allowedIds.includes(id));
          if (!hasMatch) return false;
          break;
      }
    }
    return true;
  }

  /**
   * Calculates the specific discount amount
   */
  static calculateDiscount(price, rule) {
    if (rule.discount_type === "PERCENTAGE") {
      return price * (rule.discount_value / 100);
    }
    return Math.min(price, rule.discount_value); // Don't discount more than the price
  }
}

module.exports = PromotionEngine;
