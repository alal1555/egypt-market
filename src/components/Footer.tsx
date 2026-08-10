import Link from "next/link";
import Image from "next/image";
import { CATEGORY_CONFIG } from "@/constants/categoryConfig";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="hidden md:block max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              <Image src="/logo-nav.png" alt="Yaddii" width={120} height={32} className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Buy and sell cars, properties, electronics, and more across Egypt.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wide text-gray-400 mb-3">Browse</h3>
            <ul className="space-y-2">
              {CATEGORY_CONFIG.slice(0, 8).map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/search?main_cat=${cat.slug}`}
                    className="text-sm text-gray-600 hover:text-[#FF6321] transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wide text-gray-400 mb-3">More</h3>
            <ul className="space-y-2">
              {CATEGORY_CONFIG.slice(8).map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/search?main_cat=${cat.slug}`}
                    className="text-sm text-gray-600 hover:text-[#FF6321] transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wide text-gray-400 mb-3">Yaddii</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/search" className="text-sm text-gray-600 hover:text-[#FF6321] transition-colors">
                  Search listings
                </Link>
              </li>
              <li>
                <Link href="/post-ad" className="text-sm text-gray-600 hover:text-[#FF6321] transition-colors">
                  Post an ad
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-gray-600 hover:text-[#FF6321] transition-colors">
                  Log in
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-gray-600 hover:text-[#FF6321] transition-colors">
                  Ad pricing
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-gray-600 hover:text-[#FF6321] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-[#FF6321] transition-colors">
                  Terms of use
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-[#FF6321] transition-colors">
                  Privacy policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
          <span>© {year} Yaddii Marketplace. All rights reserved.</span>
          <span>Made for Egypt 🇪🇬</span>
        </div>
      </div>

      <div className="md:hidden px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-gray-100 text-center text-[11px] text-gray-400">
        <span>© {year} Yaddii</span>
        <span className="mx-2">·</span>
        <Link href="/pricing" className="hover:text-[#FF6321]">
          Pricing
        </Link>
        <span className="mx-2">·</span>
        <Link href="/about" className="hover:text-[#FF6321]">
          About
        </Link>
        <span className="mx-2">·</span>
        <Link href="/terms" className="hover:text-[#FF6321]">
          Terms
        </Link>
        <span className="mx-2">·</span>
        <Link href="/privacy" className="hover:text-[#FF6321]">
          Privacy
        </Link>
      </div>
    </footer>
  );
}
