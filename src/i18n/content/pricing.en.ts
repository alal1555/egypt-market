import {
  AD_LIVE_DAYS,
  AD_POST_PRICE_EGP,
  BALANCE_EXPIRY_DAYS,
  SIGNUP_FREE_ADS,
  EMAIL_VERIFY_BONUS_FREE_ADS,
  EMAIL_VERIFY_BONUS_FREE_AUCTIONS,
  WELCOME_BALANCE_EGP,
  WELCOME_FREE_ADS,
} from "@/constants/adPricing";

export const pricingEn = {
  badge: "Price list",
  title: "Ad posting prices",
  intro: `Simple pricing in EGP. New sellers get ${SIGNUP_FREE_ADS} free ads on signup. Verify your email for ${EMAIL_VERIFY_BONUS_FREE_AUCTIONS} free auctions. Verify your phone for ${WELCOME_BALANCE_EGP} EGP wallet balance. After that, standard listings are ${AD_POST_PRICE_EGP} EGP each.`,
  quickRef: "Quick reference",
  colItem: "Item",
  colPrice: "Price",
  colNotes: "Notes",
  howBilling: "How billing works",
  faqTitle: "FAQ",
  postAd: "Post an ad",
  createAccount: "Create account",
  backHome: "← Back to home",
  comingSoon: "Coming soon",
  free: "Free",
  plans: [
    {
      id: "starter",
      name: "Starter free ads",
      priceLabel: "Free",
      subtitle: "Included with every new account",
      badge: "New users",
      features: [
        `${SIGNUP_FREE_ADS} free ads on signup`,
        "All categories and sub-categories",
        `${AD_LIVE_DAYS} days live after approval`,
      ],
    },
    {
      id: "welcome_balance",
      name: "Phone verification bonus",
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
      subtitle: "Per listing after free credits are used",
      features: [
        "One listing submission (pending admin review)",
        "Multiple photos and category-specific details",
        "Call and WhatsApp contact on your ad",
        `${AD_LIVE_DAYS} days live on the marketplace after approval`,
      ],
    },
  ],
  table: [
    { item: "Starter free ads", price: "Free", notes: `${SIGNUP_FREE_ADS} ads on signup` },
    {
      item: "Email verification bonus",
      price: "Free",
      notes: `${EMAIL_VERIFY_BONUS_FREE_AUCTIONS} free auctions after email confirm`,
    },
    { item: "Welcome wallet balance", price: `${WELCOME_BALANCE_EGP} EGP`, notes: `After phone verification (${BALANCE_EXPIRY_DAYS}-day expiry)` },
    { item: "Standard ad posting", price: `${AD_POST_PRICE_EGP} EGP`, notes: `Per listing · ${AD_LIVE_DAYS} days live after approval` },
    { item: "Ad renewal", price: `${AD_POST_PRICE_EGP} EGP`, notes: `Extend an expired listing for another ${AD_LIVE_DAYS} days (My Ads)` },
    { item: "Featured / boosted ads", price: "Coming soon", notes: "Higher visibility options planned" },
  ],
  notes: [
    "Listings stay live for 30 days after admin approval, then hide from search until renewed.",
    "Email verification unlocks free auction listings.",
    "Phone verification unlocks 200 EGP wallet balance (90 days).",
    `All ${WELCOME_FREE_ADS} welcome free ads are granted on signup.`,
    "Renewing an expired ad costs the same as a new standard ad (40 EGP or 1 free ad).",
    "Wallet top-up coming soon — contact support for manual credits in the meantime.",
    "Admin accounts post for free.",
  ],
  faq: [
    {
      q: "How long does my ad stay live?",
      a: "Each approved listing is visible for 30 days. After that it is hidden from search; renew from My Ads for another 30 days.",
    },
    {
      q: "When do I pay?",
      a: "Payment is taken from your free credits or wallet balance when you submit a listing. If submission fails, nothing is charged.",
    },
    {
      q: "Do I pay again if my ad is rejected?",
      a: "If an ad is rejected during review, contact support — we can restore the credit in fair cases.",
    },
    {
      q: "Can I get a refund on unused balance?",
      a: "Wallet balance is prepaid credit for posting ads only and is not withdrawable as cash.",
    },
  ],
};

export type PricingContent = typeof pricingEn;
