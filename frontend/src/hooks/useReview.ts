import { useState } from "react";
import { toast } from "sonner";
import { reviewService } from "@/services/review.service";
import type { ReviewResponse } from "@/types/review.types";

export function useReview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReviewResponse | null>(null);

  const submitReview = async (code: string, language: string) => {
    if (!code.trim()) {
      const msg = "Please provide some code to review.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await reviewService.submitReview({ code, language });
      setResult(data);
      toast.success("Review completed successfully!");
    } catch (err: any) {
      const msg = err.message || "Failed to submit review. Please try again.";
      setError(msg);
      toast.error("Analysis Failed", {
        description: msg
      });
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const resetReview = () => {
    setResult(null);
    setError(null);
  };

  return {
    loading,
    error,
    result,
    submitReview,
    resetReview
  };
}
