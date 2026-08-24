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

export function parseAuthHash(): {
  accessToken: string;
  refreshToken: string;
  type: string | null;
} | null {
  if (typeof window === "undefined" || !window.location.hash) return null;

  const params = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return null;

  return {
    accessToken,
    refreshToken,
    type: params.get("type"),
  };
}

export async function applyAuthHashSession(): Promise<string | null> {
  const parsed = parseAuthHash();
  if (!parsed) return null;

  const { data, error } = await withTimeout(
    supabase.auth.setSession({
      access_token: parsed.accessToken,
      refresh_token: parsed.refreshToken,
    }),
    15_000,
    "Session setup timed out",
  );
  if (error) throw error;

  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  return data.session?.access_token ?? parsed.accessToken;
}

export type AuthCallbackResult =
  | { ok: true; accessToken: string; flow: "email" | "recovery" | "signin" }
  | { ok: false; error: string; redirectToReset?: boolean };

function getOtpTypeFromSearch(search: URLSearchParams): string {
  return search.get("type") ?? "email";
}

/** Handle Supabase email links (token_hash query, PKCE code, or implicit hash). */
export async function completeAuthCallback(
  search: URLSearchParams,
): Promise<AuthCallbackResult> {
  const flow = search.get("type");
  const parsed = parseAuthHash();

  if (parsed?.type === "recovery" || flow === "recovery") {
    return { ok: false, error: "recovery_redirect", redirectToReset: true };
  }

  const tokenHash = search.get("token_hash");
  if (tokenHash) {
    const otpType = getOtpTypeFromSearch(search);
    const { data, error } = await withTimeout(
      supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType as "signup" | "email" | "magiclink",
      }),
      15_000,
      "Email verification timed out",
    );
    if (error) throw error;

    const accessToken = data.session?.access_token;
    if (!accessToken) throw new Error("email_verify_no_session");

    window.history.replaceState(null, "", window.location.pathname);
    const isEmailFlow =
      otpType === "signup" || otpType === "email" || otpType === "magiclink" || flow === "email";
    return {
      ok: true,
      accessToken,
      flow: isEmailFlow ? "email" : "signin",
    };
  }

  const code = search.get("code");
  if (code) {
    const { data, error } = await withTimeout(
      supabase.auth.exchangeCodeForSession(code),
      15_000,
      "Email verification timed out",
    );
    if (error) throw error;

    const accessToken = data.session?.access_token;
    if (!accessToken) throw new Error("email_verify_no_session");

    window.history.replaceState(null, "", window.location.pathname);
    return { ok: true, accessToken, flow: flow === "email" ? "email" : "signin" };
  }

  const accessToken = await applyAuthHashSession();
  if (!accessToken) {
    return { ok: false, error: "invalid_link" };
  }

  const hashType = parsed?.type;
  if (hashType === "signup" || hashType === "email" || flow === "email") {
    return { ok: true, accessToken, flow: "email" };
  }

  return { ok: true, accessToken, flow: "signin" };
}

/** If Supabase sends tokens to `/` instead of `/auth/callback`, forward once. */
export function redirectAuthParamsToCallback(): boolean {
  if (typeof window === "undefined") return false;
  if (window.location.pathname === "/auth/callback") return false;

  const search = window.location.search;
  const hash = window.location.hash;
  const params = new URLSearchParams(search);
  const hasQueryAuth = params.has("token_hash") || params.has("code");
  const hasHashAuth = hash.includes("access_token=");

  if (!hasQueryAuth && !hasHashAuth) return false;

  window.location.replace(`/auth/callback${search}${hash}`);
  return true;
}

export async function getAccessToken(ms = 8_000): Promise<string> {
  const cached = readStoredAccessToken();
  if (cached) return cached;

  const { data } = await withTimeout(supabase.auth.getSession(), ms);
  const token = data.session?.access_token;
  if (!token) throw new Error("not_authenticated");
  return token;
}

/** Remove Supabase auth tokens from localStorage (last-resort sign-out). */
export function clearStoredAuthTokens(): void {
  if (typeof window === "undefined") return;

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith("sb-") && key.endsWith("-auth-token")) {
      localStorage.removeItem(key);
    }
  }
}

/** Sign out without hanging when the auth client lock is contended. */
export async function signOutSafely(ms = 8_000): Promise<void> {
  try {
    await withTimeout(supabase.auth.signOut(), ms, "Sign out timed out");
    return;
  } catch {
    // Global sign-out can hang if onAuthStateChange still holds the auth lock.
  }

  try {
    await withTimeout(supabase.auth.signOut({ scope: "local" }), 3_000);
  } catch {
    clearStoredAuthTokens();
  }
}
