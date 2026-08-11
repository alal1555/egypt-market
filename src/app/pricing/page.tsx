import type { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "Ad Pricing | Yaddii Marketplace",
  description: "Yaddii ad posting prices — free starter ads, welcome wallet balance, and standard listing fees in EGP.",
};

export default function PricingPage() {
  return <PricingClient />;
}
