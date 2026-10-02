-- Yaddii Marketplace — seller "SOLD" stamp on listings
-- Run in Supabase SQL Editor after schema.sql

alter table public.ads
  add column if not exists marked_sold_at timestamptz;

comment on column public.ads.marked_sold_at is 'When the seller marked the item as sold (display stamp; listing may still be active until expiry).';

notify pgrst, 'reload schema';
