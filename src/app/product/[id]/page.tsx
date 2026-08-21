"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Phone, MessageCircle, MapPin } from "lucide-react";
import AdCard from "@/components/AdCard";
import AuctionPanel from "@/components/AuctionPanel";
import { extractSpecs, formatPhoneForLink, cleanAdAttributes } from "@/lib/utils";
import { useTranslation } from "@/i18n/LocaleProvider";
import {
  formatAttributeValue,
  getAttributeLabelForKey,
  localizedAttributeLabel,
  localizedSubCategoryName,
} from "@/i18n/catalog";
import { restCloseExpiredAuctions, type AdWithAuction } from "@/lib/auction";
import { getDisplayPrice, isAuctionListing, isAuctionLive } from "@/constants/auction";

export default function ProductPage() {
  const params = useParams();
  const [ad, setAd] = useState<AdWithAuction | null>(null);
  const [relatedAds, setRelatedAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const [makesMap, setMakesMap] = useState<Record<number, string>>({});
  const [modelsMap, setModelsMap] = useState<Record<number, string>>({});
  const { t, locale } = useTranslation();

  const patchAd = useCallback((patch: Partial<AdWithAuction>) => {
    setAd((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  useEffect(() => {
    const fetchFullData = async () => {
      if (!params.id) return;
      setLoading(true);

      await restCloseExpiredAuctions();

      const [adRes, makesRes, modelsRes] = await Promise.all([
        supabase.from("ads").select("*").eq("id", params.id).eq("status", "active").single(),
        supabase.from("makes").select("id, name"),
        supabase.from("models").select("id, name"),
      ]);

      if (makesRes.data) setMakesMap(Object.fromEntries(makesRes.data.map((m) => [m.id, m.name])));
      if (modelsRes.data) setModelsMap(Object.fromEntries(modelsRes.data.map((m) => [m.id, m.name])));

      if (adRes.data) {
        setAd(adRes.data as AdWithAuction);
        if (adRes.data.images && adRes.data.images.length > 0) setActiveImage(adRes.data.images[0]);

        const { data: relatedData } = await supabase
          .from("ads")
          .select("*")
          .eq("category_slug", adRes.data.category_slug)
          .eq("status", "active")
          .not("id", "eq", adRes.data.id)
          .limit(4);

        setRelatedAds(relatedData || []);
      }
      setLoading(false);
    };

    fetchFullData();
  }, [params.id]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center">{t("common.loading")}</div>;
  if (!ad) return <div className="min-h-[60vh] flex items-center justify-center">{t("product.notFound")}</div>;

  const getAttributeDisplay = (key: string, value: unknown) => {
    const enLabel = getAttributeLabelForKey(ad.category_slug, key);
    const label = localizedAttributeLabel(enLabel, locale);
    const val = formatAttributeValue(value, locale, t, key, makesMap, modelsMap);
    return { label, val };
  };

  const phoneLink = ad.seller_phone ? formatPhoneForLink(ad.seller_phone) : null;
  const auction = isAuctionListing(ad);
  const displayPrice = getDisplayPrice(ad);
  const showContact =
    !auction || !isAuctionLive(ad) || ad.auction_status === "ended";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl bg-white p-4 shadow-sm border border-gray-100">
              <img src={activeImage || ""} alt={ad.title} className="w-full h-96 object-contain rounded-2xl" />
              <div className="flex gap-2 mt-4 overflow-x-auto">
                {ad.images?.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${activeImage === img ? "border-[#FF6321]" : "border-transparent"}`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-2xl font-bold">{t("product.description")}</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{ad.description}</p>

              {ad.attributes && Object.keys(cleanAdAttributes(ad.attributes)).length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="font-bold text-gray-900 mb-4">{t("product.specifications")}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(cleanAdAttributes(ad.attributes)).map(([key, value]) => {
                      const { label, val } = getAttributeDisplay(key, value);
                      return (
                        <div key={key} className="bg-gray-50 p-3 rounded-lg">
                          <span className="block text-xs text-gray-500">{label}</span>
                          <span className="font-semibold">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {auction ? (
              <AuctionPanel ad={ad} onAdUpdate={patchAd} />
            ) : (
              <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100 sticky top-24">
                <h1 className="text-4xl font-black text-[#FF6321] mb-2">
                  {displayPrice.toLocaleString()} {t("common.egp")}
                </h1>
                <h2 className="text-2xl font-bold mb-4">{ad.title}</h2>
                {ad.category_slug && (
                  <p className="text-xs font-bold text-[#FF6321] uppercase mb-2">
                    {localizedSubCategoryName(ad.category_slug, locale)}
                  </p>
                )}

                <div className="flex items-center gap-2 text-gray-500 mb-6">
                  <MapPin size={18} /> {ad.location}
                </div>

                <div className="space-y-3">
                  {phoneLink ? (
                    <>
                      <a
                        href={`tel:+${phoneLink}`}
                        className="w-full flex items-center justify-center gap-3 bg-[#FF6321] py-4 rounded-2xl font-bold text-white hover:bg-[#e85a1e]"
                      >
                        <Phone size={20} /> {t("product.callSeller")}
                      </a>
                      <a
                        href={`https://wa.me/${phoneLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-3 border-2 border-[#FF6321] py-4 rounded-2xl font-bold text-[#FF6321] hover:bg-orange-50"
                      >
                        <MessageCircle size={20} /> {t("product.whatsapp")}
                      </a>
                    </>
                  ) : (
                    <p className="text-center text-sm text-gray-500 py-4">{t("product.noPhone")}</p>
                  )}
                </div>
              </div>
            )}

            {auction && (
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-2">{ad.title}</h2>
                {ad.category_slug && (
                  <p className="text-xs font-bold text-[#FF6321] uppercase mb-2">
                    {localizedSubCategoryName(ad.category_slug, locale)}
                  </p>
                )}
                <div className="flex items-center gap-2 text-gray-500 mb-4">
                  <MapPin size={18} /> {ad.location}
                </div>
                {showContact && phoneLink && (
                  <div className="space-y-3 border-t pt-4">
                    <a
                      href={`tel:+${phoneLink}`}
                      className="w-full flex items-center justify-center gap-3 bg-[#FF6321] py-3 rounded-2xl font-bold text-white hover:bg-[#e85a1e]"
                    >
                      <Phone size={18} /> {t("product.callSeller")}
                    </a>
                    <a
                      href={`https://wa.me/${phoneLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-3 border-2 border-[#FF6321] py-3 rounded-2xl font-bold text-[#FF6321] hover:bg-orange-50"
                    >
                      <MessageCircle size={18} /> {t("product.whatsapp")}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {relatedAds.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8">{t("product.relatedItems")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedAds.map((item) => (
                <AdCard
                  key={item.id}
                  {...item}
                  price={String(getDisplayPrice(item))}
                  category={item.category_slug}
                  imageUrl={item.images?.[0]}
                  status={item.status}
                  listing_type={item.listing_type}
                  auction_current_bid={item.auction_current_bid}
                  auction_bid_count={item.auction_bid_count}
                  auction_ends_at={item.auction_ends_at}
                  auction_status={item.auction_status}
                  specs={extractSpecs(item.attributes)}
                  makeName={item.attributes?.make_id ? makesMap[item.attributes.make_id] : undefined}
                  modelName={item.attributes?.model_id ? modelsMap[item.attributes.model_id] : undefined}
                  postedDate={item.created_at ? new Date(item.created_at).toLocaleDateString() : undefined}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
