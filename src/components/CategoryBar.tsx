"use client";

import { useState, useEffect } from "react";
import { Car, Building2, Smartphone, Shirt, Briefcase, LayoutGrid, Dog, Anchor, GraduationCap, ChevronDown, Sofa, Wrench, Baby, Dumbbell, BookOpen, UtensilsCrossed, Factory } from "lucide-react";
import { CATEGORY_CONFIG } from "@/constants/categoryConfig";
import { useTranslation } from "@/i18n/LocaleProvider";
import { localizedMainCategoryName, localizedSubCategoryName } from "@/i18n/catalog";

const getIconForCategory = (slug: string) => {
  const icons: Record<string, any> = {
    "vehicles-sale": Car, "vehicles-rent": Car, "watercraft": Anchor,
    "prop-sale": Building2, "prop-rent": Building2, "electronics": Smartphone,
    "fashion": Shirt, "business": Briefcase, "pets": Dog, "education": GraduationCap,
    "home-furniture": Sofa, "services": Wrench, "kids": Baby,
    "sports": Dumbbell, "books": BookOpen, "food": UtensilsCrossed, "biz-equipment": Factory,
  };
  return icons[slug] || LayoutGrid;
};

export default function CategoryBar({ onSelect }: { onSelect: (main: string, sub: string) => void }) {
  const [openDropdown, setOpenDropdown] = useState<{slug: string, rect: DOMRect} | null>(null);
  const { locale } = useTranslation();
  const dropdownWidth = 192;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('button')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const calculateLeftPosition = (rect: DOMRect) => {
    const viewportWidth = window.innerWidth;
    const margin = 10;
    let left = rect.left + (rect.width / 2) - (dropdownWidth / 2);
    if (left < margin) left = margin;
    if (left + dropdownWidth > viewportWidth - margin) left = viewportWidth - dropdownWidth - margin;
    return left;
  };

  return (
    <div className="fixed top-[102px] md:top-[64px] left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center justify-start md:justify-center gap-6 px-4 py-3 min-w-max">
          {CATEGORY_CONFIG.map((cat) => {
            const Icon = getIconForCategory(cat.slug);
            const isSelected = openDropdown?.slug === cat.slug;
            
            return (
              <div key={cat.slug} className="flex flex-col items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); 
                    const rect = e.currentTarget.getBoundingClientRect();
                    setOpenDropdown(isSelected ? null : { slug: cat.slug, rect });
                  }}
                  className="group flex flex-col items-center gap-1.5 min-w-[60px]"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${isSelected ? "bg-orange-50" : "bg-gray-50"}`}>
                    <Icon size={20} className={isSelected ? "text-[#FF6321]" : "text-gray-600"} />
                  </div>
                  <span className="text-[11px] font-bold flex items-center gap-0.5 text-gray-500 whitespace-nowrap">
                    {localizedMainCategoryName(cat.slug, locale)} <ChevronDown size={10} />
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {openDropdown && (
        <div 
          className="fixed z-[100] bg-white rounded-xl shadow-2xl border border-gray-100 py-2 w-48"
          style={{ 
            top: `${openDropdown.rect.bottom + 8}px`, 
            left: `${calculateLeftPosition(openDropdown.rect)}px` 
          }}
        >
          {CATEGORY_CONFIG.find(c => c.slug === openDropdown.slug)?.subs.map((sub: any) => (
            <button
              key={sub.slug}
              onClick={() => { onSelect(openDropdown.slug, sub.slug); setOpenDropdown(null); }}
              className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-orange-50 hover:text-[#FF6321]"
            >
              {localizedSubCategoryName(sub.slug, locale)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}