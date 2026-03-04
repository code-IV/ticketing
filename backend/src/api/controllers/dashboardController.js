const Dashboard = require("../models/Dashboard");
const dashboardStatsService = require("../services/dashboardStatsService");
const { apiResponse } = require("../../utils/helpers");

const dashboardController = {
  //=============================
  //Revenue Metrics
  //=============================

  async getDashboardStats(req, res) {
    try {
      const { startDate, endDate, period = "1d" } = req.query;

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ error: "startDate and endDate are required" });
      }

      const data = await dashboardStatsService.getDashboardRevenueData(
        startDate,
        endDate,
        period,
      );
      console.log(data);
      res.json(data);
    } catch (error) {
      console.error("Dashboard API Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  //=============================
  //Analytics Metrics
  //=============================
  async getDashboard(req, res) {
    try {
      const { period = "d", startDate, endDate } = req.query;

      // Validate startDate & endDate
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate are required",
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid date format" });
      }

      // Parse period (e.g., "d", "2d", "w", "2m")
      const periodRegex = /^(\d*)([dwm])$/;
      const match = period.match(periodRegex);

      if (!match) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid period format" });
      }

      const interval = parseInt(match[1]) || 1; // Default to 1 if no number
      const unit = match[2]; // "d", "w", or "m"

      const data = await dashboardStatsService.getAdminDashboardData({
        period: unit,
        interval,
        startDate: start,
        endDate: end,
      });

      // Map numbers for frontend charts
      return apiResponse(res, 200, true, "Dashboard data retrieved", {
        stats: {
          totalRevenue: parseFloat(data.summary.totalRevenue),
          totalTicketsSold: parseInt(data.summary.totalTicketsSold),
          activeGames: parseInt(data.summary.activeGames),
        },
        revenueTrend: data.revenueTrend.map((r) => ({
          date: r.date,
          revenue: parseFloat(r.revenue),
        })),
        topGames: data.topGames.map((g) => ({
          game: g.game,
          revenue: parseFloat(g.revenue),
        })),
        ticketsTrend: data.ticketsTrend.map((t) => ({
          date: t.date,
          ticketsSold: parseInt(t.ticketsSold),
        })),
      });
    } catch (error) {
      console.error("Dashboard Error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to retrieve dashboard data" });
    }
  },
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
      const result = await Dashboard.getUserAnalytics(period);

      return apiResponse(res, 200, true, "User Count Received", result);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = dashboardController;
