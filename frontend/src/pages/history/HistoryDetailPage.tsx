import { useParams, useNavigate } from "react-router-dom";
import { useHistoryDetail } from "@/hooks/useHistory";
import ReviewSummary from "@/components/review/ReviewSummary";
import IssueList from "@/components/review/IssueList";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, AlertCircle, FileCode } from "lucide-react";

export default function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { detail, loading, error } = useHistoryDetail(id);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="size-12 text-red-500 mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-zinc-300">Review not found</h3>
        <p className="text-sm text-zinc-500 max-w-xs mx-auto mt-2 mb-8">
          {error}. It might have been deleted or the ID is invalid.
        </p>
        <Button onClick={() => navigate("/history")}>Back to History</Button>
      </div>
    );
  }

  if (loading || !detail) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-48 md:col-span-1" />
          <Skeleton className="h-48 md:col-span-2" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/history")} 
            className="-ml-2 mb-2 text-zinc-500 hover:text-zinc-200"
          >
            <ChevronLeft className="size-4 mr-1" />
            Back to History
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Review Details
          </h1>
          <div className="flex items-center gap-3 mt-1 text-zinc-500">
            <div className="flex items-center gap-1.5">
              <FileCode className="size-4" />
              <span className="text-sm font-medium uppercase">{detail.language}</span>
            </div>
            <span>•</span>
            <span className="text-sm">
              {new Date(detail.createdAt).toLocaleString(undefined, { 
                dateStyle: 'medium', 
                timeStyle: 'short' 
              })}
            </span>
          </div>
        </div>
      </div>

      <ReviewSummary result={detail} />
      <IssueList issues={detail.issues} />
      
      {detail.suggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Additional Suggestions</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {detail.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-3 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-sm text-zinc-300">
                <span className="flex-shrink-0 size-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                  {index + 1}
                </span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
