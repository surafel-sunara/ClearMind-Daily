"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Modal } from "./Modal";

export function ConfirmButton({
  onConfirm, disabled, label = "Restart Game", description = "This clears the moves you’ve made in this game.",
}: {
  onConfirm: () => void; disabled?: boolean; label?: string; description?: string;
}) {
  const [open, setOpen] = useState(false);

  return <>
    <button type="button" className="button button-outline" disabled={disabled} onClick={() => setOpen(true)}>
      <RotateCcw aria-hidden="true" /> {label}
    </button>
    <Modal open={open} onClose={() => setOpen(false)} title={label + "?"}>
      <p>{description}</p>
      <button type="button" className="button button-primary modal-confirm" onClick={() => { setOpen(false); onConfirm(); }}>
        <RotateCcw aria-hidden="true" /> {label}
      </button>
    </Modal>
  </>;
}
