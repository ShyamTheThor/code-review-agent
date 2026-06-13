import { Search, Bell, User } from "lucide-react";
import { useHealth } from "@/hooks/useHealth";

export default function Navbar() {
  const { status } = useHealth();

  const getStatusDisplay = () => {
    switch (status) {
      case 'loading':
        return { icon: "🟡", label: "Checking...", color: "text-amber-500" };
      case 'online':
        return { icon: "🟢", label: "Online", color: "text-emerald-500" };
      case 'offline':
        return { icon: "🔴", label: "Offline", color: "text-red-500" };
      case 'error':
        return { icon: "🔴", label: "Error", color: "text-red-500" };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <header 
      className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10"
      role="banner"
    >
      <div className="flex items-center gap-6 flex-1 max-w-2xl">
        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/50 border border-zinc-800 rounded-full shrink-0">
          <span className="text-[10px]" aria-hidden="true">{statusInfo.icon}</span>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        <div className="relative w-full group max-w-md">
          <label htmlFor="top-search" className="sr-only">Search reviews</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" aria-hidden="true" />
          <input 
            id="top-search"
            type="text" 
            placeholder="Search reviews, issues, or code..." 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors relative outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="View notifications"
        >
          <Bell className="size-5" aria-hidden="true" />
          <span className="absolute top-2 right-2 size-2 bg-indigo-500 rounded-full border-2 border-zinc-950" aria-label="New notifications available"></span>
        </button>
        
        <div className="h-8 w-px bg-zinc-800 mx-2" aria-hidden="true" />

        <div className="flex items-center gap-3 pl-2 group cursor-pointer" tabIndex={0} role="button" aria-label="User menu">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">Alex Chen</p>
            <p className="text-xs text-zinc-500">Senior Engineer</p>
          </div>
          <div className="size-9 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 overflow-hidden group-hover:border-zinc-500 transition-colors">
            <User className="size-5 text-zinc-400 group-hover:text-zinc-200" aria-hidden="true" />
          </div>
        </div>
      </div>
    </header>
  );
}
