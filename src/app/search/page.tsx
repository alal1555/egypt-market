"use client";

import React, { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdCard from "@/components/AdCard";
import { SlidersHorizontal } from "lucide-react";
import { CATEGORY_CONFIG, getAttributesBySlug } from "@/constants/categoryConfig";
import { extractSpecs } from "@/lib/utils";

interface Ad {
  id: string; title: string; price: number; location: string; category_slug: string;
  images: string[]; attributes: Record<string, any>; status?: string; created_at: string;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get("q") || "";
  const mainCatFilter = searchParams.get("main_cat") || "";
  const subCatFilter = searchParams.get("sub_cat") || "";
  
  const [ads, setAds] = useState<Ad[]>([]);
  const [allMakes, setAllMakes] = useState<{ id: number; name: string }[]>([]);
  const [allModels, setAllModels] = useState<{ id: number; name: string; make_id: number }[]>([]);
  const [makesMap, setMakesMap] = useState<Record<number, string>>({});
  const [modelsMap, setModelsMap] = useState<Record<number, string>>({});

  const subCategoryAttributes = useMemo(() => getAttributesBySlug(subCatFilter), [subCatFilter]);
  const selectedMainCategoryObj = useMemo(() => CATEGORY_CONFIG.find(c => c.slug === mainCatFilter), [mainCatFilter]);

  useEffect(() => {
    async function fetchMetadata() {
      const [makesRes, modelsRes] = await Promise.all([
        supabase.from("makes").select("id, name").order("name"),
        supabase.from("models").select("id, name, make_id")
      ]);
      if (makesRes.data) {
        setAllMakes(makesRes.data);
        setMakesMap(Object.fromEntries(makesRes.data.map(m => [m.id, m.name])));
      }
      if (modelsRes.data) {
        setAllModels(modelsRes.data);
        setModelsMap(Object.fromEntries(modelsRes.data.map(m => [m.id, m.name])));
      }
    }
    fetchMetadata();
  }, []);

  const activeAttrs = useMemo(() => {
    const filters: Record<string, string[]> = {};
    subCategoryAttributes.forEach(field => {
        const val = searchParams.get(field.key);
        if (val) filters[field.key] = val.split(",");
    });
    return filters;
  }, [searchParams, subCategoryAttributes]);

  const updateURL = (updatedParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updatedParams).forEach(([key, value]) => {
      value === null || value === "" ? params.delete(key) : params.set(key, value);
    });
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    async function executeSearch() {
      let q = supabase.from("ads").select("*").eq("status", "active");

      if (subCatFilter) q = q.eq("category_slug", subCatFilter);
      if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);

      const numericFields = ['mileage', 'area', 'year', 'price', 'bedrooms'];

      Object.entries(activeAttrs).forEach(([key, values]) => {
        if (values.length > 0 && values[0].includes("-")) {
          const [minStr, maxStr] = values[0].split("-");
          
          if (numericFields.includes(key)) {
            // Because your data is now stored as integers, 
            // these standard filters will work perfectly!
            if (minStr !== "" && !isNaN(Number(minStr))) q = q.gte(`attributes->${key}`, Number(minStr));
            if (maxStr !== "" && !isNaN(Number(maxStr))) q = q.lte(`attributes->${key}`, Number(maxStr));
          } else {
            q = q.in(`attributes->>${key}`, values);
          }
        }
      });
      
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) console.error("Search Error:", error);
      setAds(data || []);
    }
    executeSearch();
  }, [query, subCatFilter, activeAttrs]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-10">
      <div className="bg-white p-6 rounded-2xl border mb-10 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <select value={mainCatFilter} onChange={(e) => updateURL({ main_cat: e.target.value, sub_cat: null, q: null })} className="p-3 bg-gray-50 rounded-xl border">
            <option value="">All Categories</option>
            {CATEGORY_CONFIG.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <select value={subCatFilter} disabled={!mainCatFilter} onChange={(e) => updateURL({ sub_cat: e.target.value, q: null })} className="p-3 bg-gray-50 rounded-xl border">
            <option value="">All Sub-Categories</option>
            {selectedMainCategoryObj?.subs.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        <aside className="w-[260px] shrink-0 bg-white p-6 rounded-2xl border shadow-sm h-fit sticky top-24">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><SlidersHorizontal size={16} /> Filters</h3>
          {subCategoryAttributes.map(field => (
            <div key={field.key} className="mb-6">
              <p className="text-xs font-black uppercase text-gray-400 mb-2">{field.label}</p>
              
              {field.type === 'range' ? (
                <div className="flex gap-2 items-center">
                    <input type="number" placeholder="Min" className="w-full p-2 border rounded-lg text-sm"
                        value={activeAttrs[field.key]?.[0]?.split("-")[0] || ""}
                        onChange={(e) => {
                            const [_, max] = (activeAttrs[field.key]?.[0] || "-").split("-");
                            updateURL({ [field.key]: `${e.target.value}-${max || ""}` });
                        }}
                    />
                    <span className="text-gray-400">—</span>
                    <input type="number" placeholder="Max" className="w-full p-2 border rounded-lg text-sm"
                        value={activeAttrs[field.key]?.[0]?.split("-")[1] || ""}
                        onChange={(e) => {
                            const [min] = (activeAttrs[field.key]?.[0] || "-").split("-");
                            updateURL({ [field.key]: `${min || ""}-${e.target.value}` });
                        }}
                    />
                </div>
              ) : null}

              {field.key === 'make_id' && (
                <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
                  {allMakes.map(m => (
                    <label key={m.id} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-[#FF6321]">
                      <input type="checkbox" checked={activeAttrs.make_id?.includes(String(m.id)) || false} 
                        onChange={() => updateURL({ make_id: activeAttrs.make_id?.includes(String(m.id)) ? null : String(m.id), model_id: null })} />
                      {m.name}
                    </label>
                  ))}
                </div>
              )}

              {field.key === 'model_id' && activeAttrs.make_id && (
                <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
                  {allModels.filter(m => m.make_id === parseInt(activeAttrs.make_id[0])).map(m => (
                    <label key={m.id} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-[#FF6321]">
                      <input type="checkbox" checked={activeAttrs.model_id?.includes(String(m.id)) || false} 
                        onChange={() => updateURL({ model_id: activeAttrs.model_id?.includes(String(m.id)) ? null : String(m.id) })} />
                      {m.name}
                    </label>
                  ))}
                </div>
              )}

              {field.type === 'select' && field.key !== 'make_id' && field.key !== 'model_id' && (
                 <div className="space-y-1">
                    {field.options?.map(opt => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-[#FF6321]">
                        <input type="checkbox" checked={!!activeAttrs[field.key]?.includes(opt) || false} 
                          onChange={() => {
                            const current = activeAttrs[field.key] || [];
                            const next = current.includes(opt) ? current.filter(v => v !== opt) : [...current, opt];
                            updateURL({ [field.key]: next.length > 0 ? next.join(",") : null });
                          }} />
                        {opt}
                      </label>
                    ))}
                 </div>
              )}
            </div>
          ))}
        </aside>

        <main className="flex-1">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">{ads.length} Ads found</h2>
            {(query || mainCatFilter || subCatFilter || Object.keys(activeAttrs).length > 0) && (
              <button onClick={() => router.push('/search')} className="text-sm text-gray-500 hover:text-[#FF6321] underline">Clear all</button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map(ad => (
                <AdCard 
                  key={ad.id} id={ad.id} title={ad.title} price={String(ad.price)}
                  location={ad.location} category={ad.category_slug} imageUrl={ad.images?.[0]} 
                  specs={extractSpecs(ad.attributes)} makeName={makesMap[ad.attributes?.make_id]} 
                  modelName={modelsMap[ad.attributes?.model_id]} postedDate={new Date(ad.created_at).toLocaleDateString()}
                />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return <Suspense fallback={<div className="text-center py-20">Loading...</div>}><SearchResults /></Suspense>;
}