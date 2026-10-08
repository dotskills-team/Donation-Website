"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/client";
import { subscribeRealtime } from "@/lib/realtime-client";

/** Fetches `url` and refetches whenever the server pushes a realtime event (plus a 30s safety poll). */
export function useLive<T>(url: string | null) {
  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    api<T>(url)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [url, tick]);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    const unsub = subscribeRealtime(bump);
    const poll = setInterval(bump, 30_000);
    return () => {
      unsub();
      clearInterval(poll);
    };
  }, []);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading: url !== null && data === undefined && !error, refresh };
}
