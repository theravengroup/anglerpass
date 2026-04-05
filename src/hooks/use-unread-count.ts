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
  const fetchingRef = useRef(false);

  const refresh = useCallback(async () => {
    // Prevent concurrent fetches from overlapping interval ticks
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const res = await fetch("/api/notifications?unread=true&limit=1");
      if (res.ok) {
        const data = await res.json();
        setCount(data.unread_count ?? 0);
      }
    } catch {
      // Network error — keep previous count
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    function stopPolling() {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    function startPolling() {
      // Always clear any existing interval before starting a new one
      stopPolling();
      if (cancelled) return;
      refresh();
      timerRef.current = setInterval(refresh, intervalMs);
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
      cancelled = true;
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh, intervalMs]);

  return { count, refresh };
}
