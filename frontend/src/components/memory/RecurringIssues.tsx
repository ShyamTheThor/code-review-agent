import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AlertTriangle } from "lucide-react";

interface RecurringIssuesProps {
  weaknesses: string[];
}

export default function RecurringIssues({ weaknesses }: RecurringIssuesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="size-5 text-amber-500" />
          Recurring Weaknesses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {weaknesses.map((weakness, index) => (
            <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <span className="flex-shrink-0 size-6 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-bold">
                {index + 1}
              </span>
              <p className="text-sm text-zinc-300 leading-tight pt-0.5">{weakness}</p>
            </li>
          ))}
          {weaknesses.length === 0 && (
            <p className="text-sm text-zinc-500 italic py-4 text-center">No recurring weaknesses identified yet.</p>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
