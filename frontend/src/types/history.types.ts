import type { ReviewResponse } from "./review.types";

export interface HistoryItem {
  id: string;
  summary: string;
  score: number;
  language: string;
  createdAt: string;
}

export type HistoryListResponse = HistoryItem[];
export type HistoryDetailResponse = ReviewResponse;
