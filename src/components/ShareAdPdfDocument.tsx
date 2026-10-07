"use client";

import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ShareAdPayload } from "@/lib/share-ad";
import { shareUsesArabicTypography, YADDII_BRAND } from "@/lib/share-ad";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Almarai",
    fontSize: 13,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: YADDII_BRAND,
    paddingHorizontal: 28,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerHost: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 700,
  },
  logoWrap: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logo: {
    height: 28,
    width: 100,
    objectFit: "contain",
  },
  hero: {
    height: 260,
    backgroundColor: "#f3f4f6",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  auctionBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: YADDII_BRAND,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 700,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  body: {
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 12,
    flexGrow: 1,
  },
  bodyRtl: {
    direction: "rtl",
    textAlign: "right",
  },
  specsRowRtl: {
    flexDirection: "row-reverse",
  },
  specChipRtl: {
    marginRight: 0,
    marginLeft: 6,
  },
  category: {
    color: YADDII_BRAND,
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    marginBottom: 12,
    lineHeight: 1.35,
  },
  price: {
    fontSize: 32,
    fontWeight: 800,
    color: YADDII_BRAND,
    marginBottom: 6,
  },
  priceHint: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 12,
  },
  location: {
    fontSize: 15,
    color: "#4b5563",
    marginBottom: 14,
  },
  specsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 14,
  },
  specChip: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 6,
    marginBottom: 6,
    minHeight: 36,
    justifyContent: "center",
  },
  specChipText: {
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
    lineHeight: 1.35,
  },
  description: {
    fontSize: 14,
    lineHeight: 1.55,
    color: "#4b5563",
    marginBottom: 12,
  },
  contact: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fafafa",
    paddingHorizontal: 28,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  footerTextWrap: {
    flex: 1,
  },
  tagline: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  footerLine: {
    fontSize: 12,
    color: YADDII_BRAND,
    fontWeight: 700,
    marginBottom: 4,
  },
  productUrl: {
    fontSize: 9,
    color: "#9ca3af",
  },
  qr: {
    width: 80,
    height: 80,
  },
});

type Props = {
  data: ShareAdPayload;
  locale: string;
};

export default function ShareAdPdfDocument({ data, locale }: Props) {
  const useAr = shareUsesArabicTypography({
    locale,
    title: data.title,
    description: data.description,
    location: data.location,
    specs: data.specs,
  });
  const desc =
    data.description.length > 400 ? `${data.description.slice(0, 397).trim()}…` : data.description;
  const bodyRtl = locale === "ar";

  return (
    <Document title={data.title} author="Yaddii Marketplace">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
            <Image src={data.logoUrl} style={styles.logo} />
          </View>
          <Text style={styles.headerHost}>{data.siteHost}</Text>
        </View>

        <View style={styles.hero}>
          {(data.imageDataUrl ?? data.imageUrl) ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={data.imageDataUrl ?? data.imageUrl!} style={styles.heroImage} />
          ) : null}
          {data.isAuction && (
            <Text style={styles.auctionBadge}>{useAr ? "مزاد" : "Auction"}</Text>
          )}
        </View>

        <View style={[styles.body, bodyRtl ? styles.bodyRtl : {}]}>
          <Text style={styles.category}>{data.categoryLabel}</Text>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.price}>{data.priceDisplay}</Text>
          {data.priceHint ? <Text style={styles.priceHint}>{data.priceHint}</Text> : null}
          <Text style={styles.location}>{data.location}</Text>

          {data.specs.length > 0 && (
            <View style={[styles.specsRow, bodyRtl ? styles.specsRowRtl : {}]}>
              {data.specs.map((spec) => (
                <View
                  key={`${spec.label}-${spec.value}`}
                  style={[styles.specChip, bodyRtl ? styles.specChipRtl : {}]}
                >
                  <Text style={styles.specChipText}>
                    {spec.label}: {spec.value}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {desc ? <Text style={styles.description}>{desc}</Text> : null}
          {data.sellerPhone ? (
            <Text style={styles.contact}>
              {useAr ? "للتواصل:" : "Contact:"} {data.sellerPhone}
            </Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          {data.qrDataUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={data.qrDataUrl} style={styles.qr} />
          ) : null}
          <View style={styles.footerTextWrap}>
            <Text style={styles.tagline}>{data.tagline}</Text>
            <Text style={styles.footerLine}>{data.footerLine}</Text>
            <Text style={styles.productUrl}>{data.productUrl}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
