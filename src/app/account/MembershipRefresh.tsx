"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function MembershipRefresh() {
  const router = useRouter();
  useEffect(() => {
    let attempts = 0;
    const timer = window.setInterval(() => {
      router.refresh();
      if (++attempts >= 5) window.clearInterval(timer);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [router]);

  return <button type="button" className="button button-outline" onClick={() => router.refresh()}>
    <RefreshCw aria-hidden="true" /> Check Membership
  </button>;
}
