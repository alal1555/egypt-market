import { AD_POST_PRICE_EGP } from "@/lib/wallet";
import { formatWalletError } from "@/lib/wallet";

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

const WALLET_ERROR_KEYS = [
  "wallet_migration_required",
  "email_not_verified",
  "phone_not_verified",
  "insufficient_credits",
  "balance_expired",
  "ad_expiry_migration_required",
  "ad_not_active",
  "not_owner",
  "not_authenticated",
] as const;

export function formatWalletErrorLocalized(code: string | undefined, t: TranslateFn): string {
  if (!code) return t("wallet.errors.unable");

  if (WALLET_ERROR_KEYS.includes(code as (typeof WALLET_ERROR_KEYS)[number])) {
    const key = `wallet.errors.${code}`;
    const msg = t(key, code === "insufficient_credits" ? { price: AD_POST_PRICE_EGP } : undefined);
    if (msg !== key) return msg;
  }

  if (code.includes("wallet") || code.includes("PGRST")) {
    const migration = t("wallet.errors.wallet_migration_required");
    if (migration !== "wallet.errors.wallet_migration_required") return migration;
  }

  return formatWalletError(code);
}
