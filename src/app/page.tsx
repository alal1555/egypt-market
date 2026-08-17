"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdCard from "@/components/AdCard";
import CategoryBar from "@/components/CategoryBar";
import { extractSpecs } from "@/lib/utils";
import { HOME_REFRESH_EVENT } from "@/lib/home";
import { useTranslation } from "@/i18n/LocaleProvider";

/** Latest active ads shown on home — full catalog lives on /search */
const HOME_RECENT_LIMIT = 36;
const FETCH_TIMEOUT_MS = 15_000;

interface Ad {
  id: string; title: string; price: number; location: string; category_slug: string;
  images: string[]; status: string; created_at: string; attributes?: any;
}

function HomeContent() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [totalActive, setTotalActive] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [makesMap, setMakesMap] = useState<Record<number, string>>({});
  const [modelsMap, setModelsMap] = useState<Record<number, string>>({});
  const { t } = useTranslation();

  // Refetch when navigating to home, on logo re-click, or after refreshKey bump
  useEffect(() => {
    if (pathname !== "/") return;

    let cancelled = false;

    const loadHomeData = async () => {
      setLoading(true);
      setFetchError(null);

      const timeout = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error("Request timed out")), FETCH_TIMEOUT_MS);
      });

      try {
        const [adsRes, makesRes, modelsRes] = await Promise.race([
          Promise.all([
            supabase
              .from("ads")
              .select("*", { count: "exact" })
              .eq("status", "active")
              .order("created_at", { ascending: false })
              .limit(HOME_RECENT_LIMIT),
            supabase.from("makes").select("id, name"),
            supabase.from("models").select("id, name"),
          ]),
          timeout,
        ]);

        if (cancelled) return;

        if (adsRes.error) throw adsRes.error;
        if (makesRes.error) throw makesRes.error;
        if (modelsRes.error) throw modelsRes.error;

        setAds(adsRes.data ?? []);
        setTotalActive(adsRes.count ?? adsRes.data?.length ?? 0);
        if (makesRes.data) {
          setMakesMap(Object.fromEntries(makesRes.data.map((m) => [m.id, m.name])));
        }
        if (modelsRes.data) {
          setModelsMap(Object.fromEntries(modelsRes.data.map((m) => [m.id, m.name])));
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load listings";
        setFetchError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadHomeData();

    return () => {
      cancelled = true;
    };
  }, [pathname, refreshKey]);

  // Logo click while already on home
  useEffect(() => {
    const onRefresh = () => setRefreshKey((k) => k + 1);
    window.addEventListener(HOME_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(HOME_REFRESH_EVENT, onRefresh);
  }, []);

  // Browser back/forward cache can restore the page without re-running effects
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted && pathname === "/") setRefreshKey((k) => k + 1);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [pathname]);

  const hasMore = totalActive > ads.length;
  const showFullLoading = loading && ads.length === 0 && !fetchError;

  return (
    <div className="mt-[60px] pt-6 md:mt-16 md:pt-5 w-full min-h-screen">
      <CategoryBar onSelect={(main, sub) => router.push(`/search?main_cat=${main}&sub_cat=${sub}`)} />

      <section className="bg-white px-4 py-4 border-b border-gray-100 text-center">
        <h2 className="text-3xl font-black text-gray-900">
          {t("home.heroPrefix")}{" "}
          <span className="text-[#FF6321]">{t("home.country")}</span>
        </h2>
      </section>

      <main className="mx-auto max-w-[1400px] w-full px-3 py-8 min-h-screen">
        {!loading && !fetchError && ads.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 px-1">
            <div>
              <h3 className="text-lg font-black text-gray-900">{t("home.recentListings")}</h3>
              {hasMore && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {t("home.showingLatest", { count: ads.length, total: totalActive })}
                </p>
              )}
            </div>
            <Link
              href="/search"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#FF6321] text-white text-sm font-bold hover:bg-[#e85a1e] transition-colors shrink-0"
            >
              {hasMore ? t("home.seeAllListings", { total: totalActive }) : t("home.browseAll")}
            </Link>
          </div>
        )}

        {showFullLoading ? (
          <div className="text-center py-20 text-gray-400">{t("home.loading")}</div>
        ) : !fetchError && ads.length > 0 ? (
          <>
            {loading && (
              <p className="text-center text-xs text-gray-400 mb-4">{t("home.updating")}</p>
            )}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6 items-stretch">
            {ads.map((ad) => (
              <AdCard
                key={ad.id}
                id={ad.id}
                title={ad.title}
                price={String(ad.price)}
                location={ad.location}
                category={ad.category_slug}
                imageUrl={ad.images?.[0]}
                specs={ad.attributes ? extractSpecs(ad.attributes) : {}}
                postedDate={new Date(ad.created_at).toLocaleDateString()}
                makeName={ad.attributes?.make_id ? makesMap[ad.attributes.make_id] : undefined}
                modelName={ad.attributes?.model_id ? modelsMap[ad.attributes.model_id] : undefined}
              />
            ))}
            </div>
          </>
        ) : null}

        {!loading && fetchError && (
          <div className="text-center py-16 text-gray-500">
            <p className="mb-4">{t("home.loadError")}</p>
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#FF6321] text-white text-sm font-bold hover:bg-[#e85a1e]"
            >
              {t("home.retry")}
            </button>
          </div>
        )}

        {!loading && !fetchError && ads.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="mb-4">{t("home.noListings")}</p>
            <Link
              href="/post-ad"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#FF6321] text-white text-sm font-bold hover:bg-[#e85a1e]"
            >
              {t("home.postAd")}
            </Link>
          </div>
        )}

        {!loading && !fetchError && ads.length > 0 && hasMore && (
          <div className="text-center mt-10">
            <Link
              href="/search"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-[#FF6321] text-[#FF6321] text-sm font-bold hover:bg-orange-50 transition-colors"
            >
              {t("home.seeAll")}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
