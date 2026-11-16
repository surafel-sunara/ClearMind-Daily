"use client";

import { useState } from "react";
import { Copy, Share2 } from "lucide-react";

export function ShareScoreButton({ summary, path }: { summary: string; path: string }) {
  const [status, setStatus] = useState("");
  const link = () => new URL(path, window.location.origin).href;
  const text = () => summary + " Play free: " + link();

  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text());
      setStatus("Result copied.");
    } catch {
      setStatus("Copy the result from the box below.");
    }
  }

  function facebook() {
    const target = new URL("https://www.facebook.com/sharer/sharer.php");
    target.searchParams.set("u", link());
    target.searchParams.set("quote", summary);
    window.open(target.href, "_blank", "noopener,noreferrer");
  }

  return <div className="share-actions">
    <div className="controls">
      <button type="button" className="button button-primary" onClick={copy}><Copy aria-hidden="true" /> Copy Result</button>
      <button type="button" className="button button-outline" onClick={facebook}><Share2 aria-hidden="true" /> Share on Facebook</button>
    </div>
    <span role="status" className="share-status">{status}</span>
    {status.startsWith("Copy the result") && <textarea aria-label="Your result" readOnly className="result-text"
      onFocus={(event) => event.currentTarget.select()} value={text()} />}
  </div>;
}
