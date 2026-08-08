import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "About | Yaddii Marketplace",
  description: "About Yaddii — Egypt's classifieds marketplace.",
};

export default function AboutPage() {
  return (
    <LegalPageLayout title="About Yaddii">
      <p>
        Yaddii is a classifieds marketplace built for Egypt. List vehicles, properties,
        electronics, fashion, services, and more — or browse what others are selling near you.
      </p>
      <p>
        Sellers post ads that go through a quick review before going live. Buyers can search by
        category, filter by attributes, save favorites, and contact sellers directly by phone or
        WhatsApp.
      </p>
      <p>
        This page will be expanded with more about our mission, team, and contact details as Yaddii
        grows. For now, explore listings on the home page or post your first ad to get started.
      </p>
    </LegalPageLayout>
  );
}
