# Active Context: OurSkinOurFuture

## Current State

**Status**: ✅ Prototype built and deploying — full upload → analyze → results flow working; Vercel build fixed and green.

This is the **OurSkinOurFuture** skin diagnostic built for the YouCam Skin AI hackathon (deadline Aug 17, 2026). The repo is a Next.js 14 (App Router, JS) app. The canonical source tree is the **root `app/`** directory (an earlier `src/` TS rewrite was an orphaned duplicate and was removed on 2026-07-20).

## Recently Completed
- [x] Fixed Vercel build: added TypeScript dev deps; removed conflicting `src/` tree + `tsconfig.json`/`next.config.ts` that redirected the `@/` alias to `src/*`; kept `jsconfig.json` (`@/*` → root).
- [x] Wired `eslint` + `.eslintrc.json` and a `typecheck` (`tsc --noEmit`) script; `bun lint` / `bun typecheck` / `bun build` all pass.
- [x] Scaffolded `app/api/simulate/route.js` following the server-side-key pattern; `TimelineSlider` now fetches projections from it (falls back to local mock on error). Real YouCam image swap is a same-file change.
- [x] Full upload → analyze → results UI flow (capture / camera / analyzing / results states, no dead ends)
- [x] `mockSkinAnalysis()` — per-concern severity 0–100 across 8 concerns in YouCam severity-scale shape; seeded per-image so different photos vary
- [x] Facial zone map (forehead, cheeks, nose, chin, under-eye) with per-zone + per-concern scores
- [x] Ingredient recommendation cards mapping top concerns → actives (Retinol, Niacinamide, Centella, etc.)
- [x] Live LLM narrative at `/api/recommend` via Anthropic Claude (real call when `ANTHROPIC_API_KEY` set)
- [x] Treatment timeline slider (week 0–12) with diminishing-returns projection curve + per-concern before/after
- [x] Supabase auth + persistent scan history + week-over-week comparison
- [x] Build / lint / typecheck all pass

## Explicitly MOCKED (per roadmap, replace before submission)
- `lib/skinAnalysis.js` → `mockSkinAnalysis()` — stands in for YouCam Skin Analysis API (`/api/analyze` calls it)
- `lib/skinAnalysis.js` → `mockSimulation()` — stands in for YouCam AI Skin Simulation API; outputs **numbers only**, real API outputs **images** (highest-leverage task, M2/M3)

## Current Structure
| File | Purpose |
|------|---------|
| `app/page.js` | Landing page (pitch + "Try It Now!") |
| `app/dashboard/DashboardClient.jsx` | Main app: capture, analyze, results, save, compare |
| `app/auth/AuthForm.jsx` | Supabase sign in / sign up |
| `app/api/analyze/route.js` | Mock YouCam Skin Analysis (swap point) |
| `app/api/simulate/route.js` | Mock YouCam AI Skin Simulation (swap point, M2) |
| `app/api/recommend/route.js` | Live Claude narrative, graceful fallback |
| `components/TimelineSlider.jsx` | Week 0–12 projection slider (calls `/api/simulate`) |
| `components/FaceZoneMap.jsx` | SVG face + per-zone hotspot scores |
| `components/IngredientCard.jsx` | Active-ingredient recommendation cards |
| `components/ScanComparison.jsx` | Current vs. past scan comparison |
| `lib/skinAnalysis.js` | Domain logic: concerns, zones, ingredients, mocks, comparison math |
| `lib/supabase/client.js`, `lib/supabase/server.js` | Browser + server Supabase clients |
| `middleware.js` | Refreshes Supabase auth session |

## Key Decisions
- `@/*` alias resolves to repo root via `jsconfig.json` (Next.js honored over `tsconfig.json` because the app is JS, not TS). Do not reintroduce a `tsconfig.json` that maps `@/` to `src/`.
- `next.config.js` holds the Supabase remote image pattern; `next.config.ts` was removed as a conflicting duplicate.

## Next Milestones (from roadmap)
- **M1 (Aug 3–5)**: confirm YouCam redeem code, run both APIs via curl, capture real response shape
- **M2 (Aug 5–8)**: backend proxy routes `/api/analyze` + `/api/simulate` holding the API key server-side (scaffold done; live calls pending keys)
- **M3 (Aug 8–11)**: swap mocks; rebuild timeline around real images
- **M4 (Aug 11–15)**: polish, screenshots, submission text, demo video
- **M5 (Aug 15–17)**: buffer & submit with 12h margin

## Live API Status (2026-07-22)
- **Skin AI (`/s2s/v2.0/task/skin-analysis`)**: working. Returns `task_id`. Recent error `[DLQ] Max retries exhausted. Last error: list index out of range` appears intermittently on YouCam side; retry should mask it.
- **Skin Simulation (`/s2s/v2.0/task/skin-simulation`)**: still returning 400 on all payload shapes. Expanded attempts to 6 variants.
- **Apparel VTO endpoints**: all return 404 (`/task/apparel-try-on`, `/task/virtual-try-on`, `/task/vto`, `/s2s/v2.0/try-on`, `/task/apparel`, `/v1/apparel/try-on`). **Confirmed by user: VTO requires two inputs — user photo + garment image. Switched UX to garment-catalog selection flow.**

## Current Structure
| File | Purpose |
|------|---------|
| `app/page.js` | Landing page (pitch + "Try It Now!") |
| `app/dashboard/DashboardClient.jsx` | Main app: capture, analyze, results, save, compare |
| `app/auth/AuthForm.jsx` | Supabase sign in / sign up |
| `app/api/analyze/route.js` | YouCam Skin Analysis (live API, mock fallback) |
| `app/api/simulate/route.js` | YouCam Skin Simulation (live API, mock fallback, M2) |
| `app/api/analyze-and-style/route.js` | Unified skin analysis + image upload |
| `app/api/try-on/route.js` | **NEW** Garment-catalog VTO: `GET` returns color-matched wardrobe; `POST` accepts `userImage` + `garmentImage` |
| `app/api/recommend/route.js` | Live Claude narrative, graceful fallback |
| `app/api/progress-review/route.js` | Logged-in user progress review (last 30 days) |
| `components/TimelineSlider.jsx` | Week 0–12 projection slider (calls `/api/simulate`) |
| `components/FaceZoneMap.jsx` | SVG face + per-zone hotspot scores |
| `components/IngredientCard.jsx` | Active-ingredient recommendation cards |
| `components/ScanComparison.jsx` | Current vs. past scan comparison |
| `lib/youcam.js` | YouCam Skin AI + Simulation client |
| `lib/vto.js` | YouCam Apparel VTO client (user + garment image payloads) |
| `lib/garmentCatalog.js` | **NEW** Curated wardrobe catalog with undertone/color-theory mapping |
| `lib/imageUtils.js` | **NEW** Client-side photo-type detection + face crop |
| `lib/skinAnalysis.js` | Domain logic: concerns, zones, ingredients, mocks, comparison math |
| `lib/supabase/client.js`, `lib/supabase/server.js` | Browser + server Supabase clients |
| `middleware.js` | Refreshes Supabase auth session |

## Key Decisions
- `@/*` alias resolves to repo root via `jsconfig.json` (Next.js honored over `tsconfig.json` because the app is JS, not TS). Do not reintroduce a `tsconfig.json` that maps `@/` to `src/`.
- `next.config.js` holds the Supabase remote image pattern; `next.config.ts` was removed as a conflicting duplicate.
- **Apparel VTO payload** (confirmed by user): requires `user_image` + `garment_image` inputs; it is an Image-to-Image Garment-Transfer API, not an automated styling engine.
- **Garment catalog strategy**: pre-curated ~10 garments mapped to undertones + active concerns; replaces broken auto-style VTO flow.
- `extractPalette` / `recommendPieces` removed from dashboard; replaced by `getGarmentsForUndertone`.

## Session History
| Date | Changes |
|------|---------|
| Initial | Template created |
| 2026-07-20 (1) | Built full prototype (flow, zone map, recs, live narrative, timeline) |
| 2026-07-20 (2) | Fixed Vercel build: TS deps + removed conflicting `src/` tree; wired lint/typecheck |
| 2026-07-20 (3) | Scaffolded `/api/simulate`, wired TimelineSlider to it, updated ROADMAP/Memory Bank |
| 2026-07-20 (4) | Wired real YouCam Skin Analysis (`lib/youcam.js`) into `/api/analyze` w/ mock fallback; added `/api/qwen` (Qwen/DashScope) personalized plan; dashboard "routine" step (current products + lifestyle prefs); browsable History panel; extended `scans` table (routine/preferences/qwen_plan) + migration; `.env.example` |
| 2026-07-22 (1) | Verified `app/api/products/recommend/route.js` uses `await createClient()` and `app/dashboard/DashboardClient.jsx` products rendering uses confirmed schema field names |
| 2026-07-22 (2) | Intelligent photo detection (`lib/imageUtils.js`), unified `/api/analyze-and-style`, progress review (`/api/progress-review`), removed login CTA from landing page |
| 2026-07-22 (3) | Fixed VTO UX: switched to garment-catalog flow (`lib/garmentCatalog.js`), updated `/api/try-on` to accept `userImage` + `garmentImage`, updated dashboard garment selection cards |
| 2026-07-22 (4) | Expanded simulation payload attempts to 6 variants, added detailed YouCam request logging |
