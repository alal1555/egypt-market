"use client";

import { useState, useEffect } from "react";
import { Car, Building2, Smartphone, Shirt, Briefcase, LayoutGrid, Dog, Anchor, GraduationCap, ChevronDown, Sofa, Wrench, Baby, Dumbbell, BookOpen, UtensilsCrossed, Factory } from "lucide-react";
import { CATEGORY_CONFIG } from "@/constants/categoryConfig";
import { useTranslation } from "@/i18n/LocaleProvider";
import { localizedMainCategoryName, localizedSubCategoryName } from "@/i18n/catalog";

export type CategoryBarVariant = "default" | "light" | "solid" | "accent";

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

function barClass(variant: CategoryBarVariant): string {
  switch (variant) {
    case "light":
      return "bg-orange-50 border-b border-orange-100 shadow-sm";
    case "solid":
      return "bg-[#FF6321] border-b border-[#e85a1e] shadow-md";
    case "accent":
      return "bg-white border-b-4 border-[#FF6321] shadow-sm";
    default:
      return "bg-white border-b border-gray-100 shadow-sm";
  }
}

function iconBoxClass(variant: CategoryBarVariant, isSelected: boolean): string {
  if (variant === "solid") {
    return isSelected
      ? "flex h-10 w-10 items-center justify-center rounded-xl transition-all bg-white/30"
      : "flex h-10 w-10 items-center justify-center rounded-xl transition-all bg-white/15 group-hover:bg-white/25";
  }
  if (variant === "light") {
    return isSelected
      ? "flex h-10 w-10 items-center justify-center rounded-xl transition-all bg-white shadow-sm"
      : "flex h-10 w-10 items-center justify-center rounded-xl transition-all bg-white/80 group-hover:bg-white";
  }
  return isSelected
    ? "flex h-10 w-10 items-center justify-center rounded-xl transition-all bg-orange-50"
    : "flex h-10 w-10 items-center justify-center rounded-xl transition-all bg-gray-50 group-hover:bg-orange-50/60";
}

function iconClass(variant: CategoryBarVariant, isSelected: boolean): string {
  if (variant === "solid") return "text-white";
  if (isSelected) return "text-[#FF6321]";
  return variant === "light" ? "text-gray-700" : "text-gray-600";
}

function labelClass(variant: CategoryBarVariant): string {
  if (variant === "solid") {
    return "text-[11px] font-bold flex items-center gap-0.5 text-white/95 whitespace-nowrap";
  }
  return "text-[11px] font-bold flex items-center gap-0.5 text-gray-500 whitespace-nowrap";
}

type Props = {
  onSelect: (main: string, sub: string) => void;
  variant?: CategoryBarVariant;
};

export default function CategoryBar({ onSelect, variant = "accent" }: Props) {
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
    <div className={`fixed top-[102px] md:top-[64px] left-0 right-0 z-40 ${barClass(variant)}`}>
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
                  <div className={iconBoxClass(variant, isSelected)}>
                    <Icon size={20} className={iconClass(variant, isSelected)} />
                  </div>
                  <span className={labelClass(variant)}>
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
