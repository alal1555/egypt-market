"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  getEmailConfirmRedirectUrl,
  getSessionUser,
  isEmailNotConfirmedAuthError,
  isEmailRateLimitAuthError,
} from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/i18n/LocaleProvider";

function LoginForm() {
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",
    fullName: "",
  });
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [loginHint, setLoginHint] = useState<string | null>(null);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);
  const [emailRateLimited, setEmailRateLimited] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    let active = true;
    void getSessionUser().then((sessionUser) => {
      if (!active) return;
      setLoggedIn(Boolean(sessionUser));
      setSessionReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setIsSignUp(searchParams.get("mode") === "signup");
    if (searchParams.get("verified") === "1") {
      setLoginHint(t("auth.emailVerifiedLogin"));
    }
  }, [searchParams, t]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setLoginHint(null);
    setNeedsEmailConfirm(false);
    setEmailRateLimited(false);

    if (isSignUp) {
      const redirectTo =
        typeof window !== "undefined" ? getEmailConfirmRedirectUrl() : undefined;

      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: formData.fullName,
            phone_number: formData.phone,
          },
        },
      });

      if (error) {
        if (isEmailRateLimitAuthError(error.message)) {
          setEmailRateLimited(true);
        } else {
          alert(error.message);
        }
      } else {
        alert(t("auth.accountCreatedCheckEmail"));
        router.push("/login");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (isEmailNotConfirmedAuthError(error.message)) {
          setNeedsEmailConfirm(true);
          setLoginHint(t("auth.loginEmailNotConfirmed"));
        } else {
          alert(error.message);
        }
      } else {
        router.push("/");
        router.refresh();
      }
    }
    setLoading(false);
  };

  const toggleMode = () => {
    const nextIsSignUp = !isSignUp;
    setIsSignUp(nextIsSignUp);
    setLoginHint(null);
    setNeedsEmailConfirm(false);
    setEmailRateLimited(false);
    router.replace(nextIsSignUp ? "/login?mode=signup" : "/login");
  };

  const handleResendConfirmation = async () => {
    if (!formData.email.trim()) return;
    setResendingEmail(true);
    setLoginHint(null);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: formData.email.trim(),
        options: { emailRedirectTo: getEmailConfirmRedirectUrl() },
      });
      if (error) throw error;
      setLoginHint(t("auth.loginResendSent"));
      setNeedsEmailConfirm(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("profile.emailResendFailed");
      if (isEmailRateLimitAuthError(message)) {
        setEmailRateLimited(true);
      } else {
        alert(message);
      }
    } finally {
      setResendingEmail(false);
    }
  };

  if (!sessionReady) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <p className="text-gray-500 font-medium">{t("common.loading")}</p>
      </main>
    );
  }

  if (loggedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center space-y-4">
          <h1 className="text-2xl font-black text-gray-900">{t("auth.alreadyLoggedIn")}</h1>
          <p className="text-sm text-gray-600">{t("auth.alreadyLoggedInHint")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/"
              className="bg-[#FF6321] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#e85a1e] transition-colors"
            >
              {t("auth.goToHome")}
            </Link>
            <Link
              href="/profile"
              prefetch={false}
              className="border border-gray-200 text-gray-800 font-bold px-5 py-2.5 rounded-xl hover:border-[#FF6321] hover:text-[#FF6321] transition-colors"
            >
              {t("auth.goToProfile")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h1 className="text-2xl font-black text-center mb-6">
          {isSignUp ? t("auth.signupTitle") : t("auth.loginTitle")}
        </h1>

        {emailRateLimited ? (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-900">
            <p>{t("auth.emailRateLimit")}</p>
          </div>
        ) : null}

        {!isSignUp && searchParams.get("verified") === "1" ? (
          <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
            <p>{loginHint ?? t("auth.emailVerifiedLogin")}</p>
          </div>
        ) : null}

        {!isSignUp && needsEmailConfirm && searchParams.get("verified") !== "1" ? (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 space-y-2">
            <p>{loginHint ?? t("auth.loginEmailNotConfirmed")}</p>
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resendingEmail || !formData.email.trim()}
              className="text-[#FF6321] font-bold underline disabled:opacity-60"
            >
              {resendingEmail ? t("auth.processing") : t("auth.resendConfirmEmail")}
            </button>
          </div>
        ) : null}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t("auth.fullName")}</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#FF6321]"
                  placeholder="John Doe"
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t("auth.phone")}</label>
                <input
                  type="tel"
                  className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#FF6321]"
                  placeholder="01XXXXXXXXX"
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t("auth.email")}</label>
            <input
              type="email"
              className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#FF6321]"
              placeholder="name@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-bold text-gray-700">{t("auth.password")}</label>
              {!isSignUp && (
                <Link href="/forgot-password" className="text-xs font-bold text-[#FF6321] hover:underline">
                  {t("auth.forgotPassword")}
                </Link>
              )}
            </div>
            <input
              type="password"
              className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#FF6321]"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-[#FF6321] text-white font-bold py-3 rounded-lg hover:bg-[#e85a1e] transition-colors"
          >
            {loading ? t("auth.processing") : isSignUp ? t("auth.signupButton") : t("auth.loginButton")}
          </button>
        </form>

        <button
          onClick={toggleMode}
          className="w-full mt-4 text-sm text-gray-500 hover:text-[#FF6321] transition-colors"
        >
          {isSignUp ? t("auth.toggleToLogin") : t("auth.toggleToSignup")}
        </button>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
