"use client";

import { useEffect } from "react";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function AuthCallbackPage() {
  const { t } = useTranslation();

  useEffect(() => {
    window.location.replace(`/reset-password${window.location.hash}${window.location.search}`);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-gray-500">{t("authCallback.redirecting")}</div>
    </main>
  );
}
