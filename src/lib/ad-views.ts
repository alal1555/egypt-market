import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "yaddii:ad-view-ts";
const COOLDOWN_MS = 30 * 60 * 1000;

/** Count one view per browser session per ad (30 min cooldown). Returns new total if incremented. */
export async function recordAdView(adId: string): Promise<number | null> {
  if (typeof window === "undefined" || !adId) return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const map: Record<string, number> = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    const last = map[adId] ?? 0;
    if (Date.now() - last < COOLDOWN_MS) return null;

    const { data, error } = await supabase.rpc("increment_ad_view", { p_ad_id: adId });
    if (error) {
      console.warn("[ad-views]", error.message);
      return null;
    }

    map[adId] = Date.now();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));

    const count = typeof data === "number" ? data : Number(data);
    return Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
}
