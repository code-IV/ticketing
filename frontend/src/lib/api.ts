import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
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
