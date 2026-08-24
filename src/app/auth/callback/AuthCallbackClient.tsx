"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { completeAuthCallback } from "@/lib/auth-client";
import { grantEmailVerificationBonus } from "@/lib/wallet";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      try {
        const result = await completeAuthCallback(searchParams);

        if (!result.ok) {
          if (result.redirectToReset) {
            window.location.replace(
              `/reset-password${window.location.hash}${window.location.search}`,
            );
            return;
          }
          setError(
            result.error === "invalid_link"
              ? t("authCallback.invalidLink")
              : result.error,
          );
          return;
        }

        if (result.flow === "email") {
          try {
            await grantEmailVerificationBonus(result.accessToken);
          } catch {
            // Email may already be confirmed — still send user to profile.
          }
          router.replace("/profile?emailVerified=1");
          return;
        }

        router.replace("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : t("authCallback.invalidLink"));
      }
    })();
  }, [router, searchParams, t]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-3">
        <p className="text-gray-500">{error ?? t("authCallback.redirecting")}</p>
        {error ? (
          <Link href="/login" className="text-[#FF6321] font-bold underline text-sm">
            {t("authCallback.backToLogin")}
          </Link>
        ) : null}
      </div>
    </main>
  );
}
