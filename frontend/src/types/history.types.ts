import type { ReviewResponse, ReviewIssue } from "./review.types";

export interface HistoryItem {
  id: string;
  summary: string;
  timestamp: string;
  filename: string;
  issues: ReviewIssue[];
  suggestions: string[];
}

export type HistoryListResponse = HistoryItem[];
export type HistoryDetailResponse = ReviewResponse;
