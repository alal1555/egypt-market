"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdCard from "@/components/AdCard";
import CategoryBar from "@/components/CategoryBar";
import { extractSpecs } from "@/lib/utils";

interface Ad {
  id: string; title: string; price: number; location: string; category_slug: string;
  images: string[]; status: string; created_at: string; attributes?: any;
}

function HomeContent() {
  const [ads, setAds] = useState<Ad[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [makesMap, setMakesMap] = useState<Record<number, string>>({});
  const [modelsMap, setModelsMap] = useState<Record<number, string>>({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [adsRes, makesRes, modelsRes] = await Promise.all([
        supabase.from("ads").select("*").eq("status", "active").order("created_at", { ascending: false }),
        supabase.from("makes").select("id, name"),
        supabase.from("models").select("id, name"),
      ]);
      if (adsRes.data) setAds(adsRes.data);
      if (makesRes.data) setMakesMap(Object.fromEntries(makesRes.data.map((m) => [m.id, m.name])));
      if (modelsRes.data) setModelsMap(Object.fromEntries(modelsRes.data.map((m) => [m.id, m.name])));
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="mt-[60px] pt-6 md:mt-16 md:pt-5 w-full min-h-screen">
      <CategoryBar onSelect={(main, sub) => router.push(`/search?main_cat=${main}&sub_cat=${sub}`)} />

      <section className="bg-white px-4 py-4 border-b border-gray-100 text-center">
        <h2 className="text-3xl font-black text-gray-900">
          Find everything in <span className="text-[#FF6321]">Egypt</span>
        </h2>
      </section>

      <main className="mx-auto max-w-[1400px] w-full px-3 py-8 min-h-screen">
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
          <div className="text-center py-16 text-gray-500">No ads found in this category.</div>
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
