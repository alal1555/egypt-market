"use client";

import { useTranslation } from "@/i18n/LocaleProvider";

type SoldStampOverlayProps = {
  size?: "card" | "hero";
};

export default function SoldStampOverlay({ size = "card" }: SoldStampOverlayProps) {
  const { t } = useTranslation();
  const textSize = size === "hero" ? "text-5xl sm:text-7xl" : "text-3xl sm:text-4xl";
  const pad = size === "hero" ? "px-10 py-5" : "px-5 py-2.5";
  const border = size === "hero" ? "border-[6px]" : "border-4";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[15] flex items-center justify-center bg-black/15"
      aria-hidden
    >
      <div
        className={`-rotate-12 rounded-md ${border} border-red-600 ${pad} bg-white/85 shadow-lg ring-2 ring-red-600/30`}
      >
        <span
          className={`block font-black uppercase tracking-[0.2em] text-red-600 ${textSize}`}
          style={{
            WebkitTextStroke: "1px rgba(185, 28, 28, 0.35)",
            textShadow: "2px 2px 0 rgba(127, 29, 29, 0.15)",
          }}
        >
          {t("listing.soldStamp")}
        </span>
      </div>
    </div>
  );
}
