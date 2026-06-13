import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { IssueCategory } from "@/types/memory.types";

interface ImprovementInsightsProps {
  categories: IssueCategory[];
}

export default function ImprovementInsights({ categories }: ImprovementInsightsProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="size-4 text-emerald-500" />;
      case 'declining': return <TrendingDown className="size-4 text-red-500" />;
      default: return <Minus className="size-4 text-zinc-500" />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'improving': return 'Improving';
      case 'declining': return 'Declining';
      default: return 'Stable';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Issue Categories & Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.category} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/30 border border-zinc-800">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-zinc-200 capitalize">{cat.category}</span>
                <span className="text-xs text-zinc-500">{cat.count} occurrences</span>
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(cat.trend)}
                <span className={`text-xs font-medium ${
                  cat.trend === 'improving' ? 'text-emerald-500' : 
                  cat.trend === 'declining' ? 'text-red-500' : 'text-zinc-500'
                }`}>
                  {getTrendText(cat.trend)}
                </span>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-zinc-500 italic py-4 text-center">No trend data available.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
