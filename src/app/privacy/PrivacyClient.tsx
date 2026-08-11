"use client";

import LegalPageLayout from "@/components/LegalPageLayout";
import { useTranslation } from "@/i18n/LocaleProvider";
import { privacyAr } from "@/i18n/content/legal.ar";
import { privacyEn } from "@/i18n/content/legal.en";

export default function PrivacyClient() {
  const { locale } = useTranslation();
  const content = locale === "ar" ? privacyAr : privacyEn;

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
