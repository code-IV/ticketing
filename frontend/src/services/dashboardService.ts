import { api } from "@/lib/api";
import { ApiResponse } from "@/types";

export const dashboardService = {
  async getDashboard(
    startDate: string,
    endDate: string,
    period: string = "d",
  ): Promise<ApiResponse<any>> {
    const response = await api.get("/metrics/dashboard", {
      params: {
        period,
        startDate,
        endDate,
      },
    });
    return response.data;
  },
  async getDashboardRevenue(
    startDate: string,
    endDate: string,
    period: string = "d",
  ): Promise<ApiResponse<any>> {
    const response = await api.get("/analytics/revenue", {
      params: {
        period,
        startDate,
        endDate,
      },
    });
    return response.data;
  },
  async getUserAnalytics(
    startDate: string,
    endDate: string,
  ): Promise<ApiResponse<any>> {
    const response = await api.get("/analytics/users", {
      params: {
        startDate,
        endDate,
      },
    });
    return response.data;
  },
  async getUserMetrics(
    period: string = "all_time",
  ): Promise<ApiResponse<any>> {
    const response = await api.get("/metrics/users", {
      params: {
        period,
      },
    });
    return response.data;
  },
};
