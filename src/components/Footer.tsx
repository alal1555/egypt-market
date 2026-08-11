"use client";

import Link from "next/link";
import Image from "next/image";
import { CATEGORY_CONFIG } from "@/constants/categoryConfig";
import { useTranslation } from "@/i18n/LocaleProvider";
import { localizedMainCategoryName } from "@/i18n/catalog";

export default function Footer() {
  const { t, locale } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="hidden md:block max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              <Image src="/logo-nav.png" alt="Yaddii" width={120} height={32} className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">{t("footer.tagline")}</p>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wide text-gray-400 mb-3">
              {t("footer.browse")}
            </h3>
            <ul className="space-y-2">
              {CATEGORY_CONFIG.slice(0, 8).map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/search?main_cat=${cat.slug}`}
                    className="text-sm text-gray-600 hover:text-[#FF6321] transition-colors"
                  >
                    {localizedMainCategoryName(cat.slug, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wide text-gray-400 mb-3">
              {t("footer.more")}
            </h3>
            <ul className="space-y-2">
              {CATEGORY_CONFIG.slice(8).map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/search?main_cat=${cat.slug}`}
                    className="text-sm text-gray-600 hover:text-[#FF6321] transition-colors"
                  >
                    {localizedMainCategoryName(cat.slug, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wide text-gray-400 mb-3">
              {t("footer.yaddii")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/search" className="text-sm text-gray-600 hover:text-[#FF6321] transition-colors">
                  {t("footer.searchListings")}
                </Link>
              </li>
              <li>
                <Link href="/post-ad" className="text-sm text-gray-600 hover:text-[#FF6321] transition-colors">
                  {t("footer.postAnAd")}
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-gray-600 hover:text-[#FF6321] transition-colors">
                  {t("footer.logIn")}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-gray-600 hover:text-[#FF6321] transition-colors">
                  {t("footer.adPricing")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-gray-600 hover:text-[#FF6321] transition-colors">
                  {t("footer.about")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-[#FF6321] transition-colors">
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-[#FF6321] transition-colors">
                  {t("footer.privacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
          <span>{t("footer.rights", { year })}</span>
          <span>{t("footer.madeFor")}</span>
        </div>
      </div>

      <div className="md:hidden px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-gray-100 text-center text-[11px] text-gray-400">
        <span>{t("footer.mobileRights", { year })}</span>
        <span className="mx-2">·</span>
        <Link href="/pricing" className="hover:text-[#FF6321]">
          {t("footer.pricing")}
        </Link>
        <span className="mx-2">·</span>
        <Link href="/about" className="hover:text-[#FF6321]">
          {t("footer.about")}
        </Link>
        <span className="mx-2">·</span>
        <Link href="/terms" className="hover:text-[#FF6321]">
          {t("footer.terms")}
        </Link>
        <span className="mx-2">·</span>
        <Link href="/privacy" className="hover:text-[#FF6321]">
          {t("footer.privacy")}
        </Link>
      </div>
    </footer>
  );
}
