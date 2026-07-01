import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

/**
 * Shared axios client. Points at the Laravel API. Auth token (Sanctum) is read
 * from localStorage and attached as a Bearer header on every request.
 *
 * NOTE: the backend API routes are not built yet — screens currently render
 * from `@/lib/sample-data`. This client is wired and ready: swap the sample
 * query functions for `api.get(...)` calls once the endpoints exist.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  timeout: 10000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("homwok_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string }>) => {
    const message = error.response?.data?.message || "Terjadi kesalahan";
    switch (error.response?.status) {
      case 401:
        if (typeof window !== "undefined") {
          localStorage.removeItem("homwok_token");
          localStorage.removeItem("homwok_user");
          window.location.href = "/login";
        }
        break;
      case 403:
        toast.error("Anda tidak memiliki akses");
        break;
      case 422:
        toast.error(message);
        break;
      case 500:
        toast.error("Server error, silakan coba lagi");
        break;
      default:
        toast.error(message);
    }
    return Promise.reject(error);
  },
);

export default api;
