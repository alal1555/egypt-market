"use client";

import LegalPageLayout from "@/components/LegalPageLayout";
import { useTranslation } from "@/i18n/LocaleProvider";
import { aboutAr } from "@/i18n/content/legal.ar";
import { aboutEn } from "@/i18n/content/legal.en";

export default function AboutClient() {
  const { locale } = useTranslation();
  const content = locale === "ar" ? aboutAr : aboutEn;

  return (
    <LegalPageLayout title={content.title}>
      {content.paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 40)}>{paragraph}</p>
      ))}
    </LegalPageLayout>
  );
}
