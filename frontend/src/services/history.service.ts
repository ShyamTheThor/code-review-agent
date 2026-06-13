import apiClient from "@/lib/axios";
import type { HistoryListResponse, HistoryDetailResponse } from "@/types/history.types";

export const historyService = {
  getHistory: async (): Promise<HistoryListResponse> => {
    const response = await apiClient.get<HistoryListResponse>("/history");
    return response.data;
  },

  getHistoryById: async (id: string): Promise<HistoryDetailResponse> => {
    const response = await apiClient.get<HistoryDetailResponse>(`/history/${id}`);
    return response.data;
  },
};
