"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const POLL_MS = 60_000;

export function usePendingAdsCount(isAdmin: boolean): number {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    if (!isAdmin) {
      setCount(0);
      return;
    }

    const { count: pending, error } = await supabase
      .from("ads")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    if (!error && pending != null) setCount(pending);
  }, [isAdmin]);

  useEffect(() => {
    void refresh();
    if (!isAdmin) return;

    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [isAdmin, refresh, pathname]);

  useEffect(() => {
    if (!isAdmin) return;

    const onChanged = () => void refresh();
    window.addEventListener("yaddii:pending-ads-changed", onChanged);
    return () => window.removeEventListener("yaddii:pending-ads-changed", onChanged);
  }, [isAdmin, refresh]);

  return count;
}

export function notifyPendingAdsChanged(): void {
  window.dispatchEvent(new Event("yaddii:pending-ads-changed"));
}
