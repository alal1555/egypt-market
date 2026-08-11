"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function WalletTopUpPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <Wallet size={40} className="text-[#FF6321] mx-auto mb-4" />
      <h1 className="text-2xl font-black text-gray-900 mb-2">{t("walletTopUp.title")}</h1>
      <p className="text-gray-600 mb-6">{t("walletTopUp.comingSoon")}</p>
      <Link href="/profile" className="text-[#FF6321] font-bold hover:underline">
        {t("walletTopUp.backToProfile")}
      </Link>
    </div>
  );
}
