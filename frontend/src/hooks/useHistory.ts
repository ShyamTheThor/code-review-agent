import { useState, useEffect } from "react";
import { toast } from "sonner";
import { historyService } from "@/services/history.service";
import type { HistoryItem, HistoryDetailResponse } from "@/types/history.types";

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await historyService.getHistory();
      setItems(data);
    } catch (err: any) {
      const msg = err.message || "Failed to fetch history";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return { items, loading, error, refresh: fetchHistory };
}

export function useHistoryDetail(id: string | undefined) {
  const [detail, setDetail] = useState<HistoryDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await historyService.getHistoryById(id);
        setDetail(data);
      } catch (err: any) {
        const msg = err.message || "Failed to fetch review details";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  return { detail, loading, error };
}
