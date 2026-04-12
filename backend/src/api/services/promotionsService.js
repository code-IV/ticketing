const { getClient } = require("../../config/db");
const { Discount } = require("../models/Discount");

const PromotionsService = {
  async createPromotion(promotion) {
    const client = await getClient();
    try {
      await client.query("BEGIN");
      const promotionId = await Discount.addPromotion(promotion, client);
      for (const rule of promotion.rules ?? []) {
        await Discount.addPromotionRule(promotionId, rule, client);
      }
      await client.query("COMMIT");
      return promotionId;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
};

module.exports = { PromotionsService };
