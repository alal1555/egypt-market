-- Admin feedback to seller before approving an ad (run once in Supabase SQL Editor)

alter table public.ads
  add column if not exists moderation_note text,
  add column if not exists moderation_note_at timestamptz;

comment on column public.ads.moderation_note is 'Admin message to seller: changes needed before approval.';
comment on column public.ads.moderation_note_at is 'When moderation_note was last sent.';

notify pgrst, 'reload schema';
