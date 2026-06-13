import { useMemory } from "@/hooks/useMemory";
import MemoryStats from "@/components/memory/MemoryStats";
import RecurringIssues from "@/components/memory/RecurringIssues";
import ImprovementInsights from "@/components/memory/ImprovementInsights";
import { Skeleton } from "@/components/ui/Skeleton";
import { BrainCircuit, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function MemoryDashboardPage() {
  const { data, loading, error, refresh } = useMemory();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <BrainCircuit className="size-8 text-indigo-500" />
            Memory Dashboard
          </h1>
          <p className="text-zinc-500 mt-1">AI-driven analysis of your coding habits and growth.</p>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={refresh} 
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
          Refresh Insights
        </Button>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-center">
          <AlertCircle className="size-12 text-red-500 mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-red-400">Analysis Unavailable</h3>
          <p className="text-sm text-red-400/70 max-w-xs mx-auto mt-2">
            {error}. We couldn't retrieve your growth metrics.
          </p>
        </div>
      ) : loading ? (
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      ) : data ? (
        <div className="space-y-8">
          <MemoryStats data={data} />
          
          <div className="grid gap-6 md:grid-cols-2">
            <RecurringIssues weaknesses={data.recurringWeaknesses} />
            <ImprovementInsights categories={data.frequentIssueCategories} />
          </div>

          <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
            <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-2">Growth Tip</h3>
            <p className="text-zinc-300 text-sm leading-relaxed">
              Based on your recent reviews, focusing on <span className="text-indigo-400 font-bold capitalize">{data.topWeakness}</span> issues could yield the highest improvement in your overall code quality score. 
              Keep submitting reviews to refine these insights!
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-dashed border-zinc-800 text-center">
          <h3 className="text-xl font-semibold text-zinc-300">Insufficient Data</h3>
          <p className="text-sm text-zinc-500 max-w-xs mx-auto mt-2">
            We need more reviews to generate meaningful insights. Start a new code review to begin your journey.
          </p>
        </div>
      )}
    </div>
  );
}
