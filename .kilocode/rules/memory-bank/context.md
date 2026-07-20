# Active Context: OurSkinOurFuture

## Current State

**Status**: ✅ Prototype built — full upload → analyze → results flow working locally.

This is the **OurSkinOurFuture** skin diagnostic built for the YouCam Skin AI hackathon (deadline Aug 17, 2026). The repo started as a blank Next.js 16 template and now implements the roadmap's "working today" feature set.

## Recently Completed

- [x] Full upload → analyze → results UI flow (idle / analyzing / results states, no dead ends)
- [x] `mockSkinAnalysis()` — per-concern severity 0–100 across 8 concerns in YouCam severity-scale shape; seeded per-image so different photos vary
- [x] Facial zone map (forehead, cheeks, nose, chin, under-eye) with per-zone + per-concern scores — the product's differentiation
- [x] Ingredient recommendation cards mapping top concerns → actives (Retinol, Niacinamide, Centella, etc.)
- [x] Live LLM narrative at `/api/narrative` via Anthropic Claude (real call when `ANTHROPIC_API_KEY` set; templated fallback otherwise)
- [x] Treatment timeline slider (week 0–12) with diminishing-returns projection curve + per-concern before/after
- [x] Build/typecheck/lint all pass

## Explicitly MOCKED (per roadmap, replace before submission)

- `src/lib/mockAnalysis.ts` — stands in for YouCam Skin Analysis API (M2/M3: swap for `/api/analyze`)
- `src/lib/mockSimulation.ts` — stands in for YouCam AI Skin Simulation API; outputs **numbers only**, real API outputs **images** (highest-leverage task)

## Current Structure

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Orchestrates the flow (client component) |
| `src/app/api/narrative/route.ts` | Live Claude narrative, graceful fallback |
| `src/components/UploadStep.tsx` | Drag/drop + file upload, validation |
| `src/components/ZoneMap.tsx` | SVG face + per-zone hotspot scores |
| `src/components/ConcernBars.tsx` | Per-concern severity bars |
| `src/components/IngredientCards.tsx` | Active-ingredient recommendation cards |
| `src/components/Narrative.tsx` | LLM narrative block |
| `src/components/Timeline.tsx` | Week 0–12 projection slider |
| `src/lib/types.ts` | Domain types + concern/zone labels |
| `src/lib/mockAnalysis.ts` | MOCK YouCam Skin Analysis |
| `src/lib/mockSimulation.ts` | MOCK YouCam AI Skin Simulation |
| `src/lib/recommendations.ts` | Concern→ingredient logic |

## Key Decisions

- Replaced `next/font/google` Geist with a system font stack — Google Fonts fetch fails in the build sandbox; keeps build offline-clean.
- Tailwind v4 CSS-first config (uses `globals.css` vars), dark theme.

## Next Milestones (from roadmap)

- **M1 (Aug 3–5)**: confirm YouCam redeem code, run both APIs via curl, capture real response shape
- **M2 (Aug 5–8)**: backend proxy routes `/api/analyze` + `/api/simulate` holding the API key server-side
- **M3 (Aug 8–11)**: swap mocks; rebuild timeline around real images
- **M4 (Aug 11–15)**: polish, screenshots, submission text, demo video
- **M5 (Aug 15–17)**: buffer + submit with 12h margin

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created |
| 2026-07-20 | Built full OurSkinOurFuture prototype (flow, zone map, recs, live narrative, timeline) |
