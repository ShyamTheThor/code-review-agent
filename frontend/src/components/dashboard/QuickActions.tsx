import { Link } from "react-router-dom";
import { Plus, History, BrainCircuit } from "lucide-react";

export default function QuickActions() {
  const actions = [
    { 
      label: "New Review", 
      icon: Plus, 
      href: "/review", 
      description: "Start a fresh analysis",
      bg: "bg-indigo-600/10",
      border: "border-indigo-600/20",
      hover: "hover:bg-indigo-600/20",
      text: "text-indigo-400"
    },
    { 
      label: "View History", 
      icon: History, 
      href: "/history", 
      description: "Revisit past reviews",
      bg: "bg-zinc-800/50",
      border: "border-zinc-800",
      hover: "hover:bg-zinc-800",
      text: "text-zinc-400"
    },
    { 
      label: "Memory Insights", 
      icon: BrainCircuit, 
      href: "/memory", 
      description: "Check your growth",
      bg: "bg-zinc-800/50",
      border: "border-zinc-800",
      hover: "hover:bg-zinc-800",
      text: "text-zinc-400"
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {actions.map((action) => (
        <Link 
          key={action.href}
          to={action.href}
          className={`flex items-start gap-4 p-4 rounded-xl border ${action.bg} ${action.border} ${action.hover} transition-all group`}
        >
          <div className={`p-2 rounded-lg bg-zinc-950 border border-zinc-800 shrink-0 group-hover:border-zinc-700 transition-colors`}>
            <action.icon className={`size-5 ${action.text}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{action.label}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{action.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
