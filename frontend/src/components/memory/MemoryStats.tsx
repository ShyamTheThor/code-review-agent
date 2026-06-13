import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BrainCircuit, Files, AlertCircle } from "lucide-react";
import type { MemoryInsights } from "@/types/memory.types";

interface MemoryStatsProps {
  data: MemoryInsights;
}

export default function MemoryStats({ data }: MemoryStatsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Total Reviews</CardTitle>
          <Files className="size-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalReviewsAnalyzed}</div>
          <p className="text-xs text-zinc-500 mt-1">Sessions analyzed by AI</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Top Weakness</CardTitle>
          <AlertCircle className="size-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold truncate text-red-400">{data.topWeakness}</div>
          <p className="text-xs text-zinc-500 mt-1">Most frequent issue type</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Growth Score</CardTitle>
          <BrainCircuit className="size-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-400">{data.improvementTrendScore}%</div>
          <p className="text-xs text-zinc-500 mt-1">Overall improvement trend</p>
        </CardContent>
      </Card>
    </div>
  );
}
