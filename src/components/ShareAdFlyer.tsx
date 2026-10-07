"use client";

import { forwardRef } from "react";
import type { ShareAdPayload } from "@/lib/share-ad";
import {
  shareUsesArabicTypography,
  SHARE_FLYER_FONT_AR,
  SHARE_FLYER_FONT_EN,
  YADDII_BRAND,
} from "@/lib/share-ad";

type Props = {
  data: ShareAdPayload;
  locale: string;
};

const W = 800;
const H = 1180;

const ShareAdFlyer = forwardRef<HTMLDivElement, Props>(function ShareAdFlyer({ data, locale }, ref) {
  const useAr = shareUsesArabicTypography({
    locale,
    title: data.title,
    description: data.description,
    location: data.location,
    specs: data.specs,
  });
  const dir = useAr ? "rtl" : "ltr";
  const desc =
    data.description.length > 220 ? `${data.description.slice(0, 217).trim()}…` : data.description;

  return (
    <div
      ref={ref}
      style={{
        width: W,
        height: H,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        fontFamily: useAr ? SHARE_FLYER_FONT_AR : SHARE_FLYER_FONT_EN,
        background: "#ffffff",
        color: "#111827",
        overflow: "hidden",
        direction: dir,
      }}
    >
      <div
        style={{
          background: YADDII_BRAND,
          padding: "22px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            background: "#ffffff",
            borderRadius: 8,
            padding: "6px 10px",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.logoUrl} alt="Yaddii" style={{ height: 36, width: "auto", display: "block" }} />
        </span>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 17, letterSpacing: 0.5 }}>
          {data.siteHost}
        </span>
      </div>

      <div style={{ width: "100%", height: 360, background: "#f3f4f6", position: "relative" }}>
        {data.imageDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.imageDataUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            Yaddii
          </div>
        )}
        {data.isAuction && (
          <span
            style={{
              position: "absolute",
              top: 16,
              left: useAr ? undefined : 16,
              right: useAr ? 16 : undefined,
              background: YADDII_BRAND,
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              padding: "8px 14px",
              borderRadius: 8,
              textTransform: "uppercase",
            }}
          >
            {useAr ? "مزاد" : "Auction"}
          </span>
        )}
      </div>

      <div style={{ padding: "26px 28px 20px", flex: 1 }}>
        <p
          style={{
            margin: "0 0 10px",
            fontSize: 16,
            fontWeight: 800,
            color: YADDII_BRAND,
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          {data.categoryLabel}
        </p>
        <h1
          style={{
            margin: "0 0 14px",
            fontSize: 34,
            fontWeight: 800,
            lineHeight: 1.3,
            color: "#111827",
          }}
        >
          {data.title}
        </h1>
        <p style={{ margin: "0 0 8px", fontSize: 42, fontWeight: 900, color: YADDII_BRAND, lineHeight: 1.15 }}>
          {data.priceDisplay}
        </p>
        {data.priceHint && (
          <p style={{ margin: "0 0 16px", fontSize: 16, color: "#6b7280", fontWeight: 600 }}>
            {data.priceHint}
          </p>
        )}
        <p style={{ margin: "0 0 18px", fontSize: 18, color: "#4b5563", fontWeight: 600, lineHeight: 1.4 }}>
          📍 {data.location}
        </p>

        {data.specs.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
            {data.specs.map((spec) => (
              <span
                key={`${spec.label}-${spec.value}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                  minHeight: 44,
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 15,
                  fontWeight: 700,
                  lineHeight: 1.35,
                  color: "#374151",
                  whiteSpace: "nowrap",
                }}
              >
                {spec.label}: {spec.value}
              </span>
            ))}
          </div>
        )}

        {desc && (
          <p
            style={{
              margin: "0 0 20px",
              fontSize: 17,
              lineHeight: 1.55,
              color: "#4b5563",
              whiteSpace: "pre-wrap",
            }}
          >
            {desc}
          </p>
        )}

        {data.sellerPhone && (
          <p style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 700, color: "#111827" }}>
            {useAr ? "للتواصل:" : "Contact:"} {data.sellerPhone}
          </p>
        )}
      </div>

      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: "20px 28px",
          display: "flex",
          alignItems: "center",
          gap: 20,
          background: "#fafafa",
          marginTop: "auto",
        }}
      >
        {data.qrDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.qrDataUrl} alt="" style={{ width: 96, height: 96, borderRadius: 8 }} />
        )}
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111827", lineHeight: 1.4 }}>
            {data.tagline}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 15, color: YADDII_BRAND, fontWeight: 700 }}>
            {data.footerLine}
          </p>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 12,
              color: "#9ca3af",
              wordBreak: "break-all",
              direction: "ltr",
              textAlign: useAr ? "right" : "left",
            }}
          >
            {data.productUrl}
          </p>
        </div>
      </div>
    </div>
  );
});

export default ShareAdFlyer;
