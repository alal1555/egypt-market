"use client";

import LegalPageLayout from "@/components/LegalPageLayout";
import { useTranslation } from "@/i18n/LocaleProvider";
import { termsAr } from "@/i18n/content/legal.ar";
import { termsEn } from "@/i18n/content/legal.en";

export default function TermsClient() {
  const { locale } = useTranslation();
  const content = locale === "ar" ? termsAr : termsEn;

  return (
    <LegalPageLayout title={content.title}>
      {content.paragraphs.map((paragraph, i) => (
        <p key={i} className={i === content.paragraphs.length - 1 ? "text-gray-500 text-sm" : undefined}>
          {paragraph}
        </p>
      ))}
    </LegalPageLayout>
  );
}
