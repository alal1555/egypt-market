"use client";

import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import LegalPageLayout from "@/components/LegalPageLayout";
import { useTranslation } from "@/i18n/LocaleProvider";
import { contactAr } from "@/i18n/content/contact.ar";
import { contactEn, SUPPORT_EMAIL } from "@/i18n/content/contact.en";

export default function ContactClient() {
  const { locale } = useTranslation();
  const c = locale === "ar" ? contactAr : contactEn;
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(c.copyEmail, SUPPORT_EMAIL);
    }
  };

  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    locale === "ar" ? "رسالة إلى يدي" : "Yaddii support",
  )}`;

  return (
    <LegalPageLayout title={c.title}>
      <p>{c.intro}</p>

      <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-5 md:p-6 space-y-4 not-prose">
        <p className="text-xs font-black uppercase tracking-wide text-gray-400">{c.emailLabel}</p>
        <a
          href={mailtoHref}
          className="flex items-center gap-2 text-lg md:text-xl font-black text-[#FF6321] hover:underline break-all"
        >
          <Mail size={22} className="shrink-0" />
          {SUPPORT_EMAIL}
        </a>
        <div className="flex flex-wrap gap-3">
          <a
            href={mailtoHref}
            className="inline-flex items-center justify-center bg-[#FF6321] text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-[#e85a1e] transition-colors"
          >
            {c.openInEmail}
          </a>
          <button
            type="button"
            onClick={() => void copyEmail()}
            className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-800 font-bold text-sm px-4 py-2.5 rounded-xl hover:border-[#FF6321] hover:text-[#FF6321] transition-colors"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            {copied ? c.copied : c.copyEmail}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-base font-black text-gray-900 mb-2">{c.includeTitle}</h2>
        <ul className="list-disc ps-5 space-y-1.5">
          {c.includes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <p className="text-gray-500 text-sm">{c.responseNote}</p>
    </LegalPageLayout>
  );
}
