const { query } = require("../../config/db");

const Discount = {
  async addPromotion(data, client) {
    const sql = `INSERT INTO promotions (name, description, is_active, max_global_usages, total_usages, starts_at, ends_at, discount_type, discount_value)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`;
    const result = await client.query(sql, [
      data.name,
      data.description,
      data.isActive,
      data.maxGlobalUsages,
      data.totalUsages,
      data.startsAt,
      data.endsAt,
      data.discountType,
      data.discountValue,
    ]);
    return result.rows[0].id;
  },

  async addPromotionRule(promotionId, data, client) {
    const sql = `INSERT INTO promotion_rules (promotion_id, rule_type, rule_data)
                VALUES ($1,$2,$3) RETURNING id`;
    const result = await client.query(sql, [
      promotionId,
      data.ruleType,
      data.ruleData,
    ]);
    return result.rows[0].id;
  },

  async addCoupon(promotionId, data, client) {
    const sql = `INSERT INTO coupon_codes (promotion_id, code, max_usages_per_user, is_active)
                VALUES ($1, $2, $3, $4) RETURNING id`;
    const result = await client.query(sql, [
      promotionId,
      data.code,
      data.maxUsagesPerUser,
      data.isActive,
    ]);
    return result.rows[0].id;
  },

  async getApplicablePromos() {
    const sql = `SELECT 
    p.*, 
    COALESCE(r.rules, '[]'::json) AS rules
FROM promotions p
LEFT JOIN (
    -- Aggregate rules first to keep the main query clean
    SELECT 
        promotion_id, 
        json_agg(json_build_object(
            'id', id,
            'type', rule_type,
            'data', rule_data
        )) AS rules
    FROM promotion_rules
    GROUP BY promotion_id
) r ON p.id = r.promotion_id
WHERE 
    p.is_active = true
    -- AND CURRENT_TIMESTAMP BETWEEN p.starts_at 
    -- AND p.ends_at
    AND (p.max_global_usages IS NULL OR p.total_usages < p.max_global_usages);`;
    const result = await query(sql);

    return result.rows;
  },
};
module.exports = { Discount };
