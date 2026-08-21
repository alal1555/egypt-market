"use client";

import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ShareAdPayload } from "@/lib/share-ad";
import { YADDII_BRAND } from "@/lib/share-ad";

Font.register({
  family: "Almarai",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/almarai@5.0.13/files/almarai-arabic-400-normal.woff",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/almarai@5.0.13/files/almarai-arabic-700-normal.woff",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  pageAr: {
    fontFamily: "Almarai",
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
    fontSize: 12,
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
    fontSize: 10,
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
  category: {
    color: YADDII_BRAND,
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 10,
    lineHeight: 1.3,
  },
  price: {
    fontSize: 26,
    fontWeight: 700,
    color: YADDII_BRAND,
    marginBottom: 4,
  },
  priceHint: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 10,
  },
  location: {
    fontSize: 12,
    color: "#4b5563",
    marginBottom: 12,
  },
  specsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  specChip: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 9,
    color: "#374151",
  },
  description: {
    fontSize: 11,
    lineHeight: 1.5,
    color: "#4b5563",
    marginBottom: 10,
  },
  contact: {
    fontSize: 11,
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
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 4,
  },
  footerLine: {
    fontSize: 10,
    color: YADDII_BRAND,
    fontWeight: 700,
    marginBottom: 4,
  },
  productUrl: {
    fontSize: 8,
    color: "#9ca3af",
  },
  qr: {
    width: 72,
    height: 72,
  },
});

type Props = {
  data: ShareAdPayload;
  locale: string;
};

export default function ShareAdPdfDocument({ data, locale }: Props) {
  const isAr = locale === "ar";
  const desc =
    data.description.length > 400 ? `${data.description.slice(0, 397).trim()}…` : data.description;

  return (
    <Document title={data.title} author="Yaddii Marketplace">
      <Page size="A4" style={[styles.page, isAr ? styles.pageAr : {}]}>
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
            <Image src={data.logoUrl} style={styles.logo} />
          </View>
          <Text style={styles.headerHost}>{data.siteHost}</Text>
        </View>

        <View style={styles.hero}>
          {data.imageDataUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={data.imageDataUrl} style={styles.heroImage} />
          ) : null}
          {data.isAuction && (
            <Text style={styles.auctionBadge}>{isAr ? "مزاد" : "Auction"}</Text>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.category}>{data.categoryLabel}</Text>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.price}>{data.priceDisplay}</Text>
          {data.priceHint ? <Text style={styles.priceHint}>{data.priceHint}</Text> : null}
          <Text style={styles.location}>{data.location}</Text>

          {data.specs.length > 0 && (
            <View style={styles.specsRow}>
              {data.specs.map((spec) => (
                <Text key={`${spec.label}-${spec.value}`} style={styles.specChip}>
                  {spec.label}: {spec.value}
                </Text>
              ))}
            </View>
          )}

          {desc ? <Text style={styles.description}>{desc}</Text> : null}
          {data.sellerPhone ? (
            <Text style={styles.contact}>
              {isAr ? "للتواصل:" : "Contact:"} {data.sellerPhone}
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
