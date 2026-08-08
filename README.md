# Yaddii Marketplace

Classifieds marketplace for Egypt — buy and sell vehicles, properties, pets, electronics, fashion, jobs, and more.

- **Live repo:** [github.com/alal1555/egypt-market](https://github.com/alal1555/egypt-market)
- **Stack:** Next.js 16 · React 19 · Tailwind CSS 4 · Supabase

---

## Features

- Browse and search listings with category-specific filters
- Post ads with photos, dynamic attributes, and seller phone (call / WhatsApp)
- User auth — signup, login, password reset, profile
- Favorites, my ads, edit listings (re-approval flow)
- Admin dashboard — approve, ban, and manage user roles
- Mobile-first layout with bottom nav and filter bottom sheet

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/alal1555/egypt-market.git
cd egypt-market
npm install
```

### 2. Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Supabase setup

Follow **[supabase/README.md](./supabase/README.md)** to:

1. Run `supabase/schema.sql` and `supabase/rls.sql` in the SQL Editor
2. Create the `ad-images` storage bucket
3. Configure auth redirect URLs
4. Promote your first user to `super` admin

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Notes:**

- Dev uses **Webpack** (`next dev --webpack`) for stability on Windows
- Test on your phone via LAN: `http://YOUR_LOCAL_IP:3000` (see `allowedDevOrigins` in `next.config.ts`)
- If the dev server crashes, delete `.next` and restart

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Webpack) |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run lint` | ESLint |

---

## Project docs

| Doc | Purpose |
|-----|---------|
| [PROJECT.md](./PROJECT.md) | Full project reference — routes, schema, decisions, pending work |
| [supabase/README.md](./supabase/README.md) | Database schema, RLS, storage, troubleshooting |
| [AGENTS.md](./AGENTS.md) | Next.js 16 notes for AI / contributors |

---

## Key routes

| Route | Description |
|-------|-------------|
| `/` | Home feed |
| `/search` | Search + filters |
| `/post-ad` | Create listing |
| `/my-ads` | Seller dashboard |
| `/favorites` | Saved ads |
| `/profile` | Account settings |
| `/admin/dashboard` | Admin moderation (admin/super only) |

---

## License

Private project — all rights reserved.
