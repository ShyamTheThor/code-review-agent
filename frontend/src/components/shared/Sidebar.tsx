import { NavLink, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Code2, 
  History, 
  BrainCircuit,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/", ariaLabel: "Go to Dashboard" },
  { icon: Code2, label: "Review", href: "/review", ariaLabel: "Open Review Workspace" },
  { icon: History, label: "History", href: "/history", ariaLabel: "View Review History" },
  { icon: BrainCircuit, label: "Memory", href: "/memory", ariaLabel: "Open Memory Dashboard" },
];

export default function Sidebar() {
  return (
    <aside 
      className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full sticky top-0 z-20"
      aria-label="Main Navigation"
    >
      <div className="p-6">
        <Link 
          to="/" 
          className="flex items-center gap-2 font-bold text-xl tracking-tight text-white outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
          aria-label="AI Reviewer Home"
        >
          <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Code2 className="size-5 text-white" aria-hidden="true" />
          </div>
          <span>AI Reviewer</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            aria-label={item.ariaLabel}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between px-3 py-2 rounded-md transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                isActive 
                  ? "bg-zinc-900 text-white shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50"
              )
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="font-medium text-sm">{item.label}</span>
            </div>
            <ChevronRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800 mt-auto">
        <div className="rounded-xl bg-zinc-900/50 p-4 border border-zinc-800/50">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Pro Plan</p>
          <p className="text-sm text-zinc-300 mb-3">Unlock unlimited code reviews.</p>
          <button className="w-full py-2 bg-white text-zinc-950 text-xs font-bold rounded-md hover:bg-zinc-200 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white outline-none">
            Upgrade Now
          </button>
        </div>
      </div>
    </aside>
  );
}
