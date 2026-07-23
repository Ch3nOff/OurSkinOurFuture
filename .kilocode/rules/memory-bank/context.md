# Active Context: OurSkinOurFuture

## Current State

**Status**: ✅ Prototype built and deploying — full upload → face validation → analyze → results flow working; Vercel build fixed and green.

This is **OurSkinOurFuture** — a Predictive Clinical Skin Suite built for the YouCam Skin AI hackathon (deadline Aug 17, 2026). The repo is a Next.js 14 (App Router, JS) app. The canonical source tree is the **root `app/`** directory.

## Recently Completed
- [x] **VTO removal**: Deleted all apparel try-on code (routes, libs, UI, garment catalog). App is now 100% focused on facial skin.
- [x] **OurSkinOurFuture rebrand**: Updated landing page, dashboard header, section titles, and metadata to clinical skin-suite branding.
- [x] **Full scan persistence**: `handleSave` now saves all YouCam fields (`masks`, `overall_score`, `skin_age`, `skin_types`, `mock`, `resize_image`, `simulation`) plus photo and routine data.
- [x] **Visual history panel**: Replaced plain history list with a card-based Scan Timeline grid showing thumbnails, score badges, dates, top concerns, and demo tags.
- [x] **History save-button logic**: Save button is hidden when viewing a past scan (`viewingHistory` flag), shown only for fresh captures/analyses.
- [x] **Simulation persistence**: Simulation results are saved to `scans.simulation` and reused from history via `TimelineSlider`'s `savedSimulation` prop instead of re-calling `/api/simulate`.
- [x] **FaceGuide component** (`components/FaceGuide.jsx`): Post-capture validation that checks image dimensions, aspect ratio, brightness, and glasses detection.
- [x] **Glasses detection API** (`app/api/glasses-detect/route.js`): Primary via YouCam `face-attribute` task; fallback heuristic on eye-region dark-pixel ratio.
- [x] **Face guide UI**: Upload screen shows a dashed oval guide with "Center face · No glasses" prompt. Validation results appear after photo capture.
- [x] **Clinical section naming**: Diagnostic Summary, Zone Diagnostic Map, Concern Severity, Your Protocol, Treatment Simulation.
- [x] **Enhanced `/api/analyze`**: Supports `GET?mode=color-tone` and `GET?mode=face-attribute` for additional YouCam endpoints.
- [x] **Simulation wiring**: TimelineSlider calls `/api/simulate` → `simulateWithYouCamFromUrl` with 6 payload variants. Real images pending YouCam endpoint acceptance.
- [x] Build / lint / typecheck all pass

## Explicitly MOCKED (per roadmap, replace before submission)
- `lib/skinAnalysis.js` → `mockSkinAnalysis()` — stands in for YouCam Skin Analysis API
- `lib/skinAnalysis.js` → `mockSimulation()` — stands in for YouCam AI Skin Simulation API; outputs numbers only, real API outputs images

## Current Structure
| File | Purpose |
|------|---------|
| `app/page.js` | Landing page (OurSkinOurFuture branding) |
| `app/dashboard/DashboardClient.jsx` | Main app: capture, face validation, analyze, results, save, compare |
| `app/auth/AuthForm.jsx` | Supabase sign in / sign up |
| `app/api/analyze/route.js` | Live YouCam Skin Analysis (POST) + GET color-tone/face-attribute modes |
| `app/api/simulate/route.js` | Live YouCam Skin Simulation (mock fallback until endpoint works) |
| `app/api/recommend/route.js` | Live Qwen narrative, graceful fallback |
| `app/api/progress-review/route.js` | Logged-in user progress review (last 30 days) |
| `app/api/glasses-detect/route.js` | **NEW** Glasses detection via YouCam face-attribute API |
| `components/FaceGuide.jsx` | **NEW** Post-capture validation: brightness, aspect ratio, glasses detection |
| `components/TimelineSlider.jsx` | Week 0–12 projection slider |
| `components/FaceZoneMap.jsx` | SVG face + per-zone hotspot scores |
| `components/IngredientCard.jsx` | Active-ingredient recommendation cards |
| `components/ScanComparison.jsx` | Current vs. past scan comparison |
| `lib/youcam.js` | YouCam Skin AI + Simulation client (skin-analysis, skin-simulation, face-attribute) |
| `lib/skinAnalysis.js` | Domain logic: concerns, zones, ingredients, mocks, comparison math, routine builder |
| `lib/imageUtils.js` | Client-side crop-to-face helper |
| `lib/supabase/client.js`, `lib/supabase/server.js` | Browser + server Supabase clients |
| `middleware.js` | Refreshes Supabase auth session |

## Key Decisions
- `@/*` alias resolves to repo root via `jsconfig.json` (Next.js honored over `tsconfig.json` because the app is JS, not TS). Do not reintroduce a `tsconfig.json` that maps `@/` to `src/`.
- `next.config.js` holds the Supabase remote image pattern; `next.config.ts` was removed as a conflicting duplicate.
- **Brand**: OurSkinOurFuture — Predictive Clinical Skin Suite
- **Track**: Perfect Corp Skin AI Track 1 (pure facial skin intelligence)
- **VTO removed**: All apparel try-on code deleted; focus is 100% facial skin
- **Face validation flow**: capture/upload → FaceGuide checks brightness, aspect ratio, glasses → analyze → results
- **Glasses detection**: Primary via YouCam `face-attribute` API; fallback heuristic on eye-region dark-pixel ratio
- **Camera guidance**: Face guide overlay in upload screen with "Center face · No glasses" prompt
- **Simulation**: TimelineSlider calls `/api/simulate` → `simulateWithYouCamFromUrl` with 6 payload variants; real images pending YouCam endpoint acceptance

## Next Milestones
- **M1**: Confirm YouCam redeem code, run both APIs via curl, capture real response shape
- **M2**: Backend proxy routes `/api/analyze` + `/api/simulate` holding the API key server-side (scaffold done; live calls pending keys)
- **M3**: Swap mocks; rebuild timeline around real images
- **M4**: Polish, screenshots, submission text, demo video
- **M5**: Buffer & submit with 12h margin

## Live API Status
- **Skin AI (`/s2s/v2.0/task/skin-analysis`)**: working. Returns `task_id`. Recent error `[DLQ] Max retries exhausted. Last error: list index out of range` appears intermittently on YouCam side; retry should mask it.
- **Skin Simulation (`/s2s/v2.0/task/skin-simulation`)**: still returning 400 on all payload shapes. Expanded attempts to 6 variants.
- **Face Attribute (`/s2s/v2.0/task/face-attribute`)**: available for glasses detection and face metrics.

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
| 2026-07-22 (5) | Added retry logic for skin analysis + simulation, garment catalog flow |
| 2026-07-22 (6) | Visual polish: Top Concerns severity bars, Skin Health Snapshot, Skin Condition Radar, Color Harmony section, personalized Routine builder, before/after toggle, concern icons |
| 2026-07-23 (1) | **VTO removal**: deleted try-on routes, garment catalog, VTO lib, ManualCrop, SkinHealthDashboard; simplified crop to guided upload |
| 2026-07-23 (2) | **OurSkinOurFuture pivot**: rebranded to clinical skin suite, added FaceGuide validation component, glasses detection API (`/api/glasses-detect`), updated all section copy to diagnostic terminology |
| 2026-07-23 (3) | **Save + zone map fixes**: `handleSave` now persists `masks`, `overall_score`, `skin_age`, `skin_types`, `mock`, `resize_image`; added `migration_add_youcam_fields.sql`; fixed `FaceZoneMap` mask positioning by adding explicit `x/y/w/h` to `POSITIONS` |
| 2026-07-23 (4) | **Simulation persistence**: added `scans.simulation` JSONB column; `TimelineSlider` accepts `savedSimulation` prop and `onSimulationReady` callback; DashboardClient stores simulation in state and saves it with the scan; viewing history reuses saved simulation instead of calling `/api/simulate` again; redesigned history panel as visual Scan Timeline grid with score badges and demo tags |
