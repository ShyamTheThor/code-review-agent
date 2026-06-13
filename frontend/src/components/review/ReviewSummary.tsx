import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import type { ReviewResponse } from "@/types/review.types";

interface ReviewSummaryProps {
  result: ReviewResponse;
}

export default function ReviewSummary({ result }: ReviewSummaryProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Score Card */}
      <Card className="md:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Review Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className={`text-6xl font-bold ${getScoreColor(result.score)}`}>
              {result.score}
            </div>
            <Progress value={result.score} className="w-full" />
            <p className="text-xs text-zinc-500 text-center">
              Overall code quality based on AI analysis
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-zinc-300">
            {result.summary}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="size-3 text-emerald-500" />
              {result.issues.filter(i => i.severity === 'low').length} Minor
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Info className="size-3 text-blue-500" />
              {result.issues.filter(i => i.severity === 'medium').length} Moderate
            </Badge>
            <Badge variant="outline" className="gap-1">
              <AlertTriangle className="size-3 text-amber-500" />
              {result.issues.filter(i => i.severity === 'high').length} Critical
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
