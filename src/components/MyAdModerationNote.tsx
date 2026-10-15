"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "@/i18n/LocaleProvider";
import {
  isModerationNoteUnread,
  markModerationNoteSeen,
  type ModerationNoteAd,
} from "@/lib/moderation-note-seen";

type Props = {
  ad: ModerationNoteAd;
  onSeen?: () => void;
};

export default function MyAdModerationNote({ ad, onSeen }: Props) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const unread = isModerationNoteUnread(ad);
  const noteAt = ad.moderation_note_at!;

  useEffect(() => {
    if (!unread) return;
    const el = ref.current;
    if (!el) return;

    const markSeen = () => {
      markModerationNoteSeen(ad.id, noteAt);
      onSeen?.();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.35)) {
          markSeen();
          observer.disconnect();
        }
      },
      { threshold: [0.35, 0.5] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ad.id, noteAt, unread, onSeen]);

  return (
    <div
      ref={ref}
      className={`mt-3 rounded-xl border px-3 py-2.5 text-sm text-amber-950 ${
        unread
          ? "border-amber-400 bg-amber-50 ring-2 ring-amber-300/80 shadow-sm"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-bold text-xs uppercase tracking-wide">
          {t("myAds.moderationNoteTitle")}
        </p>
        {unread && (
          <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black uppercase text-white">
            {t("myAds.moderationNoteNew")}
          </span>
        )}
      </div>
      <p className="whitespace-pre-wrap leading-relaxed">{ad.moderation_note?.trim()}</p>
      <p className="text-xs text-amber-800 mt-2">{t("myAds.moderationNoteHint")}</p>
    </div>
  );
}
