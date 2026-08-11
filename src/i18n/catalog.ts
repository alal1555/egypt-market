import {
  CATEGORY_CONFIG,
  getSubCategoryLabel as getSubCategoryLabelEn,
} from "@/constants/categoryConfig";
import type { Locale } from "./types";
import {
  attributeLabelsAr,
  mainCategoriesAr,
  optionsAr,
  subCategoriesAr,
} from "./messages/catalog.ar";

export function localizedMainCategoryName(slug: string, locale: Locale): string {
  const fallback = CATEGORY_CONFIG.find((c) => c.slug === slug)?.name ?? slug;
  if (locale === "ar") return mainCategoriesAr[slug] ?? fallback;
  return fallback;
}

export function localizedSubCategoryName(slug: string, locale: Locale): string {
  const fallback = getSubCategoryLabelEn(slug) ?? slug;
  if (locale === "ar") return subCategoriesAr[slug] ?? fallback;
  return fallback;
}

export function localizedAttributeLabel(label: string, locale: Locale): string {
  if (locale === "ar") return attributeLabelsAr[label] ?? label;
  return label;
}

export function localizedOption(value: string, locale: Locale): string {
  if (locale === "ar") return optionsAr[value] ?? value;
  return value;
}
