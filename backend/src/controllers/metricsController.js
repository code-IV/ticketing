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
    const { period } = req.query || "all_time";
    const validPeriods = [
      "today",
      "this_week",
      "this_month",
      "this_year",
      "all_time",
    ];
    if (!validPeriods.includes(period)) {
      return apiResponse(
        res,
        400,
        false,
        `Invalid period: "${period}". Please use: ${validPeriods.join(", ")}`,
      );
    }
    try {
      const result = await metrics.getUserAnalytics(period);

      return apiResponse(res, 200, true, "User Count Received", result);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = metricsController;
