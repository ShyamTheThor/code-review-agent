import apiClient from "@/lib/axios";
import type { HealthResponse } from "@/types/health.types";

export const healthService = {
  getHealth: async (): Promise<HealthResponse> => {
    const response = await apiClient.get<HealthResponse>("/health");
    return response.data;
  },
};
