"use client";

import Link from "next/link";
import { useState } from "react";

const HERO_OPTIONS = [
  {
    id: "banner",
    label: "About banner (recommended)",
    src: "/marketing/yaddii-about-banner.jpg",
    objectPosition: "center 42%",
  },
  {
    id: "still",
    label: "Full still frame",
    src: "/marketing/yaddii-hero-still.jpg",
    objectPosition: "center center",
  },
] as const;

export default function AboutHeroPreview() {
  const [heroId, setHeroId] = useState<(typeof HERO_OPTIONS)[number]["id"]>("banner");
  const hero = HERO_OPTIONS.find((o) => o.id === heroId) ?? HERO_OPTIONS[0];

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 md:pt-6 space-y-3">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="font-bold">Local preview only</p>
        <p className="mt-1 text-amber-900/90">
          Not shown on the live About page until you choose to ship it. Compare with{" "}
          <Link href="/about" className="font-bold text-[#FF6321] underline">
            /about
          </Link>
          .
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {HERO_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setHeroId(option.id)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
              heroId === option.id
                ? "bg-[#FF6321] text-white border-[#FF6321]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#FF6321]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero.src}
          alt=""
          className="w-full h-auto max-h-56 sm:max-h-64 md:max-h-80 object-cover"
          style={{ objectPosition: hero.objectPosition }}
        />
      </div>
    </div>
  );
}
