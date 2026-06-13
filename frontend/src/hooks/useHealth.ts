import { useState, useEffect } from "react";
import { healthService } from "@/services/health.service";

export type HealthStatus = 'loading' | 'online' | 'offline' | 'error';

export function useHealth() {
  const [status, setStatus] = useState<HealthStatus>('loading');

  const checkHealth = async () => {
    setStatus('loading');
    try {
      const data = await healthService.getHealth();
      if (data.status === 'ok') {
        setStatus('online');
      } else {
        setStatus('error');
      }
    } catch (err: any) {
      // If it's a network error (no response)
      if (!err.status) {
        setStatus('offline');
      } else {
        setStatus('error');
      }
    }
  };

  useEffect(() => {
    checkHealth();
    // Re-check every 60 seconds
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  return { status, checkHealth };
}
