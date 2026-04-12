/**
 * @typedef {Object} DiscountContext
 * @property {string} [userId]
 * @property {boolean} isAuthenticated
 * @property {Array<string>} ticketTypeIds
 * @property {number} cartTotal
 */

class PromotionEngine {
  static validateRules(rules, context) {
    for (const rule of rules) {
      const { type, data } = rule;

      switch (type) {
        case "REQUIRE_AUTH":
          if (!context.isAuthenticated) return false;
          break;

        case "GLOBAL_LIMIT":
          if (data.currentUsage >= data.limit) return false;
          break;

        case "MIN_PURCHASE":
          if (context.cartTotal < data.minAmount) return false;
          break;

        case "PRODUCT_SPECIFIC": {
          // If rule has ticket_type_ids, require at least one match.
          const allowedTicketTypeIds = data.ticketTypeIds;
          if (!allowedTicketTypeIds || allowedTicketTypeIds.length === 0) {
            break; // no restriction
          }
          const hasMatch = (context.ticketTypeIds || []).some((id) =>
            allowedTicketTypeIds.includes(id),
          );
          if (!hasMatch) return false;
          break;
        }

        default:
          return false;
      }
    }
    return true;
  }

  static calculateDiscount(price, discountType, discountValue) {
    if (discountType === "PERCENTAGE") {
      return price * (discountValue / 100);
    }
    return Math.min(price, discountValue);
  }
}

module.exports = PromotionEngine;
