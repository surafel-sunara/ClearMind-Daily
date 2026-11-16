"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, closeLabel = "Cancel", children }: {
  open: boolean; onClose: () => void; title: string; closeLabel?: string; children: React.ReactNode;
}) {
  const panel = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = panel.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return <dialog ref={panel} className="modal" aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <div className="modal-heading">
      <h2 id={titleId}>{title}</h2>
      <button type="button" className="button button-outline" onClick={onClose}><X aria-hidden="true" /> {closeLabel}</button>
    </div>
    {children}
  </dialog>;
}
