import { Files, AlertCircle, Repeat, Calendar } from "lucide-react";
import DashboardCard from "./DashboardCard";

interface OverviewCardsProps {
  totalReviews: number;
  topWeakness: string;
  recurringCount: number;
  latestDate: string | null;
}

export default function OverviewCards({ totalReviews, topWeakness, recurringCount, latestDate }: OverviewCardsProps) {
  const formattedDate = latestDate 
    ? new Date(latestDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : "N/A";

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <DashboardCard title="Total Reviews" icon={<Files className="size-4" />}>
        <div className="text-2xl font-bold text-white">{totalReviews}</div>
        <p className="text-xs text-zinc-500 mt-1">Total sessions completed</p>
      </DashboardCard>

      <DashboardCard title="Top Weakness" icon={<AlertCircle className="size-4 text-red-500" />}>
        <div className="text-lg font-bold text-red-400 truncate capitalize">
          {topWeakness || "None yet"}
        </div>
        <p className="text-xs text-zinc-500 mt-1">Most recurring issue</p>
      </DashboardCard>

      <DashboardCard title="Recurring Issues" icon={<Repeat className="size-4 text-amber-500" />}>
        <div className="text-2xl font-bold text-amber-400">{recurringCount}</div>
        <p className="text-xs text-zinc-500 mt-1">Known patterns found</p>
      </DashboardCard>

      <DashboardCard title="Latest Review" icon={<Calendar className="size-4 text-indigo-500" />}>
        <div className="text-2xl font-bold text-indigo-400">{formattedDate}</div>
        <p className="text-xs text-zinc-500 mt-1">Last activity recorded</p>
      </DashboardCard>
    </div>
  );
}
