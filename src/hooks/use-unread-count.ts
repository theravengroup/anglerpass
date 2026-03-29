"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook to poll the unread notification count.
 * Returns the count and a refresh function.
 */
export function useUnreadCount(intervalMs = 60_000) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?unread=true&limit=1");
      if (res.ok) {
        const data = await res.json();
        setCount(data.unread_count ?? 0);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { count, refresh };
}
