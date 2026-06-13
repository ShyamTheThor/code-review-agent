import { Link } from "react-router-dom";
import { TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import DashboardCard from "./DashboardCard";
import type { MemoryInsights } from "@/types/memory.types";

interface MemoryHighlightsProps {
  insights: MemoryInsights;
}

export default function MemoryHighlights({ insights }: MemoryHighlightsProps) {
  const topCategory = insights.frequentIssueCategories[0];

  return (
    <DashboardCard title="Memory Highlights" className="h-full">
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Top Weakness</p>
              <p className="text-sm text-zinc-200 font-medium capitalize">{insights.topWeakness}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="size-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Improvement Trend</p>
              <p className="text-sm text-zinc-200 font-medium">Score: {insights.improvementTrendScore}%</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="size-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Lightbulb className="size-4 text-indigo-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Key Insight</p>
              <p className="text-sm text-zinc-300 italic">
                {topCategory 
                  ? `Focusing on ${topCategory.category} issues could boost your quality score.`
                  : "Keep reviewing code to unlock personalized growth insights."
                }
              </p>
            </div>
          </div>
        </div>

        <Link 
          to="/memory" 
          className="block w-full py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 text-xs font-bold rounded-md text-center transition-all"
        >
          View Full Dashboard
        </Link>
      </div>
    </DashboardCard>
  );
}
