import apiClient from "@/lib/axios";
import type { MemoryInsights } from "@/types/memory.types";

export const memoryService = {
  getMemoryInsights: async (): Promise<MemoryInsights> => {
    const response = await apiClient.get<MemoryInsights>("/memory");
    return response.data;
  },
};
