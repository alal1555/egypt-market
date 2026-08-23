"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Gavel, Clock, TrendingUp, Phone, MessageCircle, Trophy, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { readStoredAccessToken } from "@/lib/auth-client";
import { formatPhoneForLink } from "@/lib/utils";
import {
  fetchAuctionBids,
  restCloseExpiredAuctions,
  restFetchAdAuctionFields,
  restFetchAuctionWinnerContact,
  restFetchAuctionWinnerVerification,
  restPlaceAuctionBid,
  type AdWithAuction,
  type AuctionBidRow,
} from "@/lib/auction";
import {
  DEFAULT_AUCTION_BID_INCREMENT,
  formatAuctionCountdown,
  getMinimumBid,
  isAuctionLive,
  isAuctionListing,
  isAuctionWon,
} from "@/constants/auction";
import { useTranslation } from "@/i18n/LocaleProvider";

type Props = {
  ad: AdWithAuction;
  onAdUpdate: (patch: Partial<AdWithAuction>) => void;
};

export default function AuctionPanel({ ad, onAdUpdate }: Props) {
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bids, setBids] = useState<AuctionBidRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [winnerContact, setWinnerContact] = useState<{
    full_name: string;
    phone: string;
    verification_code: string;
  } | null>(null);
  const [winnerVerificationCode, setWinnerVerificationCode] = useState<string | null>(null);

  const live = isAuctionLive(ad);
  const minBid = getMinimumBid(ad);
  const isSeller = userId === ad.user_id;
  const isWinner = Boolean(userId && ad.auction_winner_id && userId === ad.auction_winner_id);
  const auctionWon = isAuctionWon(ad);

  const refreshAuctionState = useCallback(async () => {
    await restCloseExpiredAuctions();
    const patch = await restFetchAdAuctionFields(ad.id);
    if (patch) onAdUpdate(patch);
  }, [ad.id, onAdUpdate]);

  const refreshBids = useCallback(async () => {
    const rows = await fetchAuctionBids(ad.id, 8);
    setBids(rows);
  }, [ad.id]);

  useEffect(() => {
    void restCloseExpiredAuctions();
  }, [ad.id]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!live && ad.auction_ends_at && new Date(ad.auction_ends_at).getTime() <= nowMs) {
      void refreshAuctionState();
    }
  }, [live, ad.auction_ends_at, nowMs, refreshAuctionState]);

  useEffect(() => {
    if (!isSeller || !auctionWon) {
      setWinnerContact(null);
      return;
    }

    const accessToken = readStoredAccessToken();
    if (!accessToken) return;

    let active = true;
    void restFetchAuctionWinnerContact(accessToken, ad.id).then((result) => {
      if (!active || !result.ok) return;
      setWinnerContact({
        full_name: result.full_name,
        phone: result.phone,
        verification_code: result.verification_code,
      });
    });

    return () => {
      active = false;
    };
  }, [ad.id, auctionWon, isSeller]);

  useEffect(() => {
    if (!isWinner || isSeller || !auctionWon) {
      setWinnerVerificationCode(null);
      return;
    }

    const accessToken = readStoredAccessToken();
    if (!accessToken) return;

    let active = true;
    void restFetchAuctionWinnerVerification(accessToken, ad.id).then((result) => {
      if (!active || !result.ok || !result.verification_code) return;
      setWinnerVerificationCode(result.verification_code);
    });

    return () => {
      active = false;
    };
  }, [ad.id, auctionWon, isSeller, isWinner]);

  useEffect(() => {
    void refreshBids();
    const poll = setInterval(refreshBids, 12_000);
    return () => clearInterval(poll);
  }, [refreshBids]);

  useEffect(() => {
    setBidAmount(String(minBid));
  }, [minBid]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      if (!session?.user) {
        setPhoneVerified(false);
        return;
      }
      void supabase
        .from("profiles")
        .select("phone_verified")
        .eq("id", session.user.id)
        .maybeSingle()
        .then(({ data }) => setPhoneVerified(Boolean(data?.phone_verified)));
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const countdown = ad.auction_ends_at ? formatAuctionCountdown(ad.auction_ends_at, nowMs) : null;

  const statusLabel = useMemo(() => {
    const timeExpired =
      ad.auction_ends_at != null && new Date(ad.auction_ends_at).getTime() <= nowMs;
    if (ad.auction_status === "ended" || ad.auction_status === "sold") return t("auction.statusEnded");
    if (ad.auction_status === "no_sale") return t("auction.statusNoSale");
    if (live) return t("auction.statusLive");
    if (timeExpired) return t("auction.statusEnded");
    return t("auction.statusPending");
  }, [ad.auction_ends_at, ad.auction_status, live, nowMs, t]);

  const handleBid = async () => {
    setMessage(null);
    const accessToken = readStoredAccessToken();
    if (!accessToken) {
      setMessage({ text: t("auction.loginToBid"), tone: "error" });
      return;
    }
    if (!phoneVerified) {
      setMessage({ text: t("auction.verifyPhoneToBid"), tone: "error" });
      return;
    }
    if (isSeller) {
      setMessage({ text: t("auction.cannotBidOwn"), tone: "error" });
      return;
    }

    const amount = Number(bidAmount);
    if (!Number.isFinite(amount) || amount < minBid) {
      setMessage({
        text: t("auction.bidTooLow", { min: minBid.toLocaleString() }),
        tone: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await restPlaceAuctionBid(accessToken, ad.id, amount);
      if (!result.ok) {
        const errKey = `auction.errors.${result.error}`;
        const errMsg = t(errKey);
        const text =
          errMsg !== errKey
            ? errMsg
            : result.min_bid != null
              ? t("auction.bidTooLow", { min: result.min_bid.toLocaleString() })
              : t("auction.bidFailed");
        setMessage({ text, tone: "error" });
        return;
      }

      onAdUpdate({
        auction_current_bid: result.amount,
        auction_bid_count: result.bid_count,
        auction_ends_at: result.auction_ends_at,
        auction_winner_id: userId ?? undefined,
      });
      setBidAmount(String(result.min_next_bid));
      setMessage({ text: t("auction.bidPlaced"), tone: "success" });
      void refreshBids();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuctionListing(ad)) return null;

  const displayBid =
    ad.auction_current_bid != null
      ? Number(ad.auction_current_bid).toLocaleString()
      : Number(ad.price).toLocaleString();

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border border-orange-100 space-y-4">
      <div className="flex items-center gap-2 text-[#FF6321]">
        <Gavel size={22} />
        <span className="font-black uppercase text-sm tracking-wide">{t("auction.badge")}</span>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-500 uppercase">
          {ad.auction_bid_count && ad.auction_bid_count > 0
            ? t("auction.currentBid")
            : t("auction.startingPrice")}
        </p>
        <p className="text-4xl font-black text-[#FF6321]">
          {displayBid} {t("common.egp")}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {t("auction.minIncrement", {
            amount: Number(ad.auction_bid_increment ?? DEFAULT_AUCTION_BID_INCREMENT).toLocaleString(),
          })}
          {" · "}
          {t("auction.bidCount", { count: ad.auction_bid_count ?? 0 })}
        </p>
      </div>

      {live && countdown && (
        <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-4 py-3 text-orange-900">
          <Clock size={18} />
          <span className="font-bold">{t("auction.endsIn")}</span>
          <span className="font-mono text-lg font-black">{countdown}</span>
        </div>
      )}

      <p className="text-sm font-semibold text-gray-700">{statusLabel}</p>

      {auctionWon && ad.auction_current_bid != null && (
        <p className="text-sm text-emerald-700 font-medium bg-emerald-50 rounded-xl p-3">
          {t("auction.winningBid", {
            amount: Number(ad.auction_current_bid).toLocaleString(),
          })}
        </p>
      )}

      {auctionWon && isWinner && !isSeller && (
        <div className="space-y-3">
          <p className="text-sm text-emerald-800 font-bold bg-emerald-50 rounded-xl p-3 flex items-center gap-2">
            <Trophy size={18} />
            {t("auction.youWon")}
          </p>
          {winnerVerificationCode ? (
            <VerificationCodeBlock code={winnerVerificationCode} role="winner" t={t} />
          ) : null}
        </div>
      )}

      {auctionWon && isSeller && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 space-y-3">
          <p className="text-sm font-black text-emerald-900">{t("auction.winnerTitle")}</p>
          {winnerContact?.verification_code ? (
            <VerificationCodeBlock code={winnerContact.verification_code} role="seller" t={t} />
          ) : null}
          {winnerContact?.full_name ? (
            <p className="text-sm font-semibold text-gray-800">
              {t("auction.winnerName", {
                name: winnerContact.full_name,
              })}
            </p>
          ) : null}
          {winnerContact?.phone ? (
            <div className="space-y-2">
              <p className="text-sm font-bold text-gray-900">{winnerContact.phone}</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <a
                  href={`tel:+${formatPhoneForLink(winnerContact.phone)}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#FF6321] py-2.5 rounded-xl font-bold text-white text-sm hover:bg-[#e85a1e]"
                >
                  <Phone size={16} /> {t("auction.callWinner")}
                </a>
                <a
                  href={`https://wa.me/${formatPhoneForLink(winnerContact.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-[#FF6321] py-2.5 rounded-xl font-bold text-[#FF6321] text-sm hover:bg-orange-50"
                >
                  <MessageCircle size={16} /> {t("auction.whatsappWinner")}
                </a>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-600">{t("auction.winnerNoPhone")}</p>
          )}
        </div>
      )}

      {ad.auction_status === "no_sale" && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{t("auction.noSale")}</p>
      )}

      {live && !isSeller && (
        <div className="space-y-3 border-t pt-4">
          <label className="block text-sm font-bold text-gray-700">{t("auction.yourBid")}</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={minBid}
              step={Number(ad.auction_bid_increment ?? DEFAULT_AUCTION_BID_INCREMENT)}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#FF6321] outline-none"
            />
            <button
              type="button"
              onClick={handleBid}
              disabled={submitting}
              className="px-5 py-3 rounded-xl font-bold text-white bg-[#FF6321] hover:bg-[#e85a1e] disabled:opacity-50"
            >
              {submitting ? t("auction.placing") : t("auction.placeBid")}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {t("auction.minBidHint", { min: minBid.toLocaleString() })}
          </p>
          {!userId && (
            <p className="text-xs text-gray-500">
              <Link href="/login" className="text-[#FF6321] font-bold underline">
                {t("nav.login")}
              </Link>{" "}
              {t("auction.loginHint")}
            </p>
          )}
          {userId && !phoneVerified && (
            <p className="text-xs text-amber-800">
              <Link href="/profile" className="text-[#FF6321] font-bold underline">
                {t("auction.verifyPhoneLink")}
              </Link>
            </p>
          )}
        </div>
      )}

      {live && isSeller && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{t("auction.sellerWatching")}</p>
      )}

      {message && (
        <p
          className={`text-sm font-medium ${
            message.tone === "success" ? "text-emerald-700" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      {bids.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-2 text-gray-700">
            <TrendingUp size={16} />
            <span className="text-sm font-bold">{t("auction.recentBids")}</span>
          </div>
          <ul className="space-y-1 max-h-40 overflow-y-auto">
            {bids.map((bid) => (
              <li
                key={bid.id}
                className="flex justify-between text-sm text-gray-600 py-1 border-b border-gray-50 last:border-0"
              >
                <span>{Number(bid.amount).toLocaleString()} {t("common.egp")}</span>
                <span className="text-xs text-gray-400">
                  {new Date(bid.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-gray-400 leading-relaxed">{t("auction.disclaimer")}</p>
    </div>
  );
}

function VerificationCodeBlock({
  code,
  role,
  t,
}: {
  code: string;
  role: "seller" | "winner";
  t: (key: string) => string;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 p-4">
      <div className="flex items-center gap-2 text-orange-900 mb-2">
        <ShieldCheck size={16} />
        <p className="text-xs font-bold uppercase tracking-wide">{t("auction.verificationTitle")}</p>
      </div>
      <p className="font-mono text-2xl font-black text-[#FF6321] tracking-[0.2em]">{code}</p>
      <p className="text-xs text-gray-600 mt-2 leading-relaxed">
        {role === "seller" ? t("auction.verificationSellerHint") : t("auction.verificationWinnerHint")}
      </p>
    </div>
  );
}
