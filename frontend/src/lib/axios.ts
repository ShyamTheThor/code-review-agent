import axios, { AxiosError } from "axios";
import { env } from "@/config/env";

const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for error normalization
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Standardize error structure for services to consume
    const message = (error.response?.data as any)?.message || error.message || "An unexpected error occurred";
    const status = error.response?.status;
    
    return Promise.reject({
      message,
      status,
      originalError: error
    });
  }
);

export default apiClient;
