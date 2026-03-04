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
};
