import apiClient from "@/lib/axios";
import type { ReviewRequest, ReviewResponse } from "@/types/review.types";

export const reviewService = {
  submitReview: async (data: ReviewRequest): Promise<ReviewResponse> => {
    const response = await apiClient.post<ReviewResponse>("/review", data);
    return response.data;
  },
};
