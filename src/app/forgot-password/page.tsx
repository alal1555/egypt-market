"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setSent(true);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h1 className="text-2xl font-black text-center mb-2">{t("forgotPassword.title")}</h1>
        <p className="text-sm text-gray-500 text-center mb-6">{t("forgotPassword.subtitle")}</p>

        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-600">
              {t("forgotPassword.sentHint", { email })}
            </p>
            <Link href="/login" className="inline-block text-sm font-bold text-[#FF6321] hover:underline">
              {t("forgotPassword.backToLogin")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t("auth.email")}</label>
              <input
                type="email"
                className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#FF6321]"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6321] text-white font-bold py-3 rounded-lg hover:bg-[#e85a1e] transition-colors disabled:opacity-60"
            >
              {loading ? t("forgotPassword.sending") : t("forgotPassword.sendLink")}
            </button>

            <Link href="/login" className="block text-center text-sm text-gray-500 hover:text-[#FF6321]">
              {t("forgotPassword.backToLogin")}
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
