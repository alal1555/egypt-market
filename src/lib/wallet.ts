/** Wallet & ad posting credits — Yaddii Marketplace */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AD_LIVE_DAYS,
  AD_POST_PRICE_EGP,
  BALANCE_EXPIRY_DAYS,
  WELCOME_BALANCE_EGP,
  WELCOME_FREE_ADS,
} from "@/constants/adPricing";

export { AD_LIVE_DAYS, AD_POST_PRICE_EGP, BALANCE_EXPIRY_DAYS, WELCOME_BALANCE_EGP, WELCOME_FREE_ADS };

export type WalletProfile = {
  free_ads_remaining: number;
  balance: number;
  balance_expires_at: string | null;
  phone_verified: boolean;
  welcome_credits_granted: boolean;
};

export type CanPostResult = {
  ok: boolean;
  error?: string;
  type?: "free_ad" | "balance" | "admin_waiver";
  free_ads_remaining?: number;
  balance?: number;
  ad_price?: number;
};

export type ConsumeResult = {
  ok: boolean;
  error?: string;
  type?: string;
  free_ads_remaining?: number;
  balance?: number;
  charged?: number;
};

/** Normalize Egyptian mobile to E.164 (+20...) for Supabase Auth */
export function normalizeEgyptPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("20")) return `+${digits}`;
  if (digits.startsWith("0")) return `+20${digits.slice(1)}`;
  if (digits.length === 10) return `+20${digits}`;
  return input.startsWith("+") ? input : `+${digits}`;
}

export function formatWalletError(code: string | undefined): string {
  switch (code) {
    case "wallet_migration_required":
      return "Wallet is not set up in Supabase yet. Run supabase/wallet.sql in the SQL Editor (see supabase/README.md), then refresh this page.";
    case "phone_not_verified":
      return "You've used your 3 free ads. Verify your phone on Profile to unlock 200 EGP wallet balance.";
    case "insufficient_credits":
      return `You need ${AD_POST_PRICE_EGP} EGP balance or a free ad to post. Top-up coming soon.`;
    case "balance_expired":
      return "Your welcome balance has expired. Top-up coming soon.";
    case "ad_expiry_migration_required":
      return "Ad expiry is not set up in Supabase yet. Run supabase/ad-expiry.sql in the SQL Editor.";
    case "ad_not_active":
      return "Only live listings can be renewed.";
    case "not_owner":
      return "You can only renew your own ads.";
    case "not_authenticated":
      return "Please log in to post an ad.";
    default:
      if (code && isWalletRpcMissing(code)) {
        return "Wallet is not set up in Supabase yet. Run supabase/wallet.sql in the SQL Editor, then refresh this page.";
      }
      return code || "Unable to post ad.";
  }
}

export function adsRemainingFromBalance(balance: number, expired: boolean): number {
  if (expired || balance <= 0) return 0;
  return Math.floor(balance / AD_POST_PRICE_EGP);
}

export function isBalanceExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
}

function isWalletRpcMissing(message: string): boolean {
  return (
    message.includes("Could not find the function") ||
    message.includes("schema cache") ||
    message.includes("function public.can_post_ad") ||
    message.includes("function public.consume_ad_credit")
  );
}

type ProfileRow = WalletProfile & { role?: string };

/** Client-side check when RPC exists or as fallback (read-only). */
export function canPostFromProfile(
  profile: ProfileRow,
  price: number = AD_POST_PRICE_EGP
): CanPostResult {
  if (profile.role === "admin" || profile.role === "super") {
    return { ok: true, type: "admin_waiver" };
  }
  if (profile.free_ads_remaining > 0) {
    return {
      ok: true,
      type: "free_ad",
      free_ads_remaining: profile.free_ads_remaining,
      balance: Number(profile.balance),
    };
  }
  if (!profile.phone_verified) {
    return { ok: false, error: "phone_not_verified" };
  }
  const balanceOk =
    profile.balance_expires_at &&
    !isBalanceExpired(profile.balance_expires_at) &&
    Number(profile.balance) >= price;
  if (balanceOk) {
    return {
      ok: true,
      type: "balance",
      free_ads_remaining: 0,
      balance: Number(profile.balance),
      ad_price: price,
    };
  }
  if (profile.balance_expires_at && isBalanceExpired(profile.balance_expires_at)) {
    return { ok: false, error: "balance_expired", balance: Number(profile.balance) };
  }
  return {
    ok: false,
    error: "insufficient_credits",
    free_ads_remaining: profile.free_ads_remaining,
    balance: Number(profile.balance),
  };
}

const WALLET_PROFILE_SELECT =
  "role, free_ads_remaining, balance, balance_expires_at, phone_verified, welcome_credits_granted";

export async function checkCanPostAd(
  client: SupabaseClient,
  userId: string
): Promise<CanPostResult> {
  const { data, error } = await client.rpc("can_post_ad", { p_price: AD_POST_PRICE_EGP });

  if (!error && data) {
    return data as CanPostResult;
  }

  if (error && !isWalletRpcMissing(error.message)) {
    return { ok: false, error: error.message };
  }

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select(WALLET_PROFILE_SELECT)
    .eq("id", userId)
    .single();

  if (profileError) {
    if (
      profileError.message.includes("column") ||
      profileError.code === "42703" ||
      profileError.message.includes("does not exist")
    ) {
      return { ok: false, error: "wallet_migration_required" };
    }
    return { ok: false, error: profileError.message };
  }

  return canPostFromProfile(profile as ProfileRow);
}

export type RenewResult = {
  ok: boolean;
  error?: string;
  expires_at?: string;
};

export async function renewAdListing(
  client: SupabaseClient,
  adId: string
): Promise<RenewResult> {
  const { data, error } = await client.rpc("renew_ad", {
    p_ad_id: adId,
    p_price: AD_POST_PRICE_EGP,
    p_live_days: AD_LIVE_DAYS,
  });

  if (!error && data) {
    const payload = data as RenewResult & { consume?: ConsumeResult };
    if (payload.ok) return payload;
    return { ok: false, error: payload.error };
  }

  if (error?.message?.includes("function public.renew_ad")) {
    return { ok: false, error: "ad_expiry_migration_required" };
  }

  const payload = data as RenewResult | null;
  return { ok: false, error: payload?.error || error?.message || "renew_failed" };
}

export async function consumeAdCredit(
  client: SupabaseClient,
  adId: string
): Promise<ConsumeResult> {
  const { data, error } = await client.rpc("consume_ad_credit", {
    p_ad_id: adId,
    p_price: AD_POST_PRICE_EGP,
  });

  if (!error && data) {
    return data as ConsumeResult;
  }

  if (error && isWalletRpcMissing(error.message)) {
    return { ok: false, error: "wallet_migration_required" };
  }

  const payload = data as ConsumeResult | null;
  return { ok: false, error: payload?.error || error?.message || "consume_failed" };
}
