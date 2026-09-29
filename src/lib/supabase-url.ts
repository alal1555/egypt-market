/** Supabase project root URL only — not the REST endpoint (`/rest/v1`). */
export function normalizeSupabaseProjectUrl(raw: string | undefined): string {
  if (!raw?.trim()) return "";

  let url = raw.trim().replace(/\/+$/, "");
  url = url.replace(/\/rest\/v1\/?$/i, "");
  return url.replace(/\/+$/, "");
}
