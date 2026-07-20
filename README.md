# OurSkinOurFuture

A skin diagnostic that shows what's happening now — and what consistent care could look like weeks from now. Built for the YouCam API Skin AI & Apparel VTO Hackathon (Skin AI track).

See [`ROADMAP.md`](./ROADMAP.md) for the full project plan and current build status. This README covers only setup and deployment.

---

## What's real vs. mocked in this build

| Feature | Status |
|---|---|
| Camera capture, upload, full UI flow | Real, fully working |
| Skin condition analysis (`/api/analyze`) | **Mocked** — see comments in `app/api/analyze/route.js` |
| Treatment projection curve | **Mocked** — numbers only, not real before/after images |
| Personal recommendation narrative (`/api/recommend`) | **Real** — live call to Claude, server-side |
| Supabase auth (sign up / sign in) | Real, fully working |
| Scan history + week-over-week comparison | Real, fully working — compares whatever scores are in the database, mocked or not |

The mock functions are isolated in `lib/skinAnalysis.js` and clearly commented with what a real YouCam integration needs to replace them. This was a deliberate structure — not corner-cutting — so the swap described in `ROADMAP.md` Milestones M1–M3 is a same-file change, not a rewrite.

---

## 1. Local setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` with real values (see sections 2 and 3 below), then:

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

## 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In your project dashboard, go to **SQL Editor → New Query**, paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates the `scans` table, its security policies, and the `scan-photos` storage bucket in one step.
3. Go to **Settings → API**. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. By default, Supabase requires email confirmation before sign-in works. For faster local testing, you can disable this under **Authentication → Providers → Email → Confirm email** — remember to re-enable it before a public launch.

---

## 3. Get an Anthropic API key

The `/api/recommend` route makes a real, live call to Claude to write the personal recommendation text.

1. Create a key at [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys).
2. Set it as `ANTHROPIC_API_KEY` in `.env.local` (and later, in Vercel — see below). This key is only ever read server-side; it is never sent to the browser.

---

## 4. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — OurSkinOurFuture"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ourskinourfuture.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username, and create the empty repository on GitHub first if it doesn't exist yet.

---

## 5. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repository you just pushed.
2. Vercel will auto-detect Next.js — no build configuration changes needed.
3. Before the first deploy, add these under **Environment Variables**:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from Supabase Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase Settings → API |
   | `ANTHROPIC_API_KEY` | from console.anthropic.com |
   | `YOUCAM_API_KEY` | leave blank until Roadmap M1/M2 are complete |

4. Click **Deploy**.

Every future `git push` to `main` triggers an automatic redeploy — that's the GitHub → Vercel pipeline this setup gives you; no manual redeploying required after this first setup.

### After deploying

Supabase's auth redirect needs to know your production URL:

1. In Supabase, go to **Authentication → URL Configuration**.
2. Set **Site URL** to your Vercel deployment URL (e.g. `https://ourskinourfuture.vercel.app`).
3. Add the same URL under **Redirect URLs**.

Without this step, email confirmation links sent after sign-up will redirect to `localhost` instead of your live site.

---

## Project structure

```
app/
  page.js                 → landing page (pitch + "Try It Now!")
  auth/                    → Supabase sign in / sign up
  dashboard/               → main app: capture, analyze, results, save, compare
  api/analyze/             → mocked skin analysis endpoint
  api/recommend/           → live Claude call for personal recommendation
components/                → shared UI: zone map, score ring, camera, comparison, etc.
lib/skinAnalysis.js        → all domain logic — labels, ingredient map, mock data, comparison math
lib/supabase/               → browser + server Supabase client setup
supabase/schema.sql         → run once in Supabase SQL Editor to set up the database
middleware.js               → keeps Supabase auth session refreshed
ROADMAP.md                  → full project plan, milestones, and what's left before submission
```
