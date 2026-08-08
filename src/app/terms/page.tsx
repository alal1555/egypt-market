import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Terms of Use | Yaddii Marketplace",
  description: "Terms of use for Yaddii Marketplace.",
};

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Use">
      <p>
        By using Yaddii Marketplace, you agree to these terms. This is a placeholder summary —
        full legal terms will be published before public launch.
      </p>
      <p>
        <strong>Listings.</strong> You are responsible for the accuracy of your ads, photos, and
        contact information. Misleading, illegal, or prohibited items may be removed without notice.
      </p>
      <p>
        <strong>Transactions.</strong> Yaddii connects buyers and sellers but is not a party to any
        sale. Meet safely, verify items in person, and use your judgment when paying or exchanging
        goods.
      </p>
      <p>
        <strong>Accounts.</strong> Keep your login credentials secure. You may not impersonate others
        or use the platform for spam, fraud, or harassment.
      </p>
      <p>
        <strong>Moderation.</strong> We may approve, reject, or remove listings to keep the
        marketplace safe and useful. Edited ads may require re-approval.
      </p>
      <p className="text-gray-500 text-sm">
        Last updated: August 2026. Contact us through the platform when a support channel is
        available.
      </p>
    </LegalPageLayout>
  );
}
