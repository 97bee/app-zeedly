"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "zeedly:watchlist";

function readWatchlist(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function writeWatchlist(set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

/**
 * Client-side watchlist of creatorIds. Backed by localStorage and synced
 * across tabs via the `storage` event so a toggle in one tab reflects in
 * another.
 */
export const useWatchlist = () => {
  const [ids, setIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setIds(readWatchlist());
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setIds(readWatchlist());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback((creatorId: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(creatorId)) next.delete(creatorId);
      else next.add(creatorId);
      writeWatchlist(next);
      return next;
    });
  }, []);

  const has = useCallback((creatorId: string) => ids.has(creatorId), [ids]);

  return { ids, has, toggle };
};
