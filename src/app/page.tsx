"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdCard from "@/components/AdCard";
import CategoryBar from "@/components/CategoryBar";
import { extractSpecs } from "@/lib/utils";

/** Latest active ads shown on home — full catalog lives on /search */
const HOME_RECENT_LIMIT = 36;

interface Ad {
  id: string; title: string; price: number; location: string; category_slug: string;
  images: string[]; status: string; created_at: string; attributes?: any;
}

function HomeContent() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [totalActive, setTotalActive] = useState(0);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [makesMap, setMakesMap] = useState<Record<number, string>>({});
  const [modelsMap, setModelsMap] = useState<Record<number, string>>({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [adsRes, makesRes, modelsRes] = await Promise.all([
        supabase
          .from("ads")
          .select("*", { count: "exact" })
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(HOME_RECENT_LIMIT),
        supabase.from("makes").select("id, name"),
        supabase.from("models").select("id, name"),
      ]);
      if (adsRes.data) setAds(adsRes.data);
      if (adsRes.count != null) setTotalActive(adsRes.count);
      if (makesRes.data) setMakesMap(Object.fromEntries(makesRes.data.map((m) => [m.id, m.name])));
      if (modelsRes.data) setModelsMap(Object.fromEntries(modelsRes.data.map((m) => [m.id, m.name])));
      setLoading(false);
    }
    fetchData();
  }, []);

  const hasMore = totalActive > ads.length;

  return (
    <div className="mt-[60px] pt-6 md:mt-16 md:pt-5 w-full min-h-screen">
      <CategoryBar onSelect={(main, sub) => router.push(`/search?main_cat=${main}&sub_cat=${sub}`)} />

      <section className="bg-white px-4 py-4 border-b border-gray-100 text-center">
        <h2 className="text-3xl font-black text-gray-900">
          Find everything in <span className="text-[#FF6321]">Egypt</span>
        </h2>
      </section>

      <main className="mx-auto max-w-[1400px] w-full px-3 py-8 min-h-screen">
        {!loading && ads.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 px-1">
            <div>
              <h3 className="text-lg font-black text-gray-900">Recent listings</h3>
              {hasMore && (
                <p className="text-sm text-gray-500 mt-0.5">
                  Showing the latest {ads.length} of {totalActive} ads
                </p>
              )}
            </div>
            <Link
              href="/search"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#FF6321] text-white text-sm font-bold hover:bg-[#e85a1e] transition-colors shrink-0"
            >
              {hasMore ? `See all ${totalActive} listings` : "Browse all listings"}
            </Link>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : (
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
        )}

        {!loading && ads.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="mb-4">No listings yet. Be the first to post an ad!</p>
            <Link
              href="/post-ad"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#FF6321] text-white text-sm font-bold hover:bg-[#e85a1e]"
            >
              Post an ad
            </Link>
          </div>
        )}

        {!loading && ads.length > 0 && hasMore && (
          <div className="text-center mt-10">
            <Link
              href="/search"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-[#FF6321] text-[#FF6321] text-sm font-bold hover:bg-orange-50 transition-colors"
            >
              See all listings
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
