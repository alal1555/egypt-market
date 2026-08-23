/** Share ad as link, branded image, or PDF. */

import QRCode from "qrcode";
import { getDisplayPrice, isAuctionListing } from "@/constants/auction";

export const YADDII_BRAND = "#FF6321";
export const YADDII_PUBLIC_ORIGIN = "https://yaddii.com";
export const YADDII_PUBLIC_HOST = "yaddii.com";

function isLocalOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    if (/^localhost$|^127\.0\.0\.1$|^0\.0\.0\.0$/i.test(hostname)) return true;
    // LAN / mobile dev over IP (e.g. http://192.168.x.x:3000)
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return true;
    return false;
  } catch {
    return true;
  }
}

export type ShareAdSpec = { label: string; value: string };

export type ShareAdPayload = {
  id: string;
  title: string;
  priceDisplay: string;
  priceHint: string;
  location: string;
  description: string;
  categoryLabel: string;
  imageDataUrl: string | null;
  imageUrl: string | null;
  specs: ShareAdSpec[];
  sellerPhone: string | null;
  isAuction: boolean;
  productUrl: string;
  siteUrl: string;
  siteHost: string;
  logoUrl: string;
  tagline: string;
  footerLine: string;
  qrDataUrl: string | null;
};

export function getSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") return window.location.origin;
  return "https://yaddii.com";
}

export function getProductUrl(adId: string, origin?: string): string {
  const base = origin ?? getSiteOrigin();
  return `${base}/product/${adId}`;
}

export function getSiteHost(origin?: string): string {
  try {
    return new URL(origin ?? getSiteOrigin()).host.replace(/^www\./, "");
  } catch {
    return YADDII_PUBLIC_HOST;
  }
}

/** Public-facing domain for share links, QR codes, and flyer text (never localhost or LAN IP). */
export function getShareDisplayOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured && !isLocalOrigin(configured)) return configured;
  return YADDII_PUBLIC_ORIGIN;
}

export function getShareDisplayHost(): string {
  const host = getShareDisplayHostFromOrigin(getShareDisplayOrigin());
  return isLocalOrigin(`https://${host}`) ? YADDII_PUBLIC_HOST : host;
}

function getShareDisplayHostFromOrigin(origin: string): string {
  try {
    return new URL(origin).host.replace(/^www\./, "");
  } catch {
    return YADDII_PUBLIC_HOST;
  }
}

export function getShareProductUrl(adId: string): string {
  return getProductUrl(adId, getShareDisplayOrigin());
}

export async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  const blob = await fetchImageBlob(url);
  if (!blob) return null;
  return blobToJpegDataUrl(blob);
}

async function fetchImageBlob(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) return await res.blob();
  } catch {
    /* direct fetch blocked — try same-origin proxy */
  }

  try {
    const proxy = `/api/share/image?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxy);
    if (res.ok) return await res.blob();
  } catch {
    return null;
  }

  return null;
}

/** react-pdf reliably renders JPEG/PNG data URLs (not WebP). */
async function blobToJpegDataUrl(blob: Blob): Promise<string | null> {
  if (typeof document === "undefined") return null;

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      try {
        const maxW = 1200;
        const scale = Math.min(1, maxW / Math.max(img.naturalWidth, 1));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      } catch {
        resolve(null);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    img.src = objectUrl;
  });
}

export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 200,
    color: { dark: "#111827", light: "#ffffff" },
  });
}

export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function downloadDataUrl(dataUrl: string, filename: string): Promise<void> {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

/** Native file share is useful on phones; desktop should download directly. */
export function shouldUseNativeFileShare(): boolean {
  if (typeof navigator === "undefined") return false;
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return mobile && typeof navigator.share === "function";
}

export async function shareOrDownloadFile(
  file: File,
  title: string,
  fallbackDownload: () => void | Promise<void>,
): Promise<boolean> {
  if (shouldUseNativeFileShare()) {
    try {
      const payload: ShareData = { title, files: [file] };
      if (navigator.canShare?.(payload)) {
        await navigator.share(payload);
        return true;
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return true;
    }
  }
  await fallbackDownload();
  return false;
}

export async function shareOrCopyLink(url: string, title: string): Promise<"shared" | "copied"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return "shared";
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}

export function safeFilename(title: string): string {
  return (
    title
      .trim()
      .slice(0, 40)
      .replace(/[^\w\u0600-\u06FF\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase() || "yaddii-ad"
  );
}

type BuildShareInput = {
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
  categoryLabel: string;
  specs: ShareAdSpec[];
  tagline: string;
  footerLine: string;
  priceHint: string;
  egpLabel: string;
  imageDataUrl?: string | null;
  qrDataUrl?: string | null;
};

export function buildSharePayload(input: BuildShareInput): ShareAdPayload {
  const assetOrigin = getSiteOrigin();
  const displayOrigin = getShareDisplayOrigin();
  const displayAmount = getDisplayPrice({
    listing_type: input.listing_type ?? undefined,
    price: input.price,
    auction_current_bid: input.auction_current_bid ?? null,
  });

  return {
    id: input.id,
    title: input.title,
    priceDisplay: `${displayAmount.toLocaleString()} ${input.egpLabel}`,
    priceHint: input.priceHint,
    location: input.location,
    description: (input.description || "").trim(),
    categoryLabel: input.categoryLabel,
    imageDataUrl: input.imageDataUrl ?? null,
    imageUrl: input.images?.[0] ?? null,
    specs: input.specs.slice(0, 4),
    sellerPhone: input.seller_phone ?? null,
    isAuction: isAuctionListing({ listing_type: input.listing_type }),
    productUrl: getProductUrl(input.id, displayOrigin),
    siteUrl: displayOrigin,
    siteHost: getShareDisplayHost(),
    logoUrl: `${assetOrigin}/logo-nav.png`,
    tagline: input.tagline,
    footerLine: input.footerLine,
    qrDataUrl: input.qrDataUrl ?? null,
  };
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, body] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/png";
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
