# OurSkinOurFuture — Roadmap

**Track:** Skin AI · YouCam API Skin AI & Apparel VTO Hackathon
**Deadline:** August 17, 2026, 11:45 PM GMT+8
**One-line pitch:** A skin diagnostic that doesn't stop at "what's wrong" — it shows what your skin looks like months from now if you act on the recommendation, using YouCam's Skin Analysis and AI Skin Simulation APIs.

---

## 1. Product Thesis

People don't check their skin in the abstract — they check it right before a purchase, right after a breakout, right in front of a mirror deciding if something's working. Most tools answer the diagnostic half of that moment ("here's what's wrong") and stop. OurSkinOurFuture answers the second half too: **if you follow through, here's what changes, and by when.**

Three layers, each doing one job:

| Layer | Job | Status |
|---|---|---|
| Diagnosis | Score skin condition across concerns and facial zones | Mock complete, real API pending |
| Prescription | Turn scores into specific active ingredients, explained in plain language | Live (Claude-generated) |
| Projection | Show a believable timeline of improvement if the routine is followed | Mock complete, real API pending |

---

## 2. Current State (as of this build)

The product moved from a single-file React artifact prototype to a full deployable Next.js app — file structure, auth, and persistence are real; only the two YouCam API calls remain mocked.

**Working today, deployable via GitHub → Vercel:**
- Full landing page (pitch first) → "Try It Now!" → capture/upload → analyze → results flow, no dead ends
- In-browser camera capture (`getUserMedia`) as the primary input method, with file upload as a secondary option and a note steering users toward camera for best accuracy
- Mock skin analysis returning per-concern scores (0–100) across 8 concerns, matching YouCam's documented severity-scale shape — swapping in the real endpoint is a drop-in change, not a rewrite, since it's isolated behind `/api/analyze`
- Facial zone map (forehead, cheeks, nose, chin, under-eye) with per-zone scores — the product's actual point of differentiation, since skin condition isn't uniform across the face
- Ingredient recommendation cards mapping top concerns to specific actives (Retinol, Niacinamide, Centella Asiatica, etc.)
- **Live LLM call** (not mocked) generating a personal, plain-language narrative from the top 3 concerns — now server-side via `/api/recommend`, so the Anthropic key never reaches the browser
- Treatment timeline slider (week 0–12) with a realistic diminishing-returns improvement curve, per-concern before/after readout
- **Supabase auth** (email/password sign up and sign in), with the full scan flow usable anonymously and a prompt to sign in only at the save step
- **Persistent scan history**: saved scans write to a Supabase `scans` table (Row Level Security scoped per user), with photos in a private-per-user storage bucket
- **Comparison view**: every completed scan auto-compares against the user's most recent saved scan, with a manual picker to compare against any past scan instead

**Explicitly mocked, needs replacing before submission:**
- `mockSkinAnalysis()` in `lib/skinAnalysis.js` — stands in for YouCam Skin Analysis API. **As of 2026-07-20, `/api/analyze` now calls the REAL YouCam Skin Analysis API (`lib/youcam.js`) when `YOUCAM_API_KEY` is set, falling back to the mock otherwise. M2 backend proxy is effectively done; remaining work is verifying the live response-shape mapping.**
- `mockSimulation()` in `lib/skinAnalysis.js`, called from `TimelineSlider.jsx` via `/api/simulate` — stands in for YouCam AI Skin Simulation API, and critically, only outputs *numbers*. The real API outputs actual before/after **images**. Replacing this is the single highest-leverage task on this roadmap — a visual projection is a fundamentally stronger demo than a number going down.

**Newly added (2026-07-20):**
- `app/api/qwen/route.js` — **live** Qwen (DashScope OpenAI-compatible) personalized plan generator. Takes the face `concerns`, the user's current `routine`, and `preferences` (daily-life context: sleep, sun, diet, stress, activity), and returns a plan that (1) validates the value of what the user already uses, (2) recommends actives per concern, and (3) translates facial signals into daily health/lifestyle habits. Falls back to a templated plan when `DASHSCOPE_API_KEY` is absent.
- Dashboard flow now: capture → analyze → results → **routine** (current products + lifestyle prefs + Qwen plan) → save. Past scans are browsable via a **History** panel and reloadable.
- `scans` table extended with `routine` (text), `preferences` (jsonb), `qwen_plan` (text). Migration: `supabase/migration_add_routine_prefs_qwen.sql`.

---

## 3. Milestones

### M1 — API Foundation (Aug 3–5)
Get both YouCam endpoints returning real data outside the app, before touching frontend integration.
- [ ] Confirm redeem code claimed, 1,000 free API units active
- [ ] Run Skin Analysis API via curl/Postman against 3–5 test photos, capture real response shape
- [ ] Run AI Skin Simulation API the same way — confirm what triggers a simulation (which concerns, what parameters) and confirm output is image-based
- [ ] Note every field name difference between the real response and the mock shape used in the prototype
- [ ] Budget API units: estimate calls-per-demo-run × number of test runs before deadline, stay under the 1,000-unit ceiling

**Exit condition:** both APIs return real results from a terminal, understood well enough to write backend code without guessing.

### M2 — Backend Proxy (Aug 5–8)
YouCam API keys can't live in client code. Minimal backend needed — not a full product backend, just an authenticated pass-through.
- [x] Next.js API route scaffolded: `/api/analyze` (structure in place, currently calls the mock function, not YouCam)
  - [x] New: `/api/simulate` route scaffolded (mirrors `/api/analyze` + `/api/recommend` server-side-key pattern; TimelineSlider now calls it, falling back to the local mock on failure). Currently returns mock numeric scores + `projectedImages: null` — same-file swap to YouCam once M1 confirms the real response shape.
- [x] Server-side key handling pattern established — `/api/recommend` already proves this out for the Anthropic key; the same pattern applies directly to `YOUCAM_API_KEY` when it's added
 - [x] `/api/analyze`: now calls the REAL YouCam Skin Analysis API via `lib/youcam.js` when `YOUCAM_API_KEY` is set (file upload → task → poll → map scores), falling back to the mock otherwise. Verify live response-shape mapping against the real API.
- [ ] `/api/simulate`: build from scratch — accepts baseline image + target concerns, returns the projected image(s) from YouCam
- [ ] Basic error handling: image too large, unsupported format, API quota exceeded — each needs a real user-facing message, not a stack trace (partially done in `/api/analyze` and `/api/recommend`; needs the same treatment once real YouCam calls are added)

**Exit condition:** frontend can call these two routes and get real YouCam data back, end to end.

### M3 — Real Integration (Aug 8–11)
Swap the mocks for the real thing.
- [ ] Replace `mockSkinAnalysis()` call site with `/api/analyze`
- [ ] Replace `mockSimulation()` call site with `/api/simulate`
- [ ] Rebuild the timeline slider around actual returned images instead of interpolated numbers — decide: does the API return one endpoint image, or multiple points along a timeline? This determines whether the slider shows a real scrub-through or a single generated before/after
- [ ] Keep the Claude-generated narrative layer as-is — it already works and reads well; feed it the real scores instead of mock ones
- [ ] Re-run the full flow against real photos, not test images from step M1, to catch UX gaps synthetic data hides

**Exit condition:** a stranger can upload a real selfie and get a real diagnosis, real ingredient logic, and a real (or at minimum, real-derived) projection — with zero mock functions left in the call path.

### M4 — Polish & Submission Assets (Aug 11–15)
This is where hackathons are actually won or lost — a working demo with weak packaging loses to a slightly-less-complete demo with strong packaging.
- [ ] Visual pass: confirm mobile responsiveness, since the video demo needs to show the product on its target device
- [ ] Screenshots captured at each major state (upload, analyzing, results, zone map hover, timeline scrub)
- [ ] Write the submission text description — explicitly name both YouCam APIs used and the consumer/retail value case, since judging criteria score this directly
- [ ] Record the 1–3 minute demo video: script it, since judges aren't required to watch past 3 minutes — the strongest material goes first
  - [ ] Confirm video explains which YouCam API is used (required)
  - [ ] Confirm footage shows the product running on its actual target device (required)
  - [ ] No third-party trademarks or unlicensed music (required — instant disqualifier if violated)
  - [ ] Upload to YouTube (preferred per rules), set public
- [ ] Push code repo public with setup instructions, or private + shared to `contact_event@PerfectCorp.com`

**Exit condition:** every item on Devpost's "What to Submit" checklist has a corresponding file, link, or asset ready to paste into the submission form.

### M5 — Buffer (Aug 15–17)
- [ ] Reserved for whatever M1–M4 revealed needs fixing — API rate limits under real load, a demo recording that needs a second take, a copy pass that reads awkward on rewatch
- [ ] Submit with at least 12 hours of margin before the 11:45 PM GMT+8 deadline — not because of specific risk, but because last-hour submission systems are the least tested path on any platform

---

## 4. Scope Boundaries

**In scope for this submission:**
- Skin AI track only — analysis, ingredient prescription, treatment projection
- Camera capture and file upload, both supported
- Supabase-backed accounts, persistent scan history, and week-over-week comparison — this expanded beyond the original MVP scope and is now a core, working part of the product, not a stretch goal

**Explicitly out of scope (do not build, even if time allows):**
- Apparel VTO integration — that's the combo-category idea from earlier discussion, deliberately deferred. Building it now risks finishing neither track solidly. Revisit only if M1–M4 finish with meaningful time still on the clock.
- Product affiliate links / e-commerce checkout — mentioned as a "premium version" idea earlier, not part of MVP
- Social/sharing login providers (Google, Apple) — email/password only for now; adding OAuth providers is a Supabase dashboard config change, not urgent before submission
- Multi-photo comparison in a single view (e.g. side-by-side grid of 3+ scans) — the current comparison is always one scan against one other; a richer multi-scan view is a post-submission enhancement

---

## 5. Risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| Skin Simulation API doesn't expose the exact control the product needs (e.g., can't target specific concerns, or only returns one fixed projection, not a scrubbable timeline) | The timeline slider is the product's signature feature — if the real API can't support it, the UI concept needs to change, not just the data source | Front-load M1 specifically to find this out early, while there's still time to redesign around real constraints |
| API unit budget (1,000 free units) runs out before the demo video is recorded | A dead API call during video recording forces a re-record under deadline pressure | Track usage from M1 onward; do exploratory calls sparingly once the shape is understood |
| Real skin photos produce awkward or sensitive-feeling AI commentary | The Claude-generated narrative currently reads well on mock data — real, unflattering skin conditions are a different test | Explicitly test M3 with a range of real photos, not just clean test images, and adjust the prompt's tone guardrails if needed |
| Supabase Row Level Security policy is misconfigured, and one user's scan history becomes readable by another user | This is a privacy failure, not just a bug — face photos and skin condition data are sensitive | Before demoing, manually test with two separate accounts: confirm Account B cannot see Account A's scans via the app, and ideally also confirm this directly in the Supabase Table Editor with RLS enabled |

---

## 6. Definition of Done

Submission is ready when:
1. Zero mock functions remain in the live call path (both YouCam endpoints are real)
2. The demo video shows the actual product, on its actual target device, doing the actual flow — not a slide deck describing it
3. Every required field on the Devpost submission form has content, not a placeholder
4. The submission text explicitly states which YouCam API(s) were used and the specific consumer/retail problem being solved — matching the language judges are scoring against
