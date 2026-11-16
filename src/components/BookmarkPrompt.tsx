"use client";

import { Bookmark, X } from "lucide-react";
import { useStoredText, writeLocal } from "@/lib/browserStorage";

const key = "clearmind.bookmark.dismissed";

export function BookmarkPrompt({ firstWin }: { firstWin: boolean }) {
  const choice = useStoredText(key);
  if (!firstWin || choice === undefined || choice === "yes") return null;

  return <aside className="bookmark-prompt">
    <Bookmark aria-hidden="true" />
    <div>
      <strong>Save ClearMind Daily</strong>
      <p>On a computer, press Ctrl+D or Command+D to bookmark this site. On your phone, open the browser menu and look for Bookmark or Add to Home Screen.</p>
    </div>
    <button type="button" className="button button-outline" onClick={() => { writeLocal(key, "yes"); }}>
      <X aria-hidden="true" /> Dismiss
    </button>
  </aside>;
}
