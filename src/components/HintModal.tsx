"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Lightbulb, Sparkles } from "lucide-react";
import { Modal } from "./Modal";

export function HintModal({ isPro, disabled, onHint }: { isPro: boolean; disabled?: boolean; onHint: () => void }) {
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState(5);
  const callback = useRef(onHint);

  useEffect(() => { callback.current = onHint; }, [onHint]);
  useEffect(() => {
    if (!open) return;
    const finishAt = Date.now() + 5000;
    const countdown = window.setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((finishAt - Date.now()) / 1000)));
    }, 200);
    const reveal = window.setTimeout(() => {
      setOpen(false);
      callback.current();
    }, 5000);
    return () => { window.clearInterval(countdown); window.clearTimeout(reveal); };
  }, [open]);

  return <>
    <button type="button" className="button button-hint" disabled={disabled}
      onClick={() => {
        if (isPro) onHint();
        else { setRemaining(5); setOpen(true); }
      }}>
      <Lightbulb aria-hidden="true" /> Get a Hint
    </button>
    <Modal open={open} onClose={() => setOpen(false)} title="Get a Hint">
      <p>Your hint will appear in <strong aria-hidden="true">{remaining}</strong><span className="sr-only">five</span> seconds.</p>
      <div className="hint-progress" role="progressbar" aria-label="Time until hint" aria-valuemin={0} aria-valuemax={5} aria-valuenow={5 - remaining}>
        <span style={{ width: ((5 - remaining) * 20) + "%" }} />
      </div>
      <aside className="hint-sponsor">
        <Sparkles aria-hidden="true" />
        <div>
          <h3>Ad-Free Club</h3>
          <p>Members get instant, unlimited hints.</p>
          <Link href="/club" className="text-link" onClick={() => setOpen(false)}>Explore the Club</Link>
        </div>
      </aside>
    </Modal>
  </>;
}
