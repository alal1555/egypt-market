"use client";

import { useEffect, useState } from "react";
import { MapPin, Tag, Hourglass, Phone, Layers } from "lucide-react";
import type { AdminContent } from "@/i18n/content/admin.en";
import { localizedSubCategoryName, formatAttributeValue, getAttributeLabelForKey, localizedAttributeLabel } from "@/i18n/catalog";
import { cleanAdAttributes } from "@/lib/utils";
import type { Locale } from "@/i18n/types";

export type AdminReviewAd = {
  id: string;
  title: string;
  price: number;
  location: string;
  status: string;
  description?: string;
  images?: string[];
  created_at: string;
  expires_at?: string | null;
  category_slug?: string;
  seller_phone?: string | null;
  attributes?: Record<string, unknown>;
  listing_type?: string;
  auction_duration_hours?: number | null;
  moderation_note?: string | null;
  moderation_note_at?: string | null;
};

type Props = {
  ad: AdminReviewAd;
  c: AdminContent;
  egpLabel: string;
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
  makesMap: Record<number, string>;
  modelsMap: Record<number, string>;
  showPendingActions: boolean;
  onUpdateStatus: (id: string, status: "active" | "banned") => void;
  onSaveModerationNote: (id: string, note: string) => Promise<boolean>;
};

export default function AdminAdReviewPanel({
  ad,
  c,
  egpLabel,
  locale,
  t,
  makesMap,
  modelsMap,
  showPendingActions,
  onUpdateStatus,
  onSaveModerationNote,
}: Props) {
  const [noteDraft, setNoteDraft] = useState(ad.moderation_note ?? "");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    setNoteDraft(ad.moderation_note ?? "");
  }, [ad.id, ad.moderation_note]);

  const attrs = cleanAdAttributes(ad.attributes ?? {});
  const btn =
    "font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-2xs disabled:opacity-50";

  const handleSendNote = async () => {
    const trimmed = noteDraft.trim();
    if (!trimmed) return;
    setSavingNote(true);
    const ok = await onSaveModerationNote(ad.id, trimmed);
    setSavingNote(false);
    if (ok) alert(c.moderationSent);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">
              {c.listingName}
            </h4>
            <p className="text-lg font-bold text-gray-900">{ad.title}</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            <span className="flex items-center gap-1 bg-white border px-2.5 py-1 rounded-md">
              <Tag size={12} className="text-orange-500 shrink-0" /> {ad.price} {egpLabel}
            </span>
            <span className="flex items-center gap-1 bg-white border px-2.5 py-1 rounded-md">
              <MapPin size={12} className="text-gray-400 shrink-0" /> {ad.location}
            </span>
            {ad.category_slug ? (
              <span className="flex items-center gap-1 bg-white border px-2.5 py-1 rounded-md">
                <Layers size={12} className="text-gray-400 shrink-0" />
                {localizedSubCategoryName(ad.category_slug, locale)}
              </span>
            ) : null}
            {ad.seller_phone ? (
              <span className="flex items-center gap-1 bg-white border px-2.5 py-1 rounded-md">
                <Phone size={12} className="text-gray-400 shrink-0" /> {ad.seller_phone}
              </span>
            ) : null}
            <span className="bg-white border px-2.5 py-1 rounded-md">
              {ad.listing_type === "auction" ? c.auctionListing : c.fixedPriceListing}
            </span>
            <span className="bg-white border px-2.5 py-1 rounded-md text-gray-500">
              {c.postedAt.replace("{date}", new Date(ad.created_at).toLocaleString(locale === "ar" ? "ar-EG" : "en-GB"))}
            </span>
            {ad.expires_at && ad.status === "active" && (
              <span className="flex items-center gap-1 bg-white border px-2.5 py-1 rounded-md">
                <Hourglass size={12} className="text-gray-400 shrink-0" />
                {c.liveUntil.replace("{date}", new Date(ad.expires_at).toLocaleDateString())}
              </span>
            )}
          </div>

          <div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">
              {c.listingDescription}
            </h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
              {ad.description || c.noDescription}
            </p>
          </div>

          {Object.keys(attrs).length > 0 && (
            <div>
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
                {c.specifications}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(attrs).map(([key, value]) => {
                  const enLabel = ad.category_slug
                    ? getAttributeLabelForKey(ad.category_slug, key)
                    : key;
                  const label = localizedAttributeLabel(enLabel, locale);
                  const val = formatAttributeValue(value, locale, t, key, makesMap, modelsMap);
                  return (
                    <div key={key} className="bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase">{label}</span>
                      <span className="font-semibold text-gray-800">{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
            {c.imageGallery}
          </h4>
          {ad.images && ad.images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ad.images.map((imgUrl, idx) => (
                <a
                  key={idx}
                  href={imgUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group block relative overflow-hidden bg-gray-100 rounded-xl border border-gray-200 aspect-square"
                >
                  <img
                    src={imgUrl}
                    alt={`Ad ${idx + 1}`}
                    className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
                  />
                </a>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400 border border-dashed rounded-xl p-6 text-center bg-white">
              {c.noImages}
            </div>
          )}
        </div>
      </div>

      {ad.status === "pending" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 space-y-3">
          <h4 className="text-sm font-bold text-amber-950">{c.moderationTitle}</h4>
          {ad.moderation_note_at && (
            <p className="text-xs text-amber-800">
              {c.moderationLastSent.replace(
                "{date}",
                new Date(ad.moderation_note_at).toLocaleString(locale === "ar" ? "ar-EG" : "en-GB"),
              )}
            </p>
          )}
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder={c.moderationPlaceholder}
            rows={4}
            className="w-full text-sm rounded-xl border border-amber-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6321]/40"
          />
          <button
            type="button"
            disabled={savingNote || !noteDraft.trim()}
            onClick={() => void handleSendNote()}
            className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {c.moderationSend}
          </button>
        </div>
      )}

      {showPendingActions && ad.status === "pending" && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
          <button
            type="button"
            onClick={() => onUpdateStatus(ad.id, "active")}
            className={`${btn} bg-green-600 hover:bg-green-700 text-white`}
          >
            {c.approve}
          </button>
          <button
            type="button"
            onClick={() => onUpdateStatus(ad.id, "banned")}
            className={`${btn} bg-red-50 hover:bg-red-100 text-red-600 shadow-none`}
          >
            {c.reject}
          </button>
        </div>
      )}
    </div>
  );
}
