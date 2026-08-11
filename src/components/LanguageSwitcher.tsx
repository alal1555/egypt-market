"use client";

import { useTranslation } from "@/i18n/LocaleProvider";
import type { Locale } from "@/i18n/types";
import { Languages } from "lucide-react";

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useTranslation();

  const toggle = () => setLocale(locale === "en" ? "ar" : "en");

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="text-xs font-bold text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-xl hover:text-[#FF6321] hover:border-orange-200 transition-colors"
        aria-label={t("language.switch")}
      >
        {locale === "en" ? "عربي" : "EN"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border border-gray-200 p-0.5 bg-gray-50">
      {(["en", "ar"] as Locale[]).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
            locale === code
              ? "bg-white text-[#FF6321] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {code === "en" ? "EN" : "عربي"}
        </button>
      ))}
    </div>
  );
}

export function LanguageSwitcherIcon() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "en" ? "ar" : "en")}
      className="p-1.5 text-gray-500 hover:text-[#FF6321] transition-colors flex items-center gap-1"
      aria-label={t("language.switch")}
      title={t("language.switch")}
    >
      <Languages size={18} />
      <span className="text-xs font-bold hidden sm:inline">
        {locale === "en" ? "عربي" : "EN"}
      </span>
    </button>
  );
}
