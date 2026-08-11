import type { Metadata } from "next";
import TermsClient from "./TermsClient";

export const metadata: Metadata = {
  title: "Terms of Use | Yaddii Marketplace",
  description: "Terms of use for Yaddii Marketplace.",
};

export default function TermsPage() {
  return <TermsClient />;
}
