import axios from "axios";
import { logger } from "@/utils/logger";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - log outgoing requests
api.interceptors.request.use(
  (config) => {
    logger.logRequest(config.method?.toUpperCase() || 'UNKNOWN', config.url || '', config.data);
    return config;
  },
  (error) => {
    logger.logError('REQUEST', error.config?.url || 'UNKNOWN', error);
    return Promise.reject(error);
  }
);

// Response interceptor - log responses and errors
api.interceptors.response.use(
  (response) => {
    logger.logResponse(
      response.config.method?.toUpperCase() || 'UNKNOWN', 
      response.config.url || '', 
      response.data
    );
    return response;
  },
  (error) => {
    logger.logError(
      error.config?.method?.toUpperCase() || 'UNKNOWN', 
      error.config?.url || 'UNKNOWN', 
      error.response?.data || error.message
    );
    
    // Keep existing error handling logic
    console.error("API Error:", error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      // Only redirect to login for protected routes, not public pages
      const publicRoutes = ["/", "/events", "/games", "/buy", "/tickets"];
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      const isPublicRoute = publicRoutes.some(route => currentPath.startsWith(route));
      
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/auth") &&
        !isPublicRoute
      ) {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  },
);
