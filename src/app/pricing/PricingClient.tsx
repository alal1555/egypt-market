"use client";

import Link from "next/link";
import { CheckCircle, Gift, Tag } from "lucide-react";
import { useTranslation } from "@/i18n/LocaleProvider";
import { pricingAr } from "@/i18n/content/pricing.ar";
import { pricingEn } from "@/i18n/content/pricing.en";

export default function PricingClient() {
  const { locale } = useTranslation();
  const c = locale === "ar" ? pricingAr : pricingEn;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-10">
        <p className="text-sm font-bold uppercase tracking-wide text-[#FF6321] mb-2">{c.badge}</p>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">{c.title}</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">{c.intro}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {c.plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-3xl border p-6 flex flex-col ${
              plan.id === "standard"
                ? "border-[#FF6321] bg-orange-50/50 shadow-md ring-1 ring-[#FF6321]/20"
                : "border-gray-200 bg-white"
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-3 left-6 bg-[#FF6321] text-white text-[10px] font-black uppercase tracking-wide px-3 py-1 rounded-full">
                {plan.badge}
              </span>
            )}
            <div className="flex items-center gap-2 mb-3 mt-1">
              {plan.id === "starter" ? (
                <Gift size={20} className="text-[#FF6321]" />
              ) : plan.id === "welcome_balance" ? (
                <Tag size={20} className="text-[#FF6321]" />
              ) : (
                <CheckCircle size={20} className="text-[#FF6321]" />
              )}
              <h2 className="font-black text-gray-900">{plan.name}</h2>
            </div>
            <p className="text-3xl font-black text-[#FF6321] mb-1">{plan.priceLabel}</p>
            <p className="text-sm text-gray-500 mb-5">{plan.subtitle}</p>
            <ul className="space-y-2.5 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2 text-sm text-gray-700">
                  <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden mb-10">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="font-black text-gray-900">{c.quickRef}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="px-6 py-3 font-bold">{c.colItem}</th>
                <th className="px-6 py-3 font-bold">{c.colPrice}</th>
                <th className="px-6 py-3 font-bold">{c.colNotes}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {c.table.map((row) => (
                <tr key={row.item}>
                  <td className="px-6 py-4 font-semibold text-gray-900">{row.item}</td>
                  <td className={`px-6 py-4 font-black ${row.price === c.comingSoon ? "text-gray-400" : "text-[#FF6321]"}`}>
                    {row.price}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div>
          <h2 className="font-black text-gray-900 mb-4">{c.howBilling}</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            {c.notes.map((note) => (
              <li key={note} className="flex gap-2">
                <span className="text-[#FF6321] font-bold">·</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-black text-gray-900 mb-4">{c.faqTitle}</h2>
          <div className="space-y-4">
            {c.faq.map((item) => (
              <div key={item.q}>
                <p className="font-bold text-gray-900 text-sm">{item.q}</p>
                <p className="text-sm text-gray-600 mt-1">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/post-ad"
          className="bg-[#FF6321] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#e85a1e] transition-colors"
        >
          {c.postAd}
        </Link>
        <Link
          href="/signup"
          className="border border-gray-200 text-gray-800 font-bold px-6 py-3 rounded-xl hover:border-[#FF6321] hover:text-[#FF6321] transition-colors"
        >
          {c.createAccount}
        </Link>
        <Link href="/" className="text-gray-500 font-bold px-6 py-3 hover:text-[#FF6321] transition-colors">
          {c.backHome}
        </Link>
      </div>
    </div>
  );
}
