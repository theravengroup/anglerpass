"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook to poll the unread notification count.
 * Pauses polling when the tab is hidden (Page Visibility API).
 * Returns the count and a refresh function.
 */
export function useUnreadCount(intervalMs = 60_000) {
  const [count, setCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?unread=true&limit=1");
      if (res.ok) {
        const data = await res.json();
        setCount(data.unread_count ?? 0);
      }
    } catch {
      // Network error — keep previous count
    }
  }, []);

  useEffect(() => {
    function startPolling() {
      // Fetch immediately, then start interval
      refresh();
      timerRef.current = setInterval(refresh, intervalMs);
    }

    function stopPolling() {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    function handleVisibility() {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    }

    // Start polling if visible
    if (!document.hidden) {
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh, intervalMs]);

  return { count, refresh };
}
