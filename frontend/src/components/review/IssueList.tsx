import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AlertCircle, Zap, ShieldAlert, Palette } from "lucide-react";
import type { ReviewIssue } from "@/types/review.types";

interface IssueListProps {
  issues: ReviewIssue[];
}

export default function IssueList({ issues }: IssueListProps) {
  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'security': return <ShieldAlert className="size-4 text-red-500" />;
      case 'performance': return <Zap className="size-4 text-amber-500" />;
      case 'style': return <Palette className="size-4 text-blue-500" />;
      default: return <AlertCircle className="size-4 text-zinc-500" />;
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Identified Issues</h3>
        <span className="text-sm text-zinc-500">{issues.length} total findings</span>
      </div>

      <div className="grid gap-4">
        {issues.map((issue) => (
          <Card key={issue.id} className="overflow-hidden border-l-4 border-l-indigo-500">
            <CardHeader className="flex flex-row items-center justify-between py-3 bg-zinc-900/30">
              <div className="flex items-center gap-3">
                {getIssueIcon(issue.type)}
                <span className="text-sm font-semibold capitalize">{issue.type} Issue</span>
                <span className="text-xs text-zinc-500 font-mono">Line {issue.line}</span>
              </div>
              <Badge variant={getSeverityVariant(issue.severity)} className="capitalize">
                {issue.severity}
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm text-zinc-300">{issue.message}</p>
              <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                <p className="text-xs font-semibold text-zinc-500 uppercase mb-1">Recommendation</p>
                <p className="text-sm text-indigo-400 font-mono italic">{issue.suggestion}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
