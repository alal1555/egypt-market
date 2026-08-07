# Yaddii Marketplace (egypt-market)

Classifieds marketplace for Egypt — buy/sell vehicles, properties, pets, electronics, fashion, jobs, and education courses.

- **Repo:** https://github.com/alal1555/egypt-market
- **Owner:** Aly (`alal1555`)
- **Primary color:** `#FF6321`
- **Last updated:** Aug 8, 2026

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16.2.4 (App Router) |
| UI | React 19, Tailwind CSS v4, Lucide icons |
| Backend | Supabase (auth, Postgres, storage) |
| Language | TypeScript |

**Important:** This is Next.js 16 with breaking changes. Read `node_modules/next/dist/docs/` before writing Next.js code. See also `AGENTS.md`.

---

## Dev Setup

```bash
npm install
npm run dev    # runs next dev --webpack (NOT Turbopack — avoids cache corruption on Windows)
```

### Environment (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Supabase dashboard config

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** `http://localhost:3000/reset-password`, `http://localhost:3000/auth/callback`
- **Storage bucket:** `ad-images` (path: `ad-photos/{userId}/{timestamp}-{filename}`)

### Dev notes

- Use **one** dev server at a time. If port 3000 is in use, kill the stuck process before restarting.
- If Turbopack/HMR errors appear, delete `.next` and restart (dev uses Webpack, but stale cache can still cause issues).
- `next.config.ts` has `allowedDevOrigins: ['192.168.8.100']` for LAN access.
- Low disk space on C: can corrupt `.next` cache — keep 8–10 GB free.

---

## Project Structure

```
src/
├── app/              # Pages (App Router)
├── components/       # Navbar, BottomNav, AdCard, CategoryBar, DynamicAttributes
├── constants/        # categoryConfig.ts — category/attribute schema
├── lib/              # supabase.ts, utils.ts, vehicleService.ts
└── data/             # ads.ts — unused mock data (dead code)
.cursor/rules/        # yaddii-marketplace.mdc — always-on AI context rule
public/               # Static assets (logo.png)
```

No API routes. No Supabase migrations in repo. All auth checks are **client-side** (no middleware).

---

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Home feed — all active ads; category bar navigates to search |
| `/search` | Search + category/attribute filters (`?q=`, `?main_cat=`, `?sub_cat=`) |
| `/product/[id]` | Ad detail, call/WhatsApp seller |
| `/post-ad` | Create listing (status → `pending`) |
| `/my-ads` | User's listings |
| `/my-ads/edit/[id]` | Edit listing (resets status → `pending`) |
| `/favorites` | Saved ads |
| `/login` | Login + signup (`?mode=signup`) |
| `/signup` | Redirects to `/login?mode=signup` |
| `/forgot-password` | Send reset email |
| `/reset-password` | Set new password from recovery token |
| `/auth/callback` | Forwards hash to `/reset-password` |
| `/profile` | View/edit name & phone (client-only, no SSR) |
| `/admin/dashboard` | Ad approval + super-admin role management |

---

## Mobile Layout

| Element | Mobile behavior |
|---------|-----------------|
| **Navbar** | Logo row + auth buttons, then search bar row below (`md:hidden`) |
| **Header height** | ~102px total on mobile (layout uses `pt-[102px]`) |
| **CategoryBar** | Fixed at `top-[102px]` on mobile, `top-[64px]` on desktop |
| **BottomNav** | Fixed bottom tabs: Explore, Favorites, Post Ad, My Ads, Admin, Profile |
| **Search** | Navbar search submits to `/search?q=...` on all pages |

---

## Supabase Schema (inferred from code)

### `ads`
`id`, `user_id`, `title`, `price`, `location`, `description`, `category_slug`, `attributes` (JSONB), `images` (text[]), `seller_phone`, `status` (`pending` | `active` | `banned`), `created_at`

### `profiles`
`id` (FK auth.users), `role` (`user` | `admin` | `super`)

### `favorites`
`id`, `user_id`, `ad_id`

### `makes` / `models`
Vehicle make/model lookup for dynamic attributes.

---

## Category System

Single source of truth: `src/constants/categoryConfig.ts`

- 10 main categories (Vehicles Sale/Rent, Watercraft, Properties Sale/Rent, Pets, Electronics, Fashion, Business, Education)
- Each sub-category has typed attributes: `text | number | select | toggle | range`
- Helpers: `getAttributesBySlug()`, `getCategoryGroups()`
- Rent vehicle slugs: `vr_buses`, `vr_trucks`, `vr_motorcycles`, `vr_parts`
- **Home CategoryBar:** selecting a sub-category navigates to `/search?main_cat={main}&sub_cat={sub}`

---

## Auth Flows

| Flow | Notes |
|------|-------|
| Signup | Metadata: `full_name`, `phone_number` |
| Login | `signInWithPassword` |
| Password reset | `detectSessionInUrl: false`, `flowType: "implicit"` — manual hash handling |
| Reset page | Direct REST `PUT /auth/v1/user` with recovery bearer token (avoids SDK hang) |
| Callback | `/auth/callback` → `/reset-password` preserving hash |

No email verification gate. No OAuth.

---

## Admin

- **Access:** `profiles.role` = `admin` or `super`
- **Ads tab:** Approve / reject / ban / restore pending listings
- **Users tab (super only):** Promote/demote roles
- **Re-approval:** Editing an active ad sets `status: "pending"`

---

## Key Technical Decisions

1. **Webpack for dev** — Turbopack cache corrupts on Windows with low disk space
2. **Profile SSR disabled** — `dynamic(..., { ssr: false })` + auth timeout to avoid hydration races
3. **Nav prefetch disabled on `/profile`** — prevents prefetch-related hangs
4. **BottomNav FAB fix** — Post Ad button uses `relative` positioning (not `absolute`) so it doesn't block clicks
5. **Mobile search in navbar** — second row below logo on mobile; syncs with URL `q` param
6. **CategoryBar → search** — home category picks navigate to `/search` instead of client-side filtering
7. **Numeric JSONB attributes** — may need SQL cast for range filters (see comment in `utils.ts`)
8. **Admin refresh** — uses `router.refresh()` + `window.location.reload()` after status updates

---

## Git History (recent)

| Commit | Summary |
|--------|---------|
| `499e62e` | Mobile search bar + home category bar links to search |
| `90e4ea1` | PROJECT.md + Cursor rule for AI context |
| `e9aa6f3` | Profile page + nav links + webpack dev |
| `81fb339` | Password reset flow |
| `3398d84` | Re-approval on ad edit |
| `ac1fcaa` | Public ad hardening + mobile padding |
| `bf56651` | Signup wired to Supabase |
| `da57db6` | Search filters, rent slugs, seller phone |
| `8599d09` | MVP marketplace launch |

---

## Done

- Full classifieds CRUD with admin approval
- Category-driven dynamic attributes + search filters
- Favorites, vehicle make/model lookup
- Auth (login, signup, reset, profile)
- Admin dashboard with role hierarchy
- Mobile bottom nav + responsive layout
- Seller phone on ads (call/WhatsApp links)
- Mobile search bar in navbar
- Home category bar deep-links to `/search`
- PROJECT.md + Cursor rule for session continuity

---

## Pending / Known Gaps

- [ ] Wallet/balance feature (user chose profile only for now)
- [ ] Migrate old rent ads with duplicate slugs in Supabase (manual SQL)
- [ ] Dead code cleanup: `src/data/ads.ts`, unused `vehicleService.ts`, unused `react-range` dep
- [x] Logo asset (`public/logo.png`)
- [ ] Supabase RLS policies / migrations documented in repo
- [ ] Email verification, OAuth
- [ ] `toggle` attribute type defined but not rendered in `DynamicAttributes`
- [ ] Search page mobile filter UX (sidebar is desktop-oriented)
- [ ] README still default create-next-app boilerplate

---

## Conventions

- Path alias: `@/*` → `./src/*`
- Client components for all interactive pages
- Supabase client: `src/lib/supabase.ts`
- Phone formatting: `formatPhoneForLink()` in `src/lib/utils.ts`
- Spec extraction for cards: `extractSpecs()` in `src/lib/utils.ts`
