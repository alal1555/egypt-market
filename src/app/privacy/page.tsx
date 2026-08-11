import type { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = {
  title: "Privacy Policy | Yaddii Marketplace",
  description: "Privacy policy for Yaddii Marketplace.",
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
