/** Public home feed — direct REST to avoid supabase-js auth lock on cold start. */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type HomeAd = {
  id: string;
  title: string;
  price: number;
  location: string;
  category_slug: string;
  images: string[];
  status: string;
  created_at: string;
  attributes?: Record<string, unknown>;
};

export type HomeFeedData = {
  ads: HomeAd[];
  totalActive: number;
  makesMap: Record<number, string>;
  modelsMap: Record<number, string>;
};

function restHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    Accept: "application/json",
    ...extra,
  };
}

function parseTotalFromContentRange(header: string | null, fallback: number): number {
  if (!header) return fallback;
  const match = header.match(/\/(\d+|\*)/);
  if (!match || match[1] === "*") return fallback;
  const total = Number.parseInt(match[1], 10);
  return Number.isFinite(total) ? total : fallback;
}

export async function fetchHomeFeed(options: {
  limit: number;
  signal?: AbortSignal;
}): Promise<HomeFeedData> {
  const { limit, signal } = options;

  const adsUrl =
    `${supabaseUrl}/rest/v1/ads` +
    `?select=*&status=eq.active&order=created_at.desc&limit=${limit}`;

  const [adsRes, makesRes, modelsRes] = await Promise.all([
    fetch(adsUrl, {
      headers: restHeaders({ Prefer: "count=exact" }),
      signal,
    }),
    fetch(`${supabaseUrl}/rest/v1/makes?select=id,name`, {
      headers: restHeaders(),
      signal,
    }),
    fetch(`${supabaseUrl}/rest/v1/models?select=id,name`, {
      headers: restHeaders(),
      signal,
    }),
  ]);

  if (!adsRes.ok) {
    throw new Error(`Failed to load ads (${adsRes.status})`);
  }
  if (!makesRes.ok) {
    throw new Error(`Failed to load makes (${makesRes.status})`);
  }
  if (!modelsRes.ok) {
    throw new Error(`Failed to load models (${modelsRes.status})`);
  }

  const ads = (await adsRes.json()) as HomeAd[];
  const makes = (await makesRes.json()) as { id: number; name: string }[];
  const models = (await modelsRes.json()) as { id: number; name: string }[];

  return {
    ads,
    totalActive: parseTotalFromContentRange(adsRes.headers.get("content-range"), ads.length),
    makesMap: Object.fromEntries(makes.map((m) => [m.id, m.name])),
    modelsMap: Object.fromEntries(models.map((m) => [m.id, m.name])),
  };
}
