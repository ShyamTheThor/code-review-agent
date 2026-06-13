import { useState, useEffect } from "react";
import { toast } from "sonner";
import { memoryService } from "@/services/memory.service";
import type { MemoryInsights } from "@/types/memory.types";

export function useMemory() {
  const [data, setData] = useState<MemoryInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const insights = await memoryService.getMemoryInsights();
      setData(insights);
    } catch (err: any) {
      const msg = err.message || "Failed to fetch memory insights";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refresh: fetchData };
}
