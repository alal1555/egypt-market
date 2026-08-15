"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User, Mail, Phone, Shield, Crown, Calendar, Wallet, Gift, CheckCircle } from "lucide-react";
import {
  AD_POST_PRICE_EGP,
  WELCOME_BALANCE_EGP,
  WELCOME_FREE_ADS,
  WalletProfile,
  adsRemainingFromBalance,
  isBalanceExpired,
  normalizeEgyptPhone,
} from "@/lib/wallet";
import { useTranslation } from "@/i18n/LocaleProvider";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function authErrorMessage(body: Record<string, unknown>, status: number): string {
  const msg =
    (body.msg as string) ||
    (body.message as string) ||
    (body.error_description as string) ||
    (typeof body.error === "string" ? body.error : undefined);
  return msg || `Request failed (${status})`;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new DOMException("Request timed out", "TimeoutError")),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function getAccessToken(): Promise<string> {
  const { data } = await withTimeout(supabase.auth.getSession(), 8_000);
  const token = data.session?.access_token;
  if (!token) throw new Error("Session expired — please log in again.");
  return token;
}

/** Direct REST call — avoids supabase-js updateUser hanging while SMS hook runs */
async function updateAuthUser(
  accessToken: string,
  body: Record<string, unknown>,
): Promise<void> {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
  });

  const resBody = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(authErrorMessage(resBody, response.status));
  }
}

/** Direct REST verify — supabase-js verifyOtp can hang with no UI feedback */
async function verifyPhoneChangeOtp(
  accessToken: string,
  phone: string,
  token: string,
): Promise<void> {
  const response = await fetch(`${supabaseUrl}/auth/v1/verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "phone_change",
      phone,
      token,
    }),
    signal: AbortSignal.timeout(25_000),
  });

  const resBody = (await response.json().catch(() => ({}))) as Record<string, unknown> & {
    access_token?: string;
    refresh_token?: string;
  };
  if (!response.ok) {
    throw new Error(authErrorMessage(resBody, response.status));
  }

  // Refresh session in background — awaiting setSession can hang the UI.
  if (resBody.access_token && resBody.refresh_token) {
    void supabase.auth
      .setSession({
        access_token: resBody.access_token,
        refresh_token: resBody.refresh_token,
      })
      .catch(() => {});
  }
}

type GrantWelcomeResult = {
  ok?: boolean;
  error?: string;
  free_ads_remaining?: number;
  balance?: number;
  balance_expires_at?: string | null;
  already_granted?: boolean;
};

async function grantWelcomeCredits(accessToken: string): Promise<GrantWelcomeResult> {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/grant_welcome_credits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: "{}",
    signal: AbortSignal.timeout(15_000),
  });

  const resBody = (await response.json().catch(() => ({}))) as GrantWelcomeResult & Record<string, unknown>;
  if (!response.ok) {
    throw new Error(authErrorMessage(resBody, response.status));
  }
  if (resBody.ok === false && resBody.error) {
    throw new Error(String(resBody.error));
  }
  return resBody;
}

function isValidEgyptPhone(input: string): boolean {
  return /^\+20(10|11|12|15)\d{8}$/.test(normalizeEgyptPhone(input));
}

export default function ProfileClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState("user");
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
  });
  const [wallet, setWallet] = useState<WalletProfile | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpPhone, setOtpPhone] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [verifyTone, setVerifyTone] = useState<"success" | "error" | null>(null);
  const { t } = useTranslation();

  const loadWallet = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("free_ads_remaining, balance, balance_expires_at, phone_verified, welcome_credits_granted")
      .eq("id", userId)
      .maybeSingle();
    if (data) setWallet(data as WalletProfile);
  };

  useEffect(() => {
    let active = true;
    let settled = false;

    const finish = (authUser: any | null) => {
      if (!active || settled) return;
      settled = true;
      window.clearTimeout(timeout);

      if (authUser) {
        setUser(authUser);
        setFormData({
          fullName: authUser.user_metadata?.full_name || "",
          phone: authUser.user_metadata?.phone_number || "",
          email: authUser.email || "",
        });
        if (authUser.created_at) {
          setMemberSince(new Date(authUser.created_at).toLocaleDateString());
        }
        supabase
          .from("profiles")
          .select("role, free_ads_remaining, balance, balance_expires_at, phone_verified, welcome_credits_granted")
          .eq("id", authUser.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (active && profile) {
              if (profile.role) setRole(profile.role);
              setWallet({
                free_ads_remaining: profile.free_ads_remaining ?? 0,
                balance: Number(profile.balance ?? 0),
                balance_expires_at: profile.balance_expires_at,
                phone_verified: profile.phone_verified ?? false,
                welcome_credits_granted: profile.welcome_credits_granted ?? false,
              });
            }
            if (active) setLoading(false);
          });
      } else {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      finish(session?.user ?? null);
    });

    const timeout = window.setTimeout(() => {
      if (active && !settled) {
        setLoadError(t("profile.sessionTimeout"));
        setLoading(false);
      }
    }, 5000);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert(t("profile.sessionExpired"));
        return;
      }

      await updateAuthUser(session.access_token, {
        data: {
          full_name: formData.fullName,
          phone_number: formData.phone,
        },
      });
      alert(t("profile.profileUpdated"));
    } catch (err) {
      alert(err instanceof Error ? err.message : t("profile.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, phone: value });
    if (otpSent && value.trim() !== otpPhone) {
      setOtpSent(false);
      setOtpCode("");
      setOtpPhone("");
      setVerifyMessage(t("profile.phoneChanged"));
      setVerifyTone("error");
    }
  };

  const handleSendOtp = async () => {
    setVerifyMessage(null);
    setVerifyTone(null);
    const phone = normalizeEgyptPhone(formData.phone);

    if (!isValidEgyptPhone(formData.phone)) {
      setVerifyMessage(t("profile.invalidPhoneShort"));
      setVerifyTone("error");
      return;
    }

    setVerifying(true);
    try {
      const { data: { session } } = await withTimeout(supabase.auth.getSession(), 8_000);
      if (!session?.access_token) {
        setVerifyMessage(t("profile.sessionExpired"));
        setVerifyTone("error");
        return;
      }

      await updateAuthUser(session.access_token, {
        data: { phone_number: formData.phone },
        phone,
      });

      setOtpSent(true);
      setOtpPhone(formData.phone.trim());
      setVerifyMessage(t("profile.codeSent", { phone: formData.phone.trim() }));
      setVerifyTone("success");
    } catch (err) {
      if (err instanceof DOMException && err.name === "TimeoutError") {
        setVerifyMessage(t("profile.otpTimeout"));
      } else {
        const message = err instanceof Error ? err.message : t("profile.sendCodeFailed");
        setVerifyMessage(message);
      }
      setVerifyTone("error");
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    setVerifyMessage(null);
    setVerifyTone(null);
    const code = otpCode.replace(/\D/g, "");
    if (code.length < 4) {
      setVerifyMessage(t("profile.invalidOtp"));
      setVerifyTone("error");
      return;
    }

    setVerifying(true);
    const safetyTimer = window.setTimeout(() => setVerifying(false), 30_000);
    try {
      const accessToken = await getAccessToken();
      const phone = normalizeEgyptPhone(otpPhone || formData.phone);
      await verifyPhoneChangeOtp(accessToken, phone, code);

      const granted = await grantWelcomeCredits(accessToken);
      setWallet((prev) => ({
        free_ads_remaining: granted.free_ads_remaining ?? prev?.free_ads_remaining ?? 0,
        balance: Number(granted.balance ?? prev?.balance ?? 0),
        balance_expires_at: granted.balance_expires_at ?? prev?.balance_expires_at ?? null,
        phone_verified: true,
        welcome_credits_granted: true,
      }));

      setOtpSent(false);
      setOtpCode("");
      setOtpPhone("");
      setVerifyMessage(t("profile.phoneVerified", { amount: WELCOME_BALANCE_EGP }));
      setVerifyTone("success");
    } catch (err) {
      if (err instanceof DOMException && err.name === "TimeoutError") {
        setVerifyMessage(t("profile.verifyTimeout"));
      } else {
        const message = err instanceof Error ? err.message : t("profile.verifyFailed");
        setVerifyMessage(message);
      }
      setVerifyTone("error");
    } finally {
      window.clearTimeout(safetyTimer);
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6321]" />
        <p className="text-gray-500 text-sm">{t("profile.loading")}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl shadow-lg border">
        <h2 className="text-2xl font-bold mb-4">{t("profile.errorTitle")}</h2>
        <p className="text-gray-500 mb-6">{loadError}</p>
        <Link href="/login" className="bg-[#FF6321] text-white px-6 py-3 rounded-xl font-bold">
          {t("profile.goToLogin")}
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl shadow-lg border">
        <h2 className="text-2xl font-bold mb-4">{t("profile.signInTitle")}</h2>
        <p className="text-gray-500 mb-6">{t("profile.signInHint")}</p>
        <Link href="/login" prefetch={false} className="bg-[#FF6321] text-white px-6 py-3 rounded-xl font-bold">
          {t("nav.login")}
        </Link>
      </div>
    );
  }

  const roleLabel =
    role === "super" ? t("profile.roleSuper") : role === "admin" ? t("profile.roleAdmin") : t("profile.roleMember");

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 min-h-[50vh]">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#FF6321] to-orange-400 px-8 py-10 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black uppercase">
              {formData.fullName?.[0] || formData.email?.[0] || "?"}
            </div>
            <div>
              <h1 className="text-2xl font-black">{formData.fullName || t("profile.yourProfile")}</h1>
              <p className="text-orange-100 text-sm mt-1">{formData.email}</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-b bg-gray-50 flex flex-wrap gap-4 text-sm">
          <span className="inline-flex items-center gap-2 font-bold text-gray-700 bg-white px-3 py-1.5 rounded-full border">
            {role === "super" ? (
              <Crown size={16} className="text-amber-600" />
            ) : role === "admin" ? (
              <Shield size={16} className="text-[#FF6321]" />
            ) : (
              <User size={16} />
            )}
            {roleLabel}
          </span>
          {memberSince && (
            <span className="inline-flex items-center gap-2 text-gray-500">
              <Calendar size={16} />
              {t("profile.memberSince", { date: memberSince })}
            </span>
          )}
        </div>

        {/* Wallet */}
        <div className="px-8 py-6 border-b bg-white">
          <h2 className="flex items-center gap-2 font-black text-gray-900 mb-4">
            <Wallet size={20} className="text-[#FF6321]" />
            {t("profile.walletTitle")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
              <p className="text-xs font-bold text-gray-500 uppercase">{t("profile.freeAds")}</p>
              <p className="text-2xl font-black text-[#FF6321]">{wallet?.free_ads_remaining ?? 0}</p>
              {!wallet?.phone_verified && (
                <p className="text-[10px] text-gray-400 mt-1">{t("profile.starterPack")}</p>
              )}
            </div>
            {wallet?.phone_verified ? (
              <>
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                  <p className="text-xs font-bold text-gray-500 uppercase">{t("profile.walletBalance")}</p>
                  <p className="text-2xl font-black text-[#FF6321]">{wallet.balance} {t("common.egp")}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border">
                  <p className="text-xs font-bold text-gray-500 uppercase">{t("profile.paidAdsLeft")}</p>
                  <p className="text-2xl font-black text-gray-800">
                    {adsRemainingFromBalance(
                      wallet.balance,
                      isBalanceExpired(wallet.balance_expires_at)
                    )}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">{t("profile.perAd", { price: AD_POST_PRICE_EGP })}</p>
                </div>
              </>
            ) : (
              <div className="p-4 rounded-xl bg-gray-50 border sm:col-span-2">
                <p className="text-xs font-bold text-gray-500 uppercase">{t("profile.walletBalance")}</p>
                <p className="text-lg font-black text-gray-700 mt-1">
                  {t("profile.unlockBalance", { amount: WELCOME_BALANCE_EGP })}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {t("profile.perAdAfterFree", { price: AD_POST_PRICE_EGP })}
                </p>
              </div>
            )}
          </div>

          {!wallet?.phone_verified && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="flex items-center gap-2 font-bold text-amber-900 mb-2">
                <Gift size={18} />
                {t("profile.unlockTitle", { amount: WELCOME_BALANCE_EGP })}
              </p>
              <p className="text-sm text-amber-800 mb-4">
                {t("profile.unlockDesc", { freeAds: WELCOME_FREE_ADS, amount: WELCOME_BALANCE_EGP })}
              </p>
              <div className="space-y-3">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full p-3 border rounded-xl text-sm bg-white"
                />
                {formData.phone.trim() && isValidEgyptPhone(formData.phone) ? (
                  <p className="text-sm text-amber-900">
                    {t("profile.smsWillSend")}{" "}
                    <span className="font-bold">{formData.phone.trim()}</span>
                  </p>
                ) : formData.phone.trim() ? (
                  <p className="text-sm text-red-600">
                    {t("profile.invalidPhone")}
                  </p>
                ) : null}

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={verifying || !isValidEgyptPhone(formData.phone)}
                    className="w-full py-2.5 rounded-xl bg-[#FF6321] text-white font-bold text-sm hover:bg-[#e85a1e] disabled:opacity-60"
                  >
                    {verifying ? t("profile.sending") : t("profile.sendCode")}
                  </button>
                ) : (
                  <>
                    <p className="text-xs text-amber-800">
                      {t("profile.codeSentTo", { phone: otpPhone })}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder={t("profile.smsCode")}
                        className="flex-1 p-3 border rounded-xl text-sm bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={verifying || otpCode.replace(/\D/g, "").length < 4}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {verifying ? t("profile.verifying") : t("profile.verify")}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode("");
                        setOtpPhone("");
                        setVerifyMessage(null);
                        setVerifyTone(null);
                      }}
                      className="text-xs text-amber-700 hover:text-[#FF6321] underline"
                    >
                      {t("profile.changeNumber")}
                    </button>
                  </>
                )}

                {verifyMessage && (
                  <p
                    className={`text-sm font-medium ${
                      verifyTone === "success" ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {verifyMessage}
                  </p>
                )}
              </div>
            </div>
          )}

          {wallet?.phone_verified && wallet.balance_expires_at && (
            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
              <CheckCircle size={14} className="text-emerald-500" />
              {t("profile.balanceValidUntil", {
                date: new Date(wallet.balance_expires_at).toLocaleDateString(),
              })}
              {isBalanceExpired(wallet.balance_expires_at) && ` ${t("profile.expired")}`}
            </p>
          )}

          <p className="text-xs text-gray-400 mt-3">{t("profile.topUpSoon")}</p>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <User size={16} /> {t("auth.fullName")}
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder={t("profile.fullNamePlaceholder")}
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#FF6321]"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Phone size={16} /> {t("auth.phone")}
            </label>
            {wallet?.phone_verified ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#FF6321]"
                required
              />
            ) : (
              <p className="text-sm text-gray-500 p-3 border border-gray-100 rounded-xl bg-gray-50">
                {t("profile.verifyPhoneHint")}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Mail size={16} /> {t("auth.email")}
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">{t("profile.emailLocked")}</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#FF6321] text-white font-bold py-3 rounded-xl hover:bg-[#e85a1e] transition-colors disabled:opacity-60"
          >
            {saving ? t("profile.saving") : t("profile.saveChanges")}
          </button>
        </form>

        <div className="px-8 pb-8 flex flex-wrap gap-3">
          <Link href="/my-ads" prefetch={false} className="text-sm font-bold text-[#FF6321] hover:underline">
            {t("profile.myAdsLink")}
          </Link>
          <Link href="/favorites" prefetch={false} className="text-sm font-bold text-gray-600 hover:text-[#FF6321]">
            {t("profile.favoritesLink")}
          </Link>
        </div>
      </div>
    </div>
  );
}
