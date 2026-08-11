import {
  CATEGORY_CONFIG,
  getAttributesBySlug,
  getSubCategoryLabel as getSubCategoryLabelEn,
  GLOBAL_AD_ATTRIBUTES,
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

export function getAttributeLabelForKey(subSlug: string, key: string): string {
  const attrs = [...getAttributesBySlug(subSlug), ...GLOBAL_AD_ATTRIBUTES];
  return attrs.find((a) => a.key === key)?.label ?? key.replace(/_/g, " ");
}

type TranslateFn = (key: string) => string;

export function formatAttributeValue(
  value: unknown,
  locale: Locale,
  t: TranslateFn,
  key?: string,
  makesMap?: Record<number, string>,
  modelsMap?: Record<number, string>,
): string {
  if (value == null || value === "") return "";
  if (key === "make_id" && makesMap) return makesMap[Number(value)] ?? String(value);
  if (key === "model_id" && modelsMap) return modelsMap[Number(value)] ?? String(value);
  const str = String(value);
  if (str === "Yes") return t("common.yes");
  if (str === "No") return t("common.no");
  return localizedOption(str, locale);
}
