/** Auction (مزاد) listing options — optional alternative to fixed price. */

export const AUCTION_DURATIONS_HOURS = [12, 24, 48, 72] as const;
export type AuctionDurationHours = (typeof AUCTION_DURATIONS_HOURS)[number];

export const DEFAULT_AUCTION_BID_INCREMENT = 50;
export const MIN_AUCTION_BID_INCREMENT = 10;
export const AUCTION_ANTI_SNIPE_MINUTES = 3;

export type ListingType = "fixed" | "auction";

export type AuctionStatus = "pending" | "live" | "ended" | "no_sale" | "sold";

export type AuctionAdFields = {
  listing_type?: ListingType | string;
  auction_bid_increment?: number | null;
  auction_reserve_price?: number | null;
  auction_duration_hours?: AuctionDurationHours | null;
  auction_ends_at?: string | null;
  auction_status?: AuctionStatus | string | null;
  auction_current_bid?: number | null;
  auction_winner_id?: string | null;
  auction_bid_count?: number;
  auction_verification_code?: string | null;
};

export function isAuctionListing(ad: { listing_type?: string | null }): boolean {
  return ad.listing_type === "auction";
}

export function isAuctionLive(ad: AuctionAdFields): boolean {
  if (!isAuctionListing(ad) || ad.auction_status !== "live" || !ad.auction_ends_at) return false;
  return new Date(ad.auction_ends_at) > new Date();
}

export function isAuctionFinished(ad: AuctionAdFields): boolean {
  return (
    ad.auction_status === "ended" ||
    ad.auction_status === "no_sale" ||
    ad.auction_status === "sold"
  );
}

export function isAuctionWon(ad: AuctionAdFields): boolean {
  return ad.auction_status === "ended" || ad.auction_status === "sold";
}

export function getMinimumBid(ad: AuctionAdFields & { price: number }): number {
  const start = Number(ad.price);
  const increment = Number(ad.auction_bid_increment ?? DEFAULT_AUCTION_BID_INCREMENT);
  const bidCount = ad.auction_bid_count ?? 0;
  if (bidCount === 0) return start;
  return Number(ad.auction_current_bid ?? start) + increment;
}

export function getDisplayPrice(ad: AuctionAdFields & { price: number }): number {
  if (!isAuctionListing(ad)) return Number(ad.price);
  if (ad.auction_current_bid != null) return Number(ad.auction_current_bid);
  return Number(ad.price);
}

export function formatAuctionCountdown(endsAt: string, nowMs: number = Date.now()): string {
  const diff = new Date(endsAt).getTime() - nowMs;
  if (diff <= 0) return "0:00:00";
  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
