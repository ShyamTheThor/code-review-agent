import { useHistory } from "@/hooks/useHistory";
import HistoryCard from "@/components/history/HistoryCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { History as HistoryIcon, Search, AlertCircle, Inbox } from "lucide-react";
import { useState } from "react";

export default function HistoryPage() {
  const { items, loading, error } = useHistory();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = items.filter(item => 
    item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.language.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <HistoryIcon className="size-8 text-indigo-500" />
            Review History
          </h1>
          <p className="text-zinc-500 mt-1">Manage and revisit your previous code analysis sessions.</p>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
          />
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-center">
          <AlertCircle className="size-12 text-red-500 mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-red-400">Connection Error</h3>
          <p className="text-sm text-red-400/70 max-w-xs mx-auto mt-2">
            {error}. Please check your connection or try again later.
          </p>
        </div>
      ) : loading ? (
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[88px] w-full" />
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-dashed border-zinc-800 text-center">
          <div className="size-16 rounded-full bg-zinc-900 flex items-center justify-center mb-6 border border-zinc-800">
            <Inbox className="size-8 text-zinc-600" />
          </div>
          <h3 className="text-xl font-semibold text-zinc-300">
            {searchTerm ? "No matches found" : "No history yet"}
          </h3>
          <p className="text-sm text-zinc-500 max-w-xs mx-auto mt-2">
            {searchTerm 
              ? "We couldn't find any reviews matching your search criteria." 
              : "Start by submitting your first code snippet in the Review Workspace."}
          </p>
        </div>
      )}
    </div>
  );
}
