"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  MODERATION_NOTES_CHANGE_EVENT,
  countUnreadModerationNotes,
  type ModerationNoteAd,
} from "@/lib/moderation-note-seen";

const POLL_MS = 45_000;
const REALTIME_CHANNEL = "yaddii-seller-moderation-notes";

type Listener = () => void;

let unreadCount = 0;
let syncUserId: string | null = null;
let syncRefCount = 0;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let realtimeChannel: RealtimeChannel | null = null;
let onChangeHandler: (() => void) | null = null;
const storeListeners = new Set<Listener>();

function emitStore() {
  for (const listener of storeListeners) listener();
}

function getSnapshot() {
  return unreadCount;
}

function subscribeStore(listener: Listener) {
  storeListeners.add(listener);
  return () => storeListeners.delete(listener);
}

async function refreshUnreadCount(userId: string) {
  const { data, error } = await supabase
    .from("ads")
    .select("id, status, moderation_note, moderation_note_at")
    .eq("user_id", userId)
    .eq("status", "pending");

  if (error) return;

  const next = countUnreadModerationNotes((data ?? []) as ModerationNoteAd[]);
  if (next !== unreadCount) {
    unreadCount = next;
    emitStore();
  }
}

function stopSync() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (typeof window !== "undefined" && onChangeHandler) {
    window.removeEventListener(MODERATION_NOTES_CHANGE_EVENT, onChangeHandler);
    onChangeHandler = null;
  }
  if (realtimeChannel) {
    void supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  syncUserId = null;
}

function startSync(userId: string) {
  syncUserId = userId;
  const runRefresh = () => {
    if (syncUserId) void refreshUnreadCount(syncUserId);
  };

  void runRefresh();
  pollTimer = setInterval(runRefresh, POLL_MS);

  onChangeHandler = runRefresh;
  window.addEventListener(MODERATION_NOTES_CHANGE_EVENT, runRefresh);

  try {
    realtimeChannel = supabase
      .channel(`${REALTIME_CHANNEL}:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ads",
          filter: `user_id=eq.${userId}`,
        },
        runRefresh,
      )
      .subscribe();
  } catch {
    realtimeChannel = null;
  }
}

function acquireSync(userId: string): () => void {
  syncRefCount += 1;
  if (syncRefCount === 1 || syncUserId !== userId) {
    stopSync();
    startSync(userId);
  }

  return () => {
    syncRefCount -= 1;
    if (syncRefCount <= 0) {
      syncRefCount = 0;
      stopSync();
      unreadCount = 0;
      emitStore();
    }
  };
}

/** Unread admin moderation notes on the signed-in seller's pending ads. */
export function useUnreadModerationNotesCount(userId: string | null | undefined): number {
  const pathname = usePathname();
  const count = useSyncExternalStore(subscribeStore, getSnapshot, () => 0);

  useEffect(() => {
    if (!userId) return;
    return acquireSync(userId);
  }, [userId]);

  useEffect(() => {
    if (userId) void refreshUnreadCount(userId);
  }, [userId, pathname]);

  return userId ? count : 0;
}
