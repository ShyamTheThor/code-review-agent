import { Link } from "react-router-dom";
import { ChevronRight, FileCode, Clock } from "lucide-react";
import DashboardCard from "./DashboardCard";
import type { HistoryItem } from "@/types/history.types";

interface RecentReviewsProps {
  reviews: HistoryItem[];
}

export default function RecentReviews({ reviews }: RecentReviewsProps) {
  return (
    <DashboardCard title="Recent Reviews" className="h-full">
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.slice(0, 5).map((review) => (
            <Link 
              key={review.id} 
              to={`/history/${review.id}`}
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileCode className="size-4 text-zinc-500 group-hover:text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{review.summary}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{review.language}</span>
                    <span className="text-zinc-800 text-[10px]">•</span>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <Clock className="size-2.5" />
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className={`text-sm font-bold ${
                  review.score >= 80 ? "text-emerald-500" : 
                  review.score >= 60 ? "text-amber-500" : "text-red-500"
                }`}>
                  {review.score}
                </span>
                <ChevronRight className="size-4 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-zinc-500 italic">No reviews found yet.</p>
            <Link to="/review" className="text-xs text-indigo-400 hover:underline mt-2">
              Start your first review
            </Link>
          </div>
        )}
      </div>
      {reviews.length > 5 && (
        <Link to="/history" className="block text-center text-xs text-zinc-500 hover:text-zinc-300 mt-4 transition-colors">
          View all history
        </Link>
      )}
    </DashboardCard>
  );
}
