import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/Card";
import { Calendar, Code2, ChevronRight } from "lucide-react";
import type { HistoryItem } from "@/types/history.types";

interface HistoryCardProps {
  item: HistoryItem;
}

export default function HistoryCard({ item }: HistoryCardProps) {
  const date = new Date(item.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <Link to={`/history/${item.id}`}>
      <Card className="hover:border-zinc-700 transition-colors group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="size-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                <Code2 className="size-5 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-zinc-100 truncate">
                  {item.summary}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-zinc-500 uppercase tracking-wider font-medium">
                    {item.language}
                  </span>
                  <span className="text-zinc-800 text-[10px]">•</span>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Calendar className="size-3" />
                    {date}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0">
              <div className="text-right">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-0.5">Score</p>
                <p className={`text-xl font-bold ${getScoreColor(item.score)}`}>
                  {item.score}
                </p>
              </div>
              <ChevronRight className="size-5 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
