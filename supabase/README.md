# Supabase setup — Yaddii Marketplace

Database schema, RLS policies, and dashboard configuration for the `egypt-market` app.

The app uses the **anon key** client-side only (`src/lib/supabase.ts`). RLS must be enabled — never expose the service role key in the Next.js app.

---

## Quick setup (new project)

### 1. Environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Run SQL

In **Supabase Dashboard → SQL Editor**, run in order:

1. [`schema.sql`](./schema.sql) — tables, indexes, signup trigger, helper functions
2. [`rls.sql`](./rls.sql) — row level security policies
3. [`wallet.sql`](./wallet.sql) — wallet columns, transactions, credit functions

If tables already exist, compare columns and add missing ones manually instead of re-running `create table`.

### 3. Storage bucket

**Dashboard → Storage → New bucket**

| Setting | Value |
|---------|-------|
| Name | `ad-images` |
| Public | **Yes** (images use `getPublicUrl`) |

**Policies** (Storage → ad-images → Policies):

- **SELECT** — public read (`anon` + `authenticated`)
- **INSERT** — authenticated users, path must start with `ad-photos/{their_user_id}/`

Example insert policy expression:

```
bucket_id = 'ad-images'
AND (storage.foldername(name))[1] = 'ad-photos'
AND (storage.foldername(name))[2] = auth.uid()::text
```

Upload path used in app: `ad-photos/{userId}/{timestamp}-{filename}`

### 4. Auth URLs

**Dashboard → Authentication → URL Configuration**

| Setting | Local dev | Production |
|---------|-----------|------------|
| Site URL | `http://localhost:3000` | your domain |
| Redirect URLs | `http://localhost:3000/reset-password` | same on prod |
| | `http://localhost:3000/auth/callback` | |
| | `http://192.168.8.100:3000/reset-password` | (optional LAN testing) |

**Email auth** — enabled (signup/login/password reset).

Signup stores metadata in `auth.users`:

- `full_name`
- `phone_number`

Profile page updates these via `supabase.auth.updateUser`.

### 5. Phone auth (wallet welcome credits)

**Dashboard → Authentication → Providers → Phone** — enable Phone provider for SMS OTP verification.

Users verify phone on `/profile` to unlock **3 free ads + 300 EGP** (90-day balance expiry).

### 6. First super admin

After your first account signs up, promote yourself in SQL Editor:

```sql
update public.profiles
set role = 'super'
where id = 'YOUR_USER_UUID';
```

Super admins can promote others to `admin` from `/admin/dashboard`.

---

## Schema overview

### `profiles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | FK → `auth.users.id` |
| `role` | text | `user` \| `admin` \| `super` |
| `free_ads_remaining` | int | Welcome + unused free ad slots |
| `balance` | numeric | EGP wallet balance |
| `balance_expires_at` | timestamptz | Welcome balance expiry (90 days) |
| `phone_verified` | boolean | Required before posting |
| `welcome_credits_granted` | boolean | One-time welcome bundle |
| `created_at` | timestamptz | auto |

### `wallet_transactions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `amount` | numeric | Negative = spend, positive = grant |
| `type` | text | `welcome_grant`, `free_ad`, `ad_post`, … |
| `ad_id` | uuid | Optional link to listing |
| `description` | text | |
| `created_at` | timestamptz | |

**Ad posting:** 40 EGP per ad after free ads used. RPC: `can_post_ad`, `consume_ad_credit`, `grant_welcome_credits`.

Auto-created on signup via `handle_new_user()` trigger.

### `ads`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | auto |
| `user_id` | uuid FK | seller |
| `title` | text | |
| `price` | numeric | |
| `location` | text | |
| `description` | text | optional |
| `category_slug` | text | sub-category from `categoryConfig.ts` |
| `attributes` | jsonb | dynamic fields (make_id, year, …) |
| `images` | text[] | public URLs from storage |
| `seller_phone` | text | call / WhatsApp |
| `status` | text | `pending` \| `active` \| `banned` |
| `created_at` | timestamptz | auto |

**App flow:** new/edited ads → `pending` → admin sets `active` or `banned`.

### `favorites`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `ad_id` | uuid FK → ads | |
| unique | `(user_id, ad_id)` | |

### `makes` / `models`

Reference data for vehicle attributes. Public read.

**Recommended:** run [`seed-vehicles.sql`](./seed-vehicles.sql) for ~58 makes and ~600 models (Egypt-focused, includes **Other** per make). Safe to re-run — skips duplicates.

```sql
-- In SQL Editor: paste and run the full seed-vehicles.sql file
```

To regenerate the seed from source data:

```bash
node supabase/scripts/generate-vehicle-seed.mjs
```

Manual example (small test only):

```sql
insert into public.makes (name) values ('Toyota'), ('BMW') on conflict (name) do nothing;
insert into public.models (name, make_id)
select 'Corolla', id from public.makes where name = 'Toyota'
and not exists (select 1 from public.models where make_id = makes.id and name = 'Corolla');
```

---

## RLS summary

| Table | anon | authenticated user | admin | super |
|-------|------|-------------------|-------|-------|
| **ads** | read `active` | CRUD own; read own all statuses | read/update all | same as admin |
| **profiles** | — | read own | read all | upsert roles |
| **favorites** | — | CRUD own | — | — |
| **makes/models** | read | read | read | read |

Helper functions (security definer):

- `public.is_admin()` — role in (`admin`, `super`)
- `public.is_super()` — role = `super`

---

## Existing database migrations

### Rent category slug fix

If old ads use duplicate rent slugs, migrate manually:

```sql
-- Example only — adjust slugs to match categoryConfig.ts
-- update public.ads set category_slug = 'vr_buses' where category_slug = 'old_slug';
```

### Numeric JSONB attributes

Range filters on `/search` work best when numeric fields are stored as JSON numbers, not strings. See comment in `src/lib/utils.ts`:

```sql
update public.ads
set attributes = jsonb_set(attributes, '{year}', to_jsonb((attributes->>'year')::int))
where (attributes->>'year') ~ '^[0-9]+$';
-- Repeat for mileage, bedrooms, area, etc.
```

---

## How the app uses each table

| Feature | Tables |
|---------|--------|
| Home / search / product | `ads` (active), `makes`, `models` |
| Post ad | `ads` insert, `ad-images` storage |
| My ads / edit | `ads` (own rows) |
| Favorites | `favorites` + join `ads` |
| Admin dashboard | `ads` (all), `profiles` |
| Navbar / profile role | `profiles` |
| Dynamic vehicle fields | `makes`, `models` |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Ads not visible on home | Check `status = 'active'` and RLS `ads_select_active` |
| Can't post ad | User logged in? RLS `ads_insert_own`? Storage upload policy? |
| Admin dashboard empty | `profiles.role` must be `admin` or `super` |
| Favorites fail | RLS on `favorites`; user must be authenticated |
| Password reset hangs | Add redirect URLs; app uses implicit flow + `/auth/callback` |
| Range search broken | Cast numeric JSONB fields (see above) |

---

## Files in this folder

| File | Purpose |
|------|---------|
| `schema.sql` | Tables, indexes, triggers, helper functions |
| `rls.sql` | Row Level Security policies |
| `README.md` | This guide |

After schema changes, update [`PROJECT.md`](../PROJECT.md) and test with the anon key (same as production client).
