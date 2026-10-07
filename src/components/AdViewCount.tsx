"use client";

import { Eye } from "lucide-react";
import { useTranslation } from "@/i18n/LocaleProvider";

type Props = {
  count?: number | null;
  className?: string;
  iconSize?: number;
};

export default function AdViewCount({ count, className = "", iconSize = 12 }: Props) {
  const { t, locale } = useTranslation();
  const n = Math.max(0, Number(count) || 0);
  const formatted = n.toLocaleString(locale === "ar" ? "ar-EG" : "en-US");

  return (
    <span
      className={`inline-flex items-center gap-1 tabular-nums ${className}`}
      aria-label={t("adViews.aria", { count: formatted })}
      title={t("adViews.aria", { count: formatted })}
    >
      <Eye size={iconSize} className="shrink-0 opacity-80" aria-hidden />
      <span>{formatted}</span>
    </span>
  );
}
