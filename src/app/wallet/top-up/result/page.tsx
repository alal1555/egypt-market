"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle, Clock, XCircle } from "lucide-react";

function TopUpResultContent() {
  const searchParams = useSearchParams();
  const topUpId = searchParams.get("top_up_id");
  const [status, setStatus] = useState<"loading" | "completed" | "pending" | "failed" | "missing">(
    "loading",
  );
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!topUpId) {
      setStatus("missing");
      return;
    }

    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus("failed");
        return;
      }

      const { data } = await supabase
        .from("wallet_top_ups")
        .select("status, amount")
        .eq("id", topUpId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!data) {
        setStatus("failed");
        return;
      }

      setAmount(Number(data.amount));

      if (data.status === "completed") {
        setStatus("completed");
        return;
      }

      if (data.status === "failed" || data.status === "cancelled") {
        setStatus("failed");
        return;
      }

      attempts += 1;
      if (attempts >= 12) {
        setStatus("pending");
        return;
      }

      timer = setTimeout(poll, 2500);
    }

    poll();
    return () => clearTimeout(timer);
  }, [topUpId]);

  if (status === "loading") {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6321] mx-auto mb-4" />
        <p className="text-gray-500">Confirming your payment…</p>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="text-center py-12 px-6">
        <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-gray-900 mb-2">Balance added</h1>
        <p className="text-gray-600 mb-6">
          {amount != null ? `${amount} EGP` : "Your top-up"} is now in your wallet.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/profile" className="bg-[#FF6321] text-white font-bold px-6 py-3 rounded-xl">
            View wallet
          </Link>
          <Link href="/post-ad" className="border border-gray-200 font-bold px-6 py-3 rounded-xl">
            Post an ad
          </Link>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="text-center py-12 px-6">
        <Clock size={48} className="text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-gray-900 mb-2">Payment processing</h1>
        <p className="text-gray-600 mb-6">
          Your payment is still being confirmed. Refresh Profile in a minute — balance will appear
          once Paymob confirms.
        </p>
        <Link href="/profile" className="text-[#FF6321] font-bold underline">
          Go to Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center py-12 px-6">
      <XCircle size={48} className="text-red-500 mx-auto mb-4" />
      <h1 className="text-2xl font-black text-gray-900 mb-2">Payment not completed</h1>
      <p className="text-gray-600 mb-6">
        {status === "missing"
          ? "Missing payment reference. Try topping up again from Profile."
          : "Payment was cancelled or could not be verified."}
      </p>
      <Link href="/wallet/top-up" className="bg-[#FF6321] text-white font-bold px-6 py-3 rounded-xl">
        Try again
      </Link>
    </div>
  );
}

export default function TopUpResultPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <Suspense
        fallback={
          <div className="text-center py-16 text-gray-500">Loading payment result…</div>
        }
      >
        <TopUpResultContent />
      </Suspense>
    </div>
  );
}
