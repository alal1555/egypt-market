/** Client-side "read" state for admin moderation notes (per ad, keyed by note timestamp). */

const STORAGE_KEY = "yaddii:moderationNoteSeen";

export type ModerationNoteAd = {
  id: string;
  status?: string;
  moderation_note?: string | null;
  moderation_note_at?: string | null;
};

export const MODERATION_NOTES_CHANGE_EVENT = "yaddii:moderation-notes-changed";

function loadSeenMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function saveSeenMap(map: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function hasModerationNote(ad: ModerationNoteAd): boolean {
  return Boolean(ad.moderation_note?.trim() && ad.moderation_note_at);
}

export function isModerationNoteUnread(ad: ModerationNoteAd): boolean {
  if (ad.status && ad.status !== "pending") return false;
  if (!hasModerationNote(ad)) return false;
  const seenAt = loadSeenMap()[ad.id];
  if (!seenAt) return true;
  return new Date(ad.moderation_note_at!).getTime() > new Date(seenAt).getTime();
}

export function countUnreadModerationNotes(ads: ModerationNoteAd[]): number {
  return ads.filter(isModerationNoteUnread).length;
}

export function markModerationNoteSeen(adId: string, moderationNoteAt: string): void {
  const map = loadSeenMap();
  map[adId] = moderationNoteAt;
  saveSeenMap(map);
  notifyModerationNotesChanged();
}

export function notifyModerationNotesChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MODERATION_NOTES_CHANGE_EVENT));
}
