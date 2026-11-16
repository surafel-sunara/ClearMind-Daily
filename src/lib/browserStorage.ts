"use client";

import { useCallback, useSyncExternalStore } from "react";

const memory = new Map<string, string>();
const storageEvent = "clearmind-storage";

export function readLocal(key: string): string | null {
  if (memory.has(key)) return memory.get(key)!;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocal(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    memory.delete(key);
  } catch {
    memory.set(key, value);
  }
  window.dispatchEvent(new CustomEvent(storageEvent, { detail: key }));
}

export function useStoredText(key: string): string | null | undefined {
  const subscribe = useCallback((update: () => void) => {
    function changed(event: Event) {
      const affected = event.type === "storage" ? (event as StorageEvent).key : (event as CustomEvent<string>).detail;
      if (!affected || affected === key) update();
    }
    window.addEventListener("storage", changed);
    window.addEventListener(storageEvent, changed);
    return () => {
      window.removeEventListener("storage", changed);
      window.removeEventListener(storageEvent, changed);
    };
  }, [key]);
  return useSyncExternalStore(subscribe, () => readLocal(key), () => undefined);
}

export function decodeLocal<T>(value: string | null | undefined, fallback: T): T {
  try {
    return value ? (JSON.parse(value) as T | null) ?? fallback : fallback;
  } catch {
    return fallback;
  }
}
