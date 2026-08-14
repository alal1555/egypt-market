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
4. [`ad-expiry.sql`](./ad-expiry.sql) — listing `expires_at`, 30-day visibility, `renew_ad` RPC
5. [`top-up.sql`](./top-up.sql) — Paymob wallet top-up + `apply_top_up` RPC
6. [`schema-alignment.sql`](./schema-alignment.sql) — fix live drift (orphan ads, legacy columns, NOT NULL, duplicate RLS)

If tables already exist, compare columns and add missing ones manually instead of re-running `create table`.

**Existing yaddii project:** run step 6 once to remove legacy Supabase starter policies that exposed all ads/profiles publicly.

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

### 5. Phone auth (wallet welcome credits) — SMS Misr

The app sends OTP from **Profile → Ad Credits** via Supabase Auth. Supabase generates the code; [`functions/send-sms/`](./functions/send-sms/) delivers it through **SMS Misr** (Egypt).

**App flow (no Next.js changes):**

1. User clicks **Send verification code** → `updateUser({ phone })`
2. Supabase triggers **Send SMS hook** → Edge Function → SMS Misr OTP API
3. User enters code → `verifyOtp({ type: "phone_change" })`
4. `grant_welcome_credits()` → 300 EGP wallet balance (90-day expiry)

New users get **3 free ads on signup**; phone verification unlocks the **300 EGP** balance only.

#### A. SMS Misr console (you)

| Item | Where |
|------|--------|
| Username & password | [Client/Settings](https://smsmisr.com/Client/Settings) |
| Sender token (test) | **Test Sender** — use while `SMSMISR_ENVIRONMENT=2` |
| Sender token (live) | **Yaddii** — after status = Approved |
| Template token | OTP / Templates section — **required** for OTP API |

Test sender token (from SMS Misr docs, test env only):

```
b611afb996655a94c8e942a823f1421de42bf8335d24ba1f84c437b2ab11ca27
```

Request an OTP template if you have none (e.g. “Your Yaddii verification code is {otp}”).

#### B. Deploy Edge Function

Install [Supabase CLI](https://supabase.com/docs/guides/cli), log in, link project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Set secrets (use **Test Sender** + `environment=2` until Yaddii is approved):

```bash
supabase secrets set \
  SMSMISR_USERNAME="your_username" \
  SMSMISR_PASSWORD="your_password" \
  SMSMISR_SENDER="b611afb996655a94c8e942a823f1421de42bf8335d24ba1f84c437b2ab11ca27" \
  SMSMISR_TEMPLATE="your_template_token" \
  SMSMISR_ENVIRONMENT="2"
```

Deploy (hook must run without JWT — see `config.toml`):

```bash
supabase functions deploy send-sms --no-verify-jwt
```

#### C. Supabase Dashboard

1. **Authentication → Providers → Phone** — enable Phone provider
2. **SMS provider** — choose **Hook** (not Twilio / Textlocal)
3. **Authentication → Hooks → Send SMS**
   - Enable hook
   - URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-sms`
   - Generate **hook secret** → set as `SEND_SMS_HOOK_SECRET`:

```bash
supabase secrets set SEND_SMS_HOOK_SECRET="v1,whsec_..."
```

4. Re-deploy or restart function after adding the secret

#### D. Go live (after Yaddii sender approved)

```bash
supabase secrets set \
  SMSMISR_SENDER="your_yaddii_sender_token" \
  SMSMISR_ENVIRONMENT="1"
```

#### E. Dev bypass (no SMS)

```sql
select public.grant_welcome_credits('USER_UUID');
```

#### Troubleshooting

| Symptom | Fix |
|---------|-----|
| Hook 500 / invalid signature | `SEND_SMS_HOOK_SECRET` must match Dashboard hook secret exactly |
| SMS Misr 4903 | Wrong username/password |
| SMS Misr 4904 | Invalid sender token |
| SMS Misr 4909 | Invalid template token — create OTP template in console |
| SMS Misr 4906 | Insufficient credit — recharge balance |
| No SMS, no error | Check **Edge Functions → send-sms → Logs** |

Function logs: `supabase functions logs send-sms`

### 6. Wallet top-up (Paymob)

Users add EGP balance at **`/wallet/top-up`** (phone verified required). Payments run through [Paymob Accept](https://developers.paymob.com/egypt/getting-started-egypt).

#### A. Paymob dashboard

1. Create a Paymob Accept account and get your **API Key**
2. Create an **Integration** (card / wallet) → note **Integration ID**
3. Create an **iFrame** linked to that integration → note **iFrame ID**
4. **Settings → Account → HMAC** → copy **HMAC secret** for transaction processed callback

#### B. Supabase

Run [`top-up.sql`](./top-up.sql) after `wallet.sql` (creates `wallet_top_ups`, `apply_top_up` RPC).

#### C. App environment (`.env.local`)

```bash
# Existing Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # server only — never expose to client

# Paymob (server only except site URL)
PAYMOB_API_KEY=...
PAYMOB_INTEGRATION_ID=...
PAYMOB_IFRAME_ID=...
PAYMOB_HMAC_SECRET=...

# Production site (webhook redirect URLs)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

#### D. Paymob webhook URL

In Paymob dashboard, set **Transaction processed callback** to:

```
https://your-domain.com/api/wallet/top-up/webhook
```

For local testing use [ngrok](https://ngrok.com/) and point the callback to your tunnel URL.

#### E. Flow

1. User picks amount (100 / 200 / 500 / 1000 EGP) → `POST /api/wallet/top-up/create`
2. Paymob iFrame collects payment
3. Paymob POSTs to webhook → `apply_top_up()` credits `profiles.balance`
4. User lands on `/wallet/top-up/result` and sees updated balance

### 7. First super admin

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
| `free_ads_remaining` | int | Starter free ad slots (3 on signup) |
| `balance` | numeric | Wallet balance in EGP |
| `balance_expires_at` | timestamptz | Welcome balance expiry (90 days) |
| `phone_verified` | boolean | Required to spend wallet balance |
| `welcome_credits_granted` | boolean | One-time 300 EGP welcome balance |
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

**Ad posting:** 3 free ads on signup; 40 EGP per ad from wallet balance after that. Phone verify required for balance. Each approved listing stays live **30 days** (`expires_at`); renew via `renew_ad`. RPC: `can_post_ad`, `consume_ad_credit`, `grant_welcome_credits`, `renew_ad`.

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
| `expires_at` | timestamptz | Public visibility end (30 days after approval) |

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
| `wallet.sql` | Wallet columns, RPCs, transactions |
| `ad-expiry.sql` | Listing expiry + renew RPC |
| `top-up.sql` | Paymob wallet top-up |
| `seed-vehicles.sql` | Vehicle makes/models seed |
| `functions/send-sms/` | Auth Send SMS hook → SMS Misr OTP |
| `config.toml` | Edge Function config (`verify_jwt = false` for hook) |
| `README.md` | This guide |

After schema changes, update [`PROJECT.md`](../PROJECT.md) and test with the anon key (same as production client).
