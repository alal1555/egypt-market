/** Ad posting prices — single source of truth for wallet RPCs and the public price list. */

export const AD_POST_PRICE_EGP = 40;
/** Free fixed-price ads granted on signup (before verification). */
export const SIGNUP_FREE_ADS = 3;
/** Extra free fixed-price ads after email verification (0 — all welcome ads are on signup). */
export const EMAIL_VERIFY_BONUS_FREE_ADS = 0;
/** Free auction listings granted after email verification. */
export const EMAIL_VERIFY_BONUS_FREE_AUCTIONS = 5;
/** @deprecated Use EMAIL_VERIFY_BONUS_* — kept for imports during transition */
export const VERIFY_BONUS_FREE_ADS = EMAIL_VERIFY_BONUS_FREE_ADS;
export const VERIFY_BONUS_FREE_AUCTIONS = EMAIL_VERIFY_BONUS_FREE_AUCTIONS;
/** Max free fixed ads per account (signup + verify bonus). */
export const WELCOME_FREE_ADS = SIGNUP_FREE_ADS + VERIFY_BONUS_FREE_ADS;
export const WELCOME_BALANCE_EGP = 200;
export const BALANCE_EXPIRY_DAYS = 90;
export const AD_LIVE_DAYS = 30;
export const TOP_UP_MIN_EGP = 100;
export const TOP_UP_PRESETS_EGP = [100, 200, 500, 1000] as const;
export const TOP_UP_BALANCE_VALID_DAYS = 365;

export function computeExpiresAt(from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + AD_LIVE_DAYS);
  return d.toISOString();
}

export function isAdExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) <= new Date();
}

export function isAdPubliclyLive(ad: {
  status: string;
  expires_at?: string | null;
}): boolean {
  if (ad.status !== "active") return false;
  if (!ad.expires_at) return true;
  return new Date(ad.expires_at) > new Date();
}

export type ListingDisplayStatus = "pending" | "active" | "expired" | "banned";

export function getListingDisplayStatus(ad: {
  status: string;
  expires_at?: string | null;
}): ListingDisplayStatus {
  if (ad.status === "banned") return "banned";
  if (ad.status === "pending") return "pending";
  if (isAdExpired(ad.expires_at)) return "expired";
  return "active";
}

export function formatExpiryDate(expiresAt: string | null | undefined): string | null {
  if (!expiresAt) return null;
  return new Date(expiresAt).toLocaleDateString();
}

export type AdPricingPlan = {
  id: string;
  name: string;
  priceLabel: string;
  subtitle: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
};

export const AD_PRICING_PLANS: AdPricingPlan[] = [
  {
    id: "starter",
    name: "Starter free ads",
    priceLabel: "Free",
    subtitle: "Included with every new account",
    badge: "New users",
    features: [
      `${SIGNUP_FREE_ADS} free ads on signup`,
      `${AD_LIVE_DAYS} days live after approval`,
    ],
  },
  {
    id: "welcome_balance",
    name: "Welcome wallet balance",
    priceLabel: `${WELCOME_BALANCE_EGP} EGP`,
    subtitle: "Unlocked after phone verification",
    badge: "Bonus",
    features: [
      `${WELCOME_BALANCE_EGP} EGP added to your wallet`,
      `Balance valid for ${BALANCE_EXPIRY_DAYS} days`,
      `Covers ~${Math.floor(WELCOME_BALANCE_EGP / AD_POST_PRICE_EGP)} standard ads or auctions`,
    ],
  },
  {
    id: "standard",
    name: "Standard ad",
    priceLabel: `${AD_POST_PRICE_EGP} EGP`,
    subtitle: "Per listing after free ads are used",
    highlight: true,
    features: [
      "One listing submission (pending admin review)",
      "Multiple photos and category-specific details",
      "Call and WhatsApp contact on your ad",
      `${AD_LIVE_DAYS} days live on the marketplace after approval`,
    ],
  },
];

export const AD_PRICING_NOTES = [
  "Listings stay live for 30 days after admin approval, then hide from search until renewed.",
  "Free ad credits are for fixed-price listings. Free auction credits are separate.",
  `All ${WELCOME_FREE_ADS} welcome free ads are granted on signup.`,
  `Email verification unlocks ${EMAIL_VERIFY_BONUS_FREE_AUCTIONS} free auction listings.`,
  "Renewing an expired ad costs the same as a new standard ad (40 EGP or 1 free ad).",
  "Wallet top-up coming soon — contact support for manual credits in the meantime.",
  "Admin accounts post for free.",
];

export const AD_PRICING_FAQ = [
  {
    q: "How long does my ad stay live?",
    a: "Each approved listing is visible for 30 days. After that it is hidden from search; renew from My Ads for another 30 days.",
  },
  {
    q: "When do I pay?",
    a: "Payment is taken from your free ad allowance or wallet balance when you submit a listing. If submission fails, nothing is charged.",
  },
  {
    q: "Do I pay again if my ad is rejected?",
    a: "If an ad is rejected during review, contact support — we can restore the credit in fair cases.",
  },
  {
    q: "Can I get a refund on unused balance?",
    a: "Wallet balance is prepaid credit for posting ads only and is not withdrawable as cash.",
  },
];
