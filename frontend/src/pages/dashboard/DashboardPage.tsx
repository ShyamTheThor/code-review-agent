import { useState, useEffect } from "react";
import { useHistory } from "@/hooks/useHistory";
import { useMemory } from "@/hooks/useMemory";
import { healthService } from "@/services/health.service";
import OverviewCards from "@/components/dashboard/OverviewCards";
import RecentReviews from "@/components/dashboard/RecentReviews";
import MemoryHighlights from "@/components/dashboard/MemoryHighlights";
import QuickActions from "@/components/dashboard/QuickActions";
import { Skeleton } from "@/components/ui/Skeleton";
import { AlertCircle, LayoutDashboard, Activity } from "lucide-react";

export default function DashboardPage() {
  const { items: history, loading: historyLoading, error: historyError } = useHistory();
  const { data: memory, loading: memoryLoading, error: memoryError } = useMemory();
  const [healthStatus, setHealthStatus] = useState<'ok' | 'error' | 'loading'>('loading');

  useEffect(() => {
    healthService.getHealth()
      .then(() => setHealthStatus('ok'))
      .catch(() => setHealthStatus('error'));
  }, []);

  const isLoading = historyLoading || memoryLoading;
  const hasError = historyError || memoryError;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <LayoutDashboard className="size-8 text-indigo-500" />
            Dashboard
          </h1>
          <p className="text-zinc-500">Welcome back. Here's what's happening with your code quality.</p>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${
          healthStatus === 'ok' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
          healthStatus === 'error' ? "bg-red-500/10 border-red-500/20 text-red-500" :
          "bg-zinc-500/10 border-zinc-500/20 text-zinc-500"
        }`}>
          <Activity className={`size-3.5 ${healthStatus === 'loading' ? "animate-pulse" : ""}`} />
          {healthStatus === 'ok' ? "AI Service Online" : healthStatus === 'error' ? "Service Offline" : "Checking Status..."}
        </div>
      </div>

      {hasError ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-center">
          <AlertCircle className="size-12 text-red-500 mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-red-400">Dashboard partially unavailable</h3>
          <p className="text-sm text-red-400/70 max-w-xs mx-auto mt-2">
            {historyError || memoryError}. Some insights might be missing.
          </p>
        </div>
      ) : null}

      <div className="space-y-8">
        <section>
          <QuickActions />
        </section>

        <section>
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <OverviewCards 
              totalReviews={history?.length || 0}
              topWeakness={memory?.topWeakness || "N/A"}
              recurringCount={memory?.recurringWeaknesses?.length || 0}
              latestDate={history && history.length > 0 ? (history[0]?.createdAt || history[0]?.timestamp || null) : null}
            />
          )}
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            {isLoading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <RecentReviews reviews={history} />
            )}
          </section>

          <section>
            {isLoading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : memory ? (
              <MemoryHighlights insights={memory} />
            ) : (
              <div className="h-full rounded-2xl border border-dashed border-zinc-800 flex items-center justify-center p-8 text-center">
                <p className="text-sm text-zinc-500">Submit more reviews to unlock memory highlights.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
