"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { decodeLocal, readLocal, useStoredText, writeLocal } from "@/lib/browserStorage";
import { emptyProgress, isBetter, mergeProgress, pendingKey, type Activity, type GameResult, type Progress } from "@/lib/progress";

type ProgressContext = { storageKey: string; signedIn: boolean };
const Context = createContext<ProgressContext>({
  storageKey: "clearmind.progress.v1.guest", signedIn: false,
});

function readProgress(key: string) {
  return decodeLocal<Progress>(readLocal(key), emptyProgress);
}

function saveProgress(key: string, progress: Progress) {
  writeLocal(key, JSON.stringify(progress));
}

export function useProgress() {
  const { storageKey, signedIn } = useContext(Context);
  const raw = useStoredText(storageKey);
  const progress = useMemo(() => decodeLocal<Progress>(raw, emptyProgress), [raw]);

  function record(result: GameResult) {
    const next = mergeProgress(readProgress(storageKey), [result]);
    const key = pendingKey(result);
    if (signedIn && isBetter(next.pending[key], result)) next.pending[key] = result;
    saveProgress(storageKey, next);
  }

  return { progress, record };
}

function ScoreSync() {
  const { storageKey } = useContext(Context);
  useEffect(() => {
    const controller = new AbortController();
    let sending = false;
    const signal = controller.signal;
    let pulled = false;

    async function synchronize() {
      if (sending || signal.aborted) return;
      sending = true;
      try {
        if (!pulled) {
          const response = await fetch("/api/stats", { signal, cache: "no-store" });
          if (!response.ok) return;
          const { results, activity } = await response.json() as { results: GameResult[]; activity: Activity[] };
          pulled = true;
          if (signal.aborted) return;
          saveProgress(storageKey, mergeProgress(readProgress(storageKey), results, activity));
        }
        for (;;) {
          const entries = Object.entries(readProgress(storageKey).pending).slice(0, 50);
          if (!entries.length || signal.aborted) return;
          const response = await fetch("/api/stats", {
            method: "POST", signal, headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ results: entries.map(([, result]) => result) }),
          });
          if (!response.ok || signal.aborted) return;
          const latest = readProgress(storageKey);
          const pending = { ...latest.pending };
          for (const [key, sent] of entries) {
            if (pending[key]?.score === sent.score && pending[key]?.seconds === sent.seconds) delete pending[key];
          }
          saveProgress(storageKey, { ...latest, pending });
        }
      } catch {
        // Pending scores stay on this device and retry on reconnect or a later visit.
      } finally {
        sending = false;
      }
    }

    function onStorage(event: Event) {
      if ((event as CustomEvent<string>).detail === storageKey) void synchronize();
    }
    void synchronize();
    const retry = window.setInterval(() => { void synchronize(); }, 45_000);
    window.addEventListener("online", synchronize);
    window.addEventListener("clearmind-storage", onStorage);
    return () => {
      controller.abort();
      window.clearInterval(retry);
      window.removeEventListener("online", synchronize);
      window.removeEventListener("clearmind-storage", onStorage);
    };
  }, [storageKey]);
  return null;
}

export function ProgressProvider({ userId, syncEnabled, children }: {
  userId?: string;
  syncEnabled: boolean;
  children: React.ReactNode;
}) {
  const signedIn = Boolean(userId);
  const context = { storageKey: "clearmind.progress.v1." + (userId ?? "guest"), signedIn };
  return <Context.Provider value={context}>
    {signedIn && syncEnabled && <ScoreSync />}
    {children}
  </Context.Provider>;
}
