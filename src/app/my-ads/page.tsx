"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSessionUser, readStoredAccessToken } from "@/lib/auth-client";
import { restDeleteMyAd, restFetchMyAds, type MyAdRow } from "@/lib/my-ads-api";
import AdCard from "@/components/AdCard";
import Link from "next/link";
import { Trash2, Edit3, Plus, RefreshCw, CalendarClock } from "lucide-react";
import { extractSpecs } from "@/lib/utils";
import {
  AD_LIVE_DAYS,
  AD_POST_PRICE_EGP,
  formatExpiryDate,
  getListingDisplayStatus,
} from "@/constants/adPricing";
import { renewAdListing } from "@/lib/wallet";
import { useTranslation } from "@/i18n/LocaleProvider";
import { getDisplayPrice, isAuctionListing, type AuctionAdFields } from "@/constants/auction";
import { formatWalletErrorLocalized } from "@/i18n/walletErrors";
import ShareAdMenu from "@/components/ShareAdMenu";

interface Ad extends AuctionAdFields, MyAdRow {}

export default function MyAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [makesMap, setMakesMap] = useState<Record<number, string>>({});
  const [modelsMap, setModelsMap] = useState<Record<number, string>>({});
  const { t } = useTranslation();

  useEffect(() => {
    let active = true;

    async function init() {
      const sessionUser = await getSessionUser();
      if (!active) return;

      if (!sessionUser) {
        setLoading(false);
        return;
      }
      setUser(sessionUser);

      const accessToken = readStoredAccessToken();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const [adsList, makesRes, modelsRes] = await Promise.all([
        accessToken
          ? restFetchMyAds(accessToken, sessionUser.id)
          : Promise.resolve([] as MyAdRow[]),
        fetch(`${supabaseUrl}/rest/v1/makes?select=id,name`, {
          headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
          signal: AbortSignal.timeout(12_000),
        }),
        fetch(`${supabaseUrl}/rest/v1/models?select=id,name`, {
          headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
          signal: AbortSignal.timeout(12_000),
        }),
      ]);

      if (!active) return;

      setAds(adsList as Ad[]);

      if (makesRes.ok) {
        const makes = (await makesRes.json()) as { id: number; name: string }[];
        setMakesMap(Object.fromEntries(makes.map((m) => [m.id, m.name])));
      }
      if (modelsRes.ok) {
        const models = (await modelsRes.json()) as { id: number; name: string }[];
        setModelsMap(Object.fromEntries(models.map((m) => [m.id, m.name])));
      }

      setLoading(false);
    }

    void init();
    return () => {
      active = false;
    };
  }, []);

  const handleDelete = async (adId: string) => {
    if (!window.confirm(t("myAds.deleteConfirm"))) return;

    setDeletingId(adId);
    const accessToken = readStoredAccessToken();
    const ok = accessToken ? await restDeleteMyAd(accessToken, adId) : false;

    if (!ok) {
      alert(t("myAds.errorPrefix") + t("myAds.deleteFailed"));
    } else {
      setAds((prev) => prev.filter((ad) => ad.id !== adId));
    }
    setDeletingId(null);
  };

  const handleRenew = async (adId: string) => {
    if (
      !window.confirm(
        t("myAds.renewConfirm", { days: AD_LIVE_DAYS, price: AD_POST_PRICE_EGP }),
      )
    ) {
      return;
    }

    setRenewingId(adId);
    const result = await renewAdListing(supabase, adId);
    setRenewingId(null);

    if (!result.ok) {
      alert(formatWalletErrorLocalized(result.error, t));
      return;
    }

    setAds((prev) =>
      prev.map((ad) =>
        ad.id === adId ? { ...ad, expires_at: result.expires_at ?? ad.expires_at } : ad,
      ),
    );
    alert(
      t("myAds.renewed", {
        date: formatExpiryDate(result.expires_at) ?? "—",
      }),
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl shadow-lg border">
        <h2 className="text-2xl font-bold mb-4">{t("myAds.signInTitle")}</h2>
        <Link href="/login" className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold">
          {t("myAds.loginToManage")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">{t("myAds.title")}</h1>
        <Link href="/post-ad" className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl font-bold hover:bg-gray-800 transition">
          <Plus size={18} /> {t("myAds.postAd")}
        </Link>
      </div>

      {ads.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed">
          <p className="text-gray-500 mb-4">{t("myAds.noListings")}</p>
          <Link href="/post-ad" className="text-orange-600 font-bold hover:underline">{t("myAds.postFirst")}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {ads.map((ad) => {
            const listingStatus = getListingDisplayStatus(ad);
            const expired = listingStatus === "expired";
            const expiryLabel = formatExpiryDate(ad.expires_at);
            const auction = isAuctionListing(ad);
            const displayPrice = getDisplayPrice(ad);

            return (
            <div key={ad.id} className="border rounded-2xl p-3 bg-white shadow-sm flex flex-col">
              <AdCard
                {...ad}
                status={ad.status}
                expires_at={ad.expires_at}
                showStatus={true}
                price={String(displayPrice)}
                category={ad.category_slug}
                imageUrl={ad.images?.[0]}
                specs={extractSpecs(ad.attributes)}
                makeName={ad.attributes?.make_id ? makesMap[ad.attributes.make_id] : undefined}
                modelName={ad.attributes?.model_id ? modelsMap[ad.attributes.model_id] : undefined}
              />

              {ad.status === "active" && ad.expires_at && !auction && (
                <p className={`text-xs mt-3 flex items-center gap-1 ${expired ? "text-red-600 font-bold" : "text-gray-500"}`}>
                  <CalendarClock size={14} />
                  {expired
                    ? t("myAds.expiredOn", { date: expiryLabel ?? "—" })
                    : t("myAds.liveUntil", { date: expiryLabel ?? "—" })}
                </p>
              )}

              <div className="flex flex-col gap-2 mt-auto pt-4">
                {ad.status === "active" && (
                  <ShareAdMenu
                    ad={{
                      id: ad.id,
                      title: ad.title,
                      price: ad.price,
                      location: ad.location,
                      description: ad.description,
                      images: ad.images,
                      seller_phone: ad.seller_phone,
                      category_slug: ad.category_slug,
                      attributes: ad.attributes,
                      listing_type: ad.listing_type,
                      auction_current_bid: ad.auction_current_bid,
                    }}
                    makesMap={makesMap}
                    modelsMap={modelsMap}
                    className="w-full [&>button]:w-full"
                  />
                )}
                {expired && !auction && (
                  <button
                    onClick={() => handleRenew(ad.id)}
                    disabled={renewingId === ad.id}
                    className="w-full flex items-center justify-center gap-2 bg-[#FF6321] text-white hover:bg-[#e85a1e] py-2 rounded-xl text-sm font-bold transition disabled:opacity-60"
                  >
                    <RefreshCw size={16} />
                    {renewingId === ad.id
                      ? t("myAds.renewing")
                      : t("myAds.renew", { price: AD_POST_PRICE_EGP })}
                  </button>
                )}
                <div className="flex gap-2">
                <Link href={`/my-ads/edit/${ad.id}`} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 py-2 rounded-xl text-sm font-bold transition">
                  <Edit3 size={16} /> {t("myAds.edit")}
                </Link>
                <button
                  onClick={() => handleDelete(ad.id)}
                  disabled={deletingId === ad.id}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-xl text-sm font-bold transition"
                >
                  <Trash2 size={16} /> {deletingId === ad.id ? "..." : t("myAds.delete")}
                </button>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
