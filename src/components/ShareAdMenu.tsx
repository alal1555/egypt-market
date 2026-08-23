"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Share2, Link2, ImageIcon, FileText, X, Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n/LocaleProvider";
import {
  formatAttributeValue,
  getAttributeLabelForKey,
  localizedAttributeLabel,
  localizedSubCategoryName,
} from "@/i18n/catalog";
import { cleanAdAttributes } from "@/lib/utils";
import { isAuctionListing } from "@/constants/auction";
import ShareAdFlyer from "@/components/ShareAdFlyer";
import {
  buildSharePayload,
  downloadBlob,
  downloadDataUrl,
  fetchImageAsDataUrl,
  generateQrDataUrl,
  getShareProductUrl,
  safeFilename,
  shareOrCopyLink,
  shareOrDownloadFile,
  type ShareAdPayload,
  type ShareAdSpec,
} from "@/lib/share-ad";

export type ShareAdInput = {
  id: string;
  title: string;
  price: number;
  location: string;
  description?: string | null;
  images?: string[] | null;
  seller_phone?: string | null;
  category_slug: string;
  attributes?: Record<string, unknown> | null;
  listing_type?: string | null;
  auction_current_bid?: number | null;
};

type Props = {
  ad: ShareAdInput;
  makesMap?: Record<number, string>;
  modelsMap?: Record<number, string>;
  className?: string;
  variant?: "button" | "icon";
};

export default function ShareAdMenu({
  ad,
  makesMap = {},
  modelsMap = {},
  className = "",
  variant = "button",
}: Props) {
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [exportPayload, setExportPayload] = useState<ShareAdPayload | null>(null);
  const flyerRef = useRef<HTMLDivElement>(null);

  const specs = useMemo((): ShareAdSpec[] => {
    const attrs = cleanAdAttributes(ad.attributes);
    return Object.entries(attrs)
      .slice(0, 6)
      .map(([key, value]) => {
        const enLabel = getAttributeLabelForKey(ad.category_slug, key);
        const label = localizedAttributeLabel(enLabel, locale);
        const val = formatAttributeValue(value, locale, t, key, makesMap, modelsMap);
        return { label, value: val };
      })
      .filter((s) => s.value);
  }, [ad.attributes, ad.category_slug, locale, makesMap, modelsMap, t]);

  const priceHint = useMemo(() => {
    if (!isAuctionListing(ad)) return "";
    const hasBid = (ad.auction_current_bid ?? 0) > 0;
    return hasBid ? t("shareAd.currentBidLabel") : t("shareAd.startingBidLabel");
  }, [ad, t]);

  const payload = useMemo((): ShareAdPayload => {
    const base = buildSharePayload({
      ...ad,
      categoryLabel: localizedSubCategoryName(ad.category_slug, locale),
      specs,
      tagline: t("shareAd.tagline"),
      footerLine: "",
      priceHint,
      egpLabel: t("common.egp"),
      imageDataUrl,
      qrDataUrl,
    });
    return {
      ...base,
      footerLine: t("shareAd.footerLine", { site: base.siteHost }),
    };
  }, [ad, imageDataUrl, locale, priceHint, qrDataUrl, specs, t]);

  useEffect(() => {
    if (!open) return;
    let active = true;

    async function prepareAssets() {
      const productUrl = getShareProductUrl(ad.id);
      const [img, qr] = await Promise.all([
        ad.images?.[0] ? fetchImageAsDataUrl(ad.images[0]) : Promise.resolve(null),
        generateQrDataUrl(productUrl),
      ]);
      if (!active) return;
      setImageDataUrl(img);
      setQrDataUrl(qr);
    }

    void prepareAssets();
    return () => {
      active = false;
    };
  }, [open, ad.id, ad.images]);

  const filenameBase = safeFilename(ad.title);

  const ensurePayload = useCallback(async (): Promise<ShareAdPayload> => {
    const productUrl = getShareProductUrl(ad.id);
    const imageUrl = ad.images?.[0] ?? null;
    const [img, qr] = await Promise.all([
      imageUrl ? fetchImageAsDataUrl(imageUrl) : Promise.resolve(null),
      qrDataUrl ? Promise.resolve(qrDataUrl) : generateQrDataUrl(productUrl),
    ]);
    if (img !== imageDataUrl) setImageDataUrl(img);
    if (qr !== qrDataUrl) setQrDataUrl(qr);
    const base = buildSharePayload({
      ...ad,
      categoryLabel: localizedSubCategoryName(ad.category_slug, locale),
      specs,
      tagline: t("shareAd.tagline"),
      footerLine: "",
      priceHint,
      egpLabel: t("common.egp"),
      imageDataUrl: img,
      qrDataUrl: qr,
    });
    return { ...base, footerLine: t("shareAd.footerLine", { site: base.siteHost }) };
  }, [ad, imageDataUrl, locale, priceHint, qrDataUrl, specs, t]);

  const handleCopyLink = useCallback(async () => {
    setBusy("link");
    setMessage(null);
    try {
      const result = await shareOrCopyLink(payload.productUrl, ad.title);
      setMessage(result === "shared" ? t("shareAd.linkShared") : t("shareAd.linkCopied"));
    } catch {
      setMessage(t("shareAd.error"));
    } finally {
      setBusy(null);
    }
  }, [ad.title, payload.productUrl, t]);

  const handleShareImage = useCallback(async () => {
    setBusy("image");
    setMessage(null);
    try {
      const readyPayload = await ensurePayload();
      setExportPayload(readyPayload);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const node = flyerRef.current;
      if (!node) throw new Error("flyer_missing");
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
      const file = new File([await (await fetch(dataUrl)).blob()], `${filenameBase}.png`, {
        type: "image/png",
      });
      await shareOrDownloadFile(file, ad.title, async () => {
        await downloadDataUrl(dataUrl, `${filenameBase}.png`);
      });
      setMessage(t("shareAd.imageReady"));
    } catch {
      setMessage(t("shareAd.error"));
    } finally {
      setExportPayload(null);
      setBusy(null);
    }
  }, [ad.title, ensurePayload, filenameBase, t]);

  const handleSharePdf = useCallback(async () => {
    setBusy("pdf");
    setMessage(null);
    try {
      const readyPayload = await ensurePayload();
      const [{ pdf }, { default: ShareAdPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/ShareAdPdfDocument"),
      ]);
      const blob = await pdf(<ShareAdPdfDocument data={readyPayload} locale={locale} />).toBlob();
      const file = new File([blob], `${filenameBase}.pdf`, { type: "application/pdf" });
      await shareOrDownloadFile(file, ad.title, async () => {
        await downloadBlob(blob, `${filenameBase}.pdf`);
      });
      setMessage(t("shareAd.pdfReady"));
    } catch {
      setMessage(t("shareAd.error"));
    } finally {
      setBusy(null);
    }
  }, [ad.title, ensurePayload, filenameBase, locale, t]);

  const triggerClass =
    variant === "icon"
      ? "p-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-[#FF6321] hover:text-[#FF6321] transition"
      : "flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-bold border border-gray-200 bg-white text-gray-800 hover:border-[#FF6321] hover:text-[#FF6321] transition";

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Share2 size={variant === "icon" ? 18 : 16} />
        {variant === "button" && t("shareAd.button")}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label={t("shareAd.close")}
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-50 mt-2 w-64 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden end-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-black text-gray-900">{t("shareAd.title")}</span>
              <button type="button" onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>
            <div className="p-2 space-y-1">
              <MenuAction
                icon={<Link2 size={16} />}
                label={t("shareAd.copyLink")}
                busy={busy === "link"}
                onClick={handleCopyLink}
              />
              <MenuAction
                icon={<ImageIcon size={16} />}
                label={t("shareAd.shareImage")}
                busy={busy === "image"}
                onClick={handleShareImage}
              />
              <MenuAction
                icon={<FileText size={16} />}
                label={t("shareAd.sharePdf")}
                busy={busy === "pdf"}
                onClick={handleSharePdf}
              />
            </div>
            {message && (
              <p className="px-4 pb-3 text-xs font-medium text-emerald-700">{message}</p>
            )}
          </div>
        </>
      )}

      <div
        aria-hidden
        style={{ position: "fixed", left: -9999, top: 0, pointerEvents: "none", opacity: 0 }}
      >
        <ShareAdFlyer ref={flyerRef} data={exportPayload ?? payload} locale={locale} />
      </div>
    </div>
  );
}

function MenuAction({
  icon,
  label,
  busy,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-800 hover:bg-orange-50 hover:text-[#FF6321] transition disabled:opacity-60"
    >
      {busy ? <Loader2 size={16} className="animate-spin shrink-0" /> : icon}
      {label}
    </button>
  );
}
