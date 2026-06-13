import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export default function DashboardCard({ title, icon, children, className, headerClassName }: DashboardCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2", headerClassName)}>
        <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">{title}</CardTitle>
        {icon && <div className="text-zinc-500">{icon}</div>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
