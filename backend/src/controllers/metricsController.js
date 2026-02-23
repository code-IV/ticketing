const metrics = require("../models/Metrics");
const { apiResponse } = require("../utils/helpers");

const metricsController = {
  //=============================
  //User Metrics
  //=============================

  /**
   * GET /api/metrics/user?period=today   get the number of users signed up in some period
   */
  async getUserCountInPeriod(req, res, next) {
    try {
      const { period } = req.query || "all_time";
      const result = await metrics.countUsersCreated(period);

      return apiResponse(res, 200, true, "User Count Received", {
        user_count: result.user_count,
        period: period,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = metricsController;
