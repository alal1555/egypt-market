"use client";

import { SlidersHorizontal } from "lucide-react";
import { CATEGORY_CONFIG } from "@/constants/categoryConfig";
import { sortWithOtherLast } from "@/lib/utils";

type Make = { id: number; name: string };
type Model = { id: number; name: string; make_id: number };

type MainCategory = (typeof CATEGORY_CONFIG)[number];

interface SearchFiltersProps {
  mainCatFilter: string;
  subCatFilter: string;
  selectedMainCategoryObj: MainCategory | undefined;
  subCategoryAttributes: ReturnType<typeof import("@/constants/categoryConfig").getAttributesBySlug>;
  activeAttrs: Record<string, string[]>;
  allMakes: Make[];
  allModels: Model[];
  updateURL: (updatedParams: Record<string, string | null>) => void;
  showCategories?: boolean;
  showAttributes?: boolean;
  className?: string;
}

export default function SearchFilters({
  mainCatFilter,
  subCatFilter,
  selectedMainCategoryObj,
  subCategoryAttributes,
  activeAttrs,
  allMakes,
  allModels,
  updateURL,
  showCategories = true,
  showAttributes = true,
  className = "",
}: SearchFiltersProps) {
  return (
    <div className={className}>
      {showCategories && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <select
            value={mainCatFilter}
            onChange={(e) => updateURL({ main_cat: e.target.value, sub_cat: null, q: null })}
            className="p-3 bg-gray-50 rounded-xl border text-sm"
          >
            <option value="">All Categories</option>
            {CATEGORY_CONFIG.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <select
            value={subCatFilter}
            disabled={!mainCatFilter}
            onChange={(e) => updateURL({ sub_cat: e.target.value, q: null })}
            className="p-3 bg-gray-50 rounded-xl border text-sm disabled:opacity-50"
          >
            <option value="">All Sub-Categories</option>
            {selectedMainCategoryObj?.subs.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {showAttributes && subCategoryAttributes.length > 0 && (
        <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
          <SlidersHorizontal size={16} /> Filters
        </h3>
      )}

      {showAttributes && subCategoryAttributes.map((field) => (
        <div key={field.key} className="mb-6">
          <p className="text-xs font-black uppercase text-gray-400 mb-2">{field.label}</p>

          {field.type === "range" || field.type === "number" ? (
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                className="w-full p-2 border rounded-lg text-sm"
                value={activeAttrs[field.key]?.[0]?.split("-")[0] || ""}
                onChange={(e) => {
                  const [, max] = (activeAttrs[field.key]?.[0] || "-").split("-");
                  updateURL({ [field.key]: `${e.target.value}-${max || ""}` });
                }}
              />
              <span className="text-gray-400">—</span>
              <input
                type="number"
                placeholder="Max"
                className="w-full p-2 border rounded-lg text-sm"
                value={activeAttrs[field.key]?.[0]?.split("-")[1] || ""}
                onChange={(e) => {
                  const [min] = (activeAttrs[field.key]?.[0] || "-").split("-");
                  updateURL({ [field.key]: `${min || ""}-${e.target.value}` });
                }}
              />
            </div>
          ) : null}

          {field.type === "toggle" ? (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-[#FF6321]">
              <input
                type="checkbox"
                checked={activeAttrs[field.key]?.includes("Yes") || false}
                onChange={() =>
                  updateURL({
                    [field.key]: activeAttrs[field.key]?.includes("Yes") ? null : "Yes",
                  })
                }
              />
              Yes
            </label>
          ) : null}

          {field.key === "make_id" && (
            <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
              {allMakes.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-[#FF6321]">
                  <input
                    type="checkbox"
                    checked={activeAttrs.make_id?.includes(String(m.id)) || false}
                    onChange={() =>
                      updateURL({
                        make_id: activeAttrs.make_id?.includes(String(m.id)) ? null : String(m.id),
                        model_id: null,
                      })
                    }
                  />
                  {m.name}
                </label>
              ))}
            </div>
          )}

          {field.key === "model_id" && activeAttrs.make_id && (
            <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
              {sortWithOtherLast(
                allModels.filter((m) => m.make_id === parseInt(activeAttrs.make_id[0]))
              ).map((m) => (
                  <label key={m.id} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-[#FF6321]">
                    <input
                      type="checkbox"
                      checked={activeAttrs.model_id?.includes(String(m.id)) || false}
                      onChange={() =>
                        updateURL({
                          model_id: activeAttrs.model_id?.includes(String(m.id)) ? null : String(m.id),
                        })
                      }
                    />
                    {m.name}
                  </label>
                ))}
            </div>
          )}

          {field.type === "select" && field.key !== "make_id" && field.key !== "model_id" && (
            <div className="space-y-1">
              {field.options?.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-[#FF6321]">
                  <input
                    type="checkbox"
                    checked={!!activeAttrs[field.key]?.includes(opt)}
                    onChange={() => {
                      const current = activeAttrs[field.key] || [];
                      const next = current.includes(opt) ? current.filter((v) => v !== opt) : [...current, opt];
                      updateURL({ [field.key]: next.length > 0 ? next.join(",") : null });
                    }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

      {!subCatFilter && showCategories && showAttributes && (
        <p className="text-sm text-gray-400">Select a sub-category to see attribute filters.</p>
      )}
    </div>
  );
}
