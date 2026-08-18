import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message = "Request timed out",
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Read JWT from localStorage — instant, no supabase-js auth lock. */
export function readStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("sb-") || !key.endsWith("-auth-token")) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as {
        access_token?: string;
        currentSession?: { access_token?: string };
      };
      if (typeof parsed.access_token === "string" && parsed.access_token) {
        return parsed.access_token;
      }
      const nested = parsed.currentSession?.access_token;
      if (typeof nested === "string" && nested) return nested;
    } catch {
      continue;
    }
  }
  return null;
}

/** Prefer getSession over getUser — avoids auth lock hangs on cold start. */
export async function getSessionUser(ms = 8_000): Promise<User | null> {
  const { data } = await withTimeout(supabase.auth.getSession(), ms);
  return data.session?.user ?? null;
}

export async function getAccessToken(ms = 8_000): Promise<string> {
  const cached = readStoredAccessToken();
  if (cached) return cached;

  const { data } = await withTimeout(supabase.auth.getSession(), ms);
  const token = data.session?.access_token;
  if (!token) throw new Error("not_authenticated");
  return token;
}
