"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const POLL_MS = 30_000;
const CHANGE_EVENT = "yaddii:pending-ads-changed";
const REALTIME_CHANNEL = "yaddii-admin-pending-ads";

type Listener = () => void;

let pendingCount = 0;
let syncRefCount = 0;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let realtimeChannel: RealtimeChannel | null = null;
let onChangeHandler: (() => void) | null = null;
const storeListeners = new Set<Listener>();

function emitStore() {
  for (const listener of storeListeners) listener();
}

function getSnapshot() {
  return pendingCount;
}

function subscribeStore(listener: Listener) {
  storeListeners.add(listener);
  return () => storeListeners.delete(listener);
}

async function refreshPendingCount() {
  const { count, error } = await supabase
    .from("ads")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (!error && count != null && count !== pendingCount) {
    pendingCount = count;
    emitStore();
  }
}

function stopSync() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (typeof window !== "undefined" && onChangeHandler) {
    window.removeEventListener(CHANGE_EVENT, onChangeHandler);
    onChangeHandler = null;
  }
  if (realtimeChannel) {
    void supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}

function startSync() {
  const runRefresh = () => void refreshPendingCount();

  void runRefresh();
  pollTimer = setInterval(runRefresh, POLL_MS);

  onChangeHandler = runRefresh;
  window.addEventListener(CHANGE_EVENT, runRefresh);

  try {
    realtimeChannel = supabase
      .channel(REALTIME_CHANNEL)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ads" },
        runRefresh,
      )
      .subscribe();
  } catch {
    realtimeChannel = null;
  }
}

function acquireSync(): () => void {
  syncRefCount += 1;
  if (syncRefCount === 1) startSync();

  return () => {
    syncRefCount -= 1;
    if (syncRefCount <= 0) {
      syncRefCount = 0;
      stopSync();
      pendingCount = 0;
      emitStore();
    }
  };
}

/** Shared pending-ads count for navbar + bottom nav (one poll, one realtime channel). */
export function usePendingAdsCount(userRole: string | null): number {
  const isAdmin = userRole === "admin" || userRole === "super";
  const pathname = usePathname();
  const count = useSyncExternalStore(subscribeStore, getSnapshot, () => 0);

  useEffect(() => {
    if (!isAdmin) return;
    return acquireSync();
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) void refreshPendingCount();
  }, [isAdmin, pathname]);

  return isAdmin ? count : 0;
}

export function notifyPendingAdsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
