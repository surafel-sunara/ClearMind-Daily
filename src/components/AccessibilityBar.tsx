"use client";

import { createContext, useContext, useEffect } from "react";
import { Contrast, Volume2, VolumeX } from "lucide-react";
import { decodeLocal, useStoredText, writeLocal } from "@/lib/browserStorage";
import { playChime } from "@/lib/audio";
import { preferenceKey as storageKey } from "@/lib/accessibility";

const sizes = ["normal", "large", "extra"] as const;
type TextSize = typeof sizes[number];
type Preferences = { size: TextSize; contrast: boolean; sound: boolean };
const labels: Record<TextSize, string> = { normal: "Normal", large: "Large", extra: "Extra Large" };
const defaults: Preferences = { size: "normal", contrast: false, sound: false };
const Context = createContext({ preferences: defaults, setPreferences: (() => {}) as (next: Preferences) => void });
export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const stored = decodeLocal<Partial<Preferences>>(useStoredText(storageKey), {});
  const preferences: Preferences = {
    size: sizes.includes(stored.size as TextSize) ? stored.size! : "normal",
    contrast: stored.contrast === true,
    sound: stored.sound === true,
  };
  const { size, contrast } = preferences;
  useEffect(() => {
    document.documentElement.dataset.textSize = size;
    document.documentElement.dataset.contrast = contrast ? "high" : "normal";
  }, [size, contrast]);

  function setPreferences(next: Preferences) {
    writeLocal(storageKey, JSON.stringify(next));
  }

  return <Context.Provider value={{ preferences, setPreferences }}>{children}</Context.Provider>;
}

export function useGameSound() {
  const { preferences } = useContext(Context);
  return (kind: "tap" | "win" = "tap") => playChime(kind, preferences.sound);
}

export function AccessibilityBar() {
  const { preferences, setPreferences } = useContext(Context);
  return <div className="access-bar">
    <div className="frame access-inner">
      <div className="access-sizes" role="group" aria-label="Text size">
        <span className="access-label">Text size</span>
        <div className="segments">
          {sizes.map((size) => <button type="button" key={size} aria-pressed={preferences.size === size}
            onClick={() => setPreferences({ ...preferences, size })}>
            <span aria-hidden="true" className={"type-sample " + size}>A</span>{labels[size]}
          </button>)}
        </div>
      </div>
      <div className="access-actions">
        <button className="access-toggle" type="button" aria-pressed={preferences.contrast}
          onClick={() => setPreferences({ ...preferences, contrast: !preferences.contrast })}>
          <Contrast aria-hidden="true" /> High contrast
        </button>
        <button className="access-toggle" type="button" aria-pressed={preferences.sound}
          onClick={() => {
            const sound = !preferences.sound;
            setPreferences({ ...preferences, sound });
            if (sound) playChime("tap", true);
          }}>
          {preferences.sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
          Sound {preferences.sound ? "on" : "off"}
        </button>
      </div>
    </div>
  </div>;
}
