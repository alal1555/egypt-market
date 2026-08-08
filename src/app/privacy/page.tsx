import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | Yaddii Marketplace",
  description: "Privacy policy for Yaddii Marketplace.",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <p>
        Yaddii respects your privacy. This page summarizes how we handle information today. A full
        privacy policy will be published before public launch.
      </p>
      <p>
        <strong>Account data.</strong> When you sign up, we store your email, name, and phone number
        through our authentication provider (Supabase) to operate your account and listings.
      </p>
      <p>
        <strong>Listings.</strong> Ad titles, descriptions, prices, locations, photos, and
        attributes you submit are stored so they can be shown to other users. Seller phone numbers
        may appear on active listings for buyer contact.
      </p>
      <p>
        <strong>Usage.</strong> We use standard hosting and database services to run the site. We do
        not sell your personal data to third parties.
      </p>
      <p>
        <strong>Your choices.</strong> You can update your profile, delete your listings, and sign
        out at any time. To request account deletion, contact us when a support channel is
        available.
      </p>
      <p className="text-gray-500 text-sm">Last updated: August 2026.</p>
    </LegalPageLayout>
  );
}
