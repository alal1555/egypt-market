import type { Metadata } from "next";
import PricingClient from "./PricingClient";
import { FREE_LISTINGS_PROMO } from "@/constants/adPricing";

export const metadata: Metadata = FREE_LISTINGS_PROMO
  ? {
      title: "Free listings | Yaddii",
      description: "Post classified ads on Yaddii for free — all categories on yaddii.com.",
    }
  : {
      title: "Ad Pricing | Yaddii Marketplace",
      description:
        "Yaddii ad posting prices — free starter ads, welcome wallet balance, and standard listing fees in EGP.",
    };

export default function PricingPage() {
  return <PricingClient />;
}
