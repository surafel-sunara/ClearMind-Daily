"use client";

import { useEffect, useRef, useState } from "react";

import { adClient as client, adSlots as slots, isAdClientConfigured } from "@/lib/ads";

type Format = keyof typeof slots;
type Size = { width: number; height: number };

function slotSize(format: Format, available: number): Size | undefined {
  if (format === "rectangle") return available >= 300 ? { width: 300, height: 250 } : undefined;
  if (available >= 728) return { width: 728, height: 90 };
  if (available >= 468) return { width: 468, height: 60 };
  if (available >= 320) return { width: 320, height: 50 };
  if (available >= 250) return { width: 250, height: 50 };
}

function Unit({ format }: { format: Format }) {
  const container = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);
  const [size, setSize] = useState<Size>();

  useEffect(() => {
    if (size || !container.current) return;
    const element = container.current;
    const measure = () => {
      const valid = slotSize(format, element.clientWidth);
      if (valid) setSize(valid);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, [format, size]);

  useEffect(() => {
    if (!size || pushed.current) return;
    pushed.current = true;
    const publisher = window as typeof window & { adsbygoogle?: Record<string, never>[] };
    try {
      (publisher.adsbygoogle ??= []).push({});
    } catch {
      // The reserved area also accommodates ad blockers and unfilled units.
    }
  }, [size]);

  return <aside className={"ad-shell ad-" + format} aria-label="Advertisement">
    <span>Advertisement</span>
    <div className="ad-space" ref={container}>
      {size && <ins className="adsbygoogle" style={{ display: "inline-block", width: size.width, height: size.height }}
        data-ad-client={client} data-ad-slot={slots[format]} />}
    </div>
  </aside>;
}

export function AdSlot({ format = "leaderboard", isPro }: { format?: Format; isPro: boolean }) {
  if (isPro || !isAdClientConfigured() || !/^\d+$/.test(slots[format])) return null;
  return <Unit format={format} />;
}
