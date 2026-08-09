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
          })
          .finally(() => {
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
        setLoadError("Session timed out. Please refresh or log in again.");
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
        alert("Session expired. Please log in again.");
        return;
      }

      await updateAuthUser(session.access_token, {
        data: {
          full_name: formData.fullName,
          phone_number: formData.phone,
        },
      });
      alert("Profile updated successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save profile.");
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
      setVerifyMessage("Phone number changed — send a new verification code.");
    }
  };

  const handleSendOtp = async () => {
    setVerifyMessage(null);
    const phone = normalizeEgyptPhone(formData.phone);

    if (!isValidEgyptPhone(formData.phone)) {
      setVerifyMessage("Enter a valid Egyptian mobile number (e.g. 01012345678).");
      return;
    }

    setVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setVerifyMessage("Session expired. Please log in again.");
        return;
      }

      await updateAuthUser(session.access_token, {
        data: { phone_number: formData.phone },
        phone,
      });

      setOtpSent(true);
      setOtpPhone(formData.phone.trim());
      setVerifyMessage(`Verification code sent via SMS to ${formData.phone.trim()}.`);
    } catch (err) {
      if (err instanceof DOMException && err.name === "TimeoutError") {
        setVerifyMessage("Request timed out. Check Supabase → Edge Functions → send-sms → Logs.");
      } else {
        const message = err instanceof Error ? err.message : "Could not send verification code.";
        setVerifyMessage(message);
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    setVerifyMessage(null);
    setVerifying(true);
    const phone = normalizeEgyptPhone(otpPhone || formData.phone);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otpCode,
      type: "phone_change",
    });
    if (error) {
      setVerifying(false);
      setVerifyMessage(error.message);
      return;
    }
    const { data: granted, error: grantError } = await supabase.rpc("grant_welcome_credits");
    setVerifying(false);
    if (grantError) {
      setVerifyMessage(grantError.message);
      return;
    }
    if (user) await loadWallet(user.id);
    setOtpSent(false);
    setOtpCode("");
    setOtpPhone("");
    setVerifyMessage("Phone verified! Your welcome credits are active.");
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6321]" />
        <p className="text-gray-500 text-sm">Loading profile...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl shadow-lg border">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-gray-500 mb-6">{loadError}</p>
        <Link href="/login" className="bg-[#FF6321] text-white px-6 py-3 rounded-xl font-bold">
          Go to Login
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl shadow-lg border">
        <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
        <p className="text-gray-500 mb-6">Log in to view and edit your profile.</p>
        <Link href="/login" prefetch={false} className="bg-[#FF6321] text-white px-6 py-3 rounded-xl font-bold">
          Login
        </Link>
      </div>
    );
  }

  const roleLabel =
    role === "super" ? "Supreme Admin" : role === "admin" ? "Admin" : "Member";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 min-h-[50vh]">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#FF6321] to-orange-400 px-8 py-10 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black uppercase">
              {formData.fullName?.[0] || formData.email?.[0] || "?"}
            </div>
            <div>
              <h1 className="text-2xl font-black">{formData.fullName || "Your Profile"}</h1>
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
              Member since {memberSince}
            </span>
          )}
        </div>

        {/* Wallet */}
        <div className="px-8 py-6 border-b bg-white">
          <h2 className="flex items-center gap-2 font-black text-gray-900 mb-4">
            <Wallet size={20} className="text-[#FF6321]" />
            Ad Credits & Balance
          </h2>

          {wallet?.phone_verified ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                <p className="text-xs font-bold text-gray-500 uppercase">Free ads</p>
                <p className="text-2xl font-black text-[#FF6321]">{wallet.free_ads_remaining}</p>
              </div>
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                <p className="text-xs font-bold text-gray-500 uppercase">Balance</p>
                <p className="text-2xl font-black text-[#FF6321]">{wallet.balance} EGP</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border">
                <p className="text-xs font-bold text-gray-500 uppercase">Paid ads left</p>
                <p className="text-2xl font-black text-gray-800">
                  {adsRemainingFromBalance(
                    wallet.balance,
                    isBalanceExpired(wallet.balance_expires_at)
                  )}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">{AD_POST_PRICE_EGP} EGP per ad</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="flex items-center gap-2 font-bold text-amber-900 mb-2">
                <Gift size={18} />
                Unlock {WELCOME_FREE_ADS} free ads + {WELCOME_BALANCE_EGP} EGP
              </p>
              <p className="text-sm text-amber-800">
                Enter your Egyptian mobile below, then send a verification code. SMS goes to that
                exact number.
              </p>
            </div>
          )}

          {wallet?.phone_verified && wallet.balance_expires_at && (
            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
              <CheckCircle size={14} className="text-emerald-500" />
              Balance valid until {new Date(wallet.balance_expires_at).toLocaleDateString()}
              {isBalanceExpired(wallet.balance_expires_at) && " (expired)"}
            </p>
          )}

          <p className="text-xs text-gray-400 mt-3">Top-up coming soon — contact support for manual credits.</p>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <User size={16} /> Full Name
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Your full name"
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#FF6321]"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Phone size={16} /> Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#FF6321]"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Saved to your profile and used for SMS verification.
            </p>

            {!wallet?.phone_verified && (
              <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                {formData.phone.trim() && isValidEgyptPhone(formData.phone) ? (
                  <p className="text-sm text-gray-700">
                    SMS will be sent to:{" "}
                    <span className="font-bold text-gray-900">{formData.phone.trim()}</span>
                  </p>
                ) : (
                  <p className="text-sm text-amber-800">Enter a valid Egyptian mobile above first.</p>
                )}

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={verifying || !isValidEgyptPhone(formData.phone)}
                    className="w-full py-2.5 rounded-xl bg-[#FF6321] text-white font-bold text-sm hover:bg-[#e85a1e] disabled:opacity-60"
                  >
                    {verifying ? "Sending…" : "Send verification code"}
                  </button>
                ) : (
                  <>
                    <p className="text-xs text-gray-500">
                      Code sent to <span className="font-semibold">{otpPhone}</span>
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="SMS code"
                        className="flex-1 p-3 border rounded-xl text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={verifying || otpCode.length < 4}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Verify
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode("");
                        setOtpPhone("");
                        setVerifyMessage(null);
                      }}
                      className="text-xs text-gray-500 hover:text-[#FF6321] underline"
                    >
                      Change number / resend
                    </button>
                  </>
                )}
                {verifyMessage && (
                  <p
                    className={`text-sm font-medium ${
                      verifyMessage.includes("verified") || verifyMessage.includes("sent")
                        ? "text-emerald-700"
                        : "text-red-600"
                    }`}
                  >
                    {verifyMessage}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Mail size={16} /> Email
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#FF6321] text-white font-bold py-3 rounded-xl hover:bg-[#e85a1e] transition-colors disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        <div className="px-8 pb-8 flex flex-wrap gap-3">
          <Link href="/my-ads" prefetch={false} className="text-sm font-bold text-[#FF6321] hover:underline">
            My Ads →
          </Link>
          <Link href="/favorites" prefetch={false} className="text-sm font-bold text-gray-600 hover:text-[#FF6321]">
            Favorites →
          </Link>
        </div>
      </div>
    </div>
  );
}
