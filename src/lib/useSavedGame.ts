"use client";

import { useMemo, useState } from "react";
import { decodeLocal, readLocal, useStoredText, writeLocal } from "./browserStorage";

export function useSavedGame<T>(name: string, initial: () => T) {
  const key = "clearmind.board.v1." + name;
  const [fallback] = useState(initial);
  const saved = useStoredText(key);
  const value = useMemo(() => decodeLocal(saved, fallback), [saved, fallback]);

  function update(next: T) {
    const raw = JSON.stringify(next);
    if (readLocal(key) !== raw) writeLocal(key, raw);
  }

  return [value, update, saved !== undefined] as const;
}

export function wallTime(): number {
  return Date.now();
}

export function elapsed(startedAt: number | null, now = wallTime()): number {
  return startedAt === null ? 0 : Math.max(0, Math.min(2_678_400, Math.round((now - startedAt) / 1000)));
}
