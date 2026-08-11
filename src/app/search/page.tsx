"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdCard from "@/components/AdCard";
import SearchFilters from "@/components/SearchFilters";
import { SlidersHorizontal, X } from "lucide-react";
import { CATEGORY_CONFIG, getAttributesBySlug, getCategoryGroups } from "@/constants/categoryConfig";
import { extractSpecs } from "@/lib/utils";
import { useTranslation } from "@/i18n/LocaleProvider";

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { t } = useTranslation();

  const subCategoryAttributes = useMemo(() => getAttributesBySlug(subCatFilter), [subCatFilter]);
  const selectedMainCategoryObj = useMemo(() => CATEGORY_CONFIG.find((c) => c.slug === mainCatFilter), [mainCatFilter]);

  useEffect(() => {
    async function fetchMetadata() {
      const [makesRes, modelsRes] = await Promise.all([
        supabase.from("makes").select("id, name").order("name"),
        supabase.from("models").select("id, name, make_id"),
      ]);
      if (makesRes.data) {
        setAllMakes(makesRes.data);
        setMakesMap(Object.fromEntries(makesRes.data.map((m) => [m.id, m.name])));
      }
      if (modelsRes.data) {
        setAllModels(modelsRes.data);
        setModelsMap(Object.fromEntries(modelsRes.data.map((m) => [m.id, m.name])));
      }
    }
    fetchMetadata();
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileFiltersOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileFiltersOpen]);

  const activeAttrs = useMemo(() => {
    const filters: Record<string, string[]> = {};
    subCategoryAttributes.forEach((field) => {
      const val = searchParams.get(field.key);
      if (val) filters[field.key] = val.split(",");
    });
    return filters;
  }, [searchParams, subCategoryAttributes]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (mainCatFilter) count++;
    if (subCatFilter) count++;
    if (query) count++;
    count += Object.keys(activeAttrs).length;
    return count;
  }, [mainCatFilter, subCatFilter, query, activeAttrs]);

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

      if (subCatFilter) {
        q = q.eq("category_slug", subCatFilter);
      } else if (mainCatFilter) {
        const subs = getCategoryGroups()[mainCatFilter];
        if (subs?.length) q = q.in("category_slug", subs);
      }
      if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);

      Object.entries(activeAttrs).forEach(([key, values]) => {
        if (values.length === 0) return;

        const field = subCategoryAttributes.find((f) => f.key === key);
        const isRangeValue = values.length === 1 && values[0].includes("-");

        if (field?.type === "range" || isRangeValue) {
          const [minStr, maxStr] = values[0].split("-");
          if (minStr !== "" && !isNaN(Number(minStr))) q = q.gte(`attributes->${key}`, Number(minStr));
          if (maxStr !== "" && !isNaN(Number(maxStr))) q = q.lte(`attributes->${key}`, Number(maxStr));
        } else if (field?.type === "text") {
          const term = values[0]?.trim();
          if (term) q = q.ilike(`attributes->>${key}`, `%${term}%`);
        } else if (field?.type === "select" || key === "make_id" || key === "model_id") {
          q = q.in(`attributes->>${key}`, values);
        } else if (values.length === 1) {
          q = q.eq(`attributes->>${key}`, values[0]);
        } else {
          q = q.in(`attributes->>${key}`, values);
        }
      });

      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) console.error("Search Error:", error);
      setAds(data || []);
    }
    executeSearch();
  }, [query, mainCatFilter, subCatFilter, activeAttrs, subCategoryAttributes]);

  const filterProps = {
    mainCatFilter,
    subCatFilter,
    selectedMainCategoryObj,
    subCategoryAttributes,
    activeAttrs,
    allMakes,
    allModels,
    updateURL,
  };

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-10">
      {/* Desktop category bar */}
      <div className="hidden md:block bg-white p-6 rounded-2xl border mb-10 shadow-sm">
        <SearchFilters {...filterProps} showCategories showAttributes={false} />
      </div>

      <div className="flex gap-8 items-start">
        {/* Desktop sidebar filters */}
        <aside className="hidden md:block w-[260px] shrink-0 bg-white p-6 rounded-2xl border shadow-sm h-fit sticky top-24">
          <SearchFilters {...filterProps} showCategories={false} showAttributes />
        </aside>

        <main className="flex-1 min-w-0">
          <div className="mb-4 md:mb-6 flex justify-between items-center gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="md:hidden flex items-center gap-2 shrink-0 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:border-[#FF6321] hover:text-[#FF6321] transition-colors"
              >
                <SlidersHorizontal size={16} />
                {t("search.filters")}
                {activeFilterCount > 0 && (
                  <span className="bg-[#FF6321] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <h2 className="text-base md:text-xl font-bold text-gray-900 truncate">
                {t("searchPage.adsFound", { count: ads.length })}
              </h2>
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => router.push("/search")}
                className="text-sm text-gray-500 hover:text-[#FF6321] underline shrink-0"
              >
                {t("searchPage.clearAll")}
              </button>
            )}
          </div>

          {query && (
            <p className="mb-4 text-sm text-gray-500 md:hidden">
              {t("searchPage.resultsFor")} &ldquo;<span className="font-semibold text-gray-700">{query}</span>&rdquo;
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {ads.map((ad) => (
              <AdCard
                key={ad.id}
                id={ad.id}
                title={ad.title}
                price={String(ad.price)}
                location={ad.location}
                category={ad.category_slug}
                imageUrl={ad.images?.[0]}
                specs={extractSpecs(ad.attributes)}
                makeName={makesMap[ad.attributes?.make_id]}
                modelName={modelsMap[ad.attributes?.model_id]}
                postedDate={new Date(ad.created_at).toLocaleDateString()}
              />
            ))}
          </div>

          {ads.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              {t("searchPage.noMatch")}
              {hasActiveFilters && (
                <button
                  onClick={() => router.push("/search")}
                  className="block mx-auto mt-3 text-sm text-[#FF6321] font-bold underline"
                >
                  {t("searchPage.clearFilters")}
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile filter sheet */}
      {mobileFiltersOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label={t("searchPage.closeFilters")}
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal size={18} />
                {t("search.filters")}
              </h3>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                aria-label={t("searchPage.closeFilters")}
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-4 flex-1">
              <SearchFilters {...filterProps} showCategories />
            </div>

            <div className="shrink-0 p-4 border-t border-gray-100 pb-6">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3 rounded-xl bg-[#FF6321] text-white font-bold hover:bg-[#e85a1e] transition-colors"
              >
                {t("searchPage.showResults", { count: ads.length })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
      <SearchResults />
    </Suspense>
  );
}
