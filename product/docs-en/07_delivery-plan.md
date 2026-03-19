# Delivery Plan — TactiTok

> **Version:** 0.1
> **Status:** Draft
> **Last updated:** 2026-03-07
> **Preceding document:** `product/06_api-contract.md`

---

## 1. Purpose of This Document

This document is the execution blueprint for the TactiTok MVP. It answers:

- How 12 weeks of work are organised across 3 student developers
- What gets built in what order, and why
- What the milestones and demo checkpoints are
- What the critical path and hard dependencies are
- When and how to use de-scope levers if time runs short
- What "done" looks like at each stage

This is the last document in the specification set. All prior documents (Product Brief → API Contract) feed into it. The architecture, data model, and API contract are fixed. This plan realises them.

---

## 2. Team & Roles

| Developer | Primary role | Secondary role |
|-----------|-------------|----------------|
| **Dev A** | Backend — API server, database, file handling, admin auth | Cloud deployment, nginx TLS config |
| **Dev B** | Edge SPA — reels feed, video player, offline, IndexedDB | Edge proxy Docker setup |
| **Dev C** | Admin SPA — upload form, content list, category/interest CRUD | Library view, PDF viewer |

**Shared responsibility:**
- `packages/shared` TypeScript types — owned by Dev A; reviewed by all
- Integration testing — all three; led by whoever is least blocked
- Demo content loading (15 items) — Dev C (week 11)
- Demo rehearsal — all three (week 12)

**Monorepo package ownership:**

| Package | Owner |
|---------|-------|
| `packages/server` | Dev A |
| `packages/shared` | Dev A |
| `packages/client` (Edge SPA) | Dev B |
| `packages/admin` (Admin SPA) | Dev C |
| `packages/edge-proxy` (Dockerfile + nginx.conf) | Dev B |

---

## 3. Timeline Overview

| Phase | Weeks | Goal |
|-------|-------|------|
| **Sprint 1** | 1–2 | Foundation: monorepo, schema, skeletons, Docker, cloud VM |
| **Sprint 2** | 3–4 | Content pipeline: upload → API → catalog sync → basic view |
| **Sprint 3** | 5–6 | Reels experience: TikTok feed, auto-play, swipe, interests |
| **Sprint 4** | 7–8 | Library + Downloads + offline: PDF viewer, downloads tab, offline mode |
| **Sprint 5** | 9–10 | Admin portal completion + full integration |
| **Sprint 6** | 11–12 | Stabilisation, demo content, rehearsal, bug fixes |

**Hard constraint:** All 12 acceptance criteria (MVP Spec §7) must pass by end of week 12.

---

## 4. Sprint Plans

### Sprint 1 — Foundation (Weeks 1–2)

**Goal:** Everyone has a working development environment. All three apps can be started. The database schema exists. The edge proxy runs locally.

#### Week 1

**Dev A — Backend foundation:**
- Set up monorepo (`pnpm workspaces`): `server`, `shared`, `client`, `admin`, `edge-proxy`
- Define and publish shared TypeScript types (`packages/shared/src/types.ts`) — `ContentItemDTO`, `CatalogResponse`, `CategoryDTO`, `InterestDTO`, `LoginRequest`, `LoginResponse`, `ApiError`
- Create PostgreSQL schema (migration 001): `content_items`, `categories`, `interests`, `content_categories`, `content_interests`
- Express server skeleton: routing structure, error handler, request logging
- Health check endpoint: `GET /api/health → 200 { status: 'ok' }`

**Dev B — Edge SPA skeleton:**
- HTML + TypeScript + Vite setup in `packages/client`
- Bottom tab bar with 3 tabs: Reels, Library, Downloads
- Placeholder screen for each tab
- Routing (History API — `window.history.pushState`; no routing library)
- Global CSS baseline: full-screen layout, tablet-optimised

**Dev C — Admin SPA skeleton + edge proxy:**
- HTML + TypeScript + Vite setup in `packages/admin`
- Login screen with password field (wired to nothing yet)
- Placeholder dashboard screen
- Dockerfile + `nginx.conf` for edge proxy (`packages/edge-proxy`):
  - Serve SPA static files from `/var/www/spa/`
  - Proxy `/api/*` to cloud server
  - Basic `proxy_cache` config
- Verify Docker container starts and serves a test HTML page on `localhost:8080`

#### Week 2

**Dev A:**
- Admin auth: `POST /api/admin/login` + `POST /api/admin/logout` with JWT
- Auth middleware for all `/api/admin/*` routes
- `POST /api/admin/content` (upload endpoint): Multer, MIME validation, filesystem store, DB insert
- `GET /api/admin/content` (list endpoint)

**Dev B:**
- Wire edge SPA to edge proxy: all API calls go to `localhost:8080`
- IndexedDB setup: `deviceProfile` store, `catalogCache` store, `downloads` store, `localActions` store
- DeviceProfile init: generate `deviceId` on first open
- Interest selection screen (UI only — no interests in DB yet; show placeholder)

**Dev C:**
- Wire Admin SPA login to `POST /api/admin/login`; store JWT in `sessionStorage`
- Admin dashboard: calls `GET /api/admin/content`; shows placeholder content list
- Category and interest admin screens (stubbed — CRUD logic in Sprint 5)

**Sprint 1 exit criteria:**
- [ ] `pnpm install && pnpm build` succeeds across all packages
- [ ] Cloud VM has PostgreSQL running; migration 001 applied
- [ ] `GET /api/health` returns 200
- [ ] Admin login returns a JWT token
- [ ] Edge proxy Docker container starts and proxies `GET /api/health` from cloud
- [ ] Admin SPA login screen reaches the server
- [ ] Edge SPA loads on Chrome via `localhost:8080`

---

### Sprint 2 — Content Pipeline (Weeks 3–4)

**Goal:** A file can be uploaded via the admin portal, appear in the catalog, and be streamed/downloaded on the edge device. This is the backbone all other features attach to.

#### Week 3

**Dev A:**
- `GET /api/catalog` — full catalog response (items + categories + interests) with proper serialisation
- `GET /api/content/:id/file` — stream file with range request support (`Accept-Ranges`, `Content-Range`, `206`)
- `GET /api/content/:id/thumbnail` — serve thumbnail (or 404)
- `PUT /api/admin/content/:id` — metadata update
- `DELETE /api/admin/content/:id` — hard delete (file + DB record)
- `GET /api/admin/content/:id` — single item

**Dev B:**
- Edge SPA catalog sync: `GET /api/catalog` → parse → write to IndexedDB `catalogCache`
- "Last synced" timestamp display
- Manual refresh button (triggers re-sync)
- Library view: flat list of all content items (categories not yet; just list)
- Basic content item card: title, type icon, file size

**Dev C:**
- Admin upload form: file picker, title, description, category selector (multi-select), interest selector (multi-select), upload button
- Upload progress bar (XMLHttpRequest `progress` event or Fetch + ReadableStream)
- Admin content list: sortable table (title, type, date, actions)
- Admin edit form (metadata update)
- Admin delete with confirmation dialog

#### Week 4

**Dev A:**
- `POST /api/admin/categories`, `PUT`, `DELETE` (full CRUD)
- `GET /api/admin/categories`
- `POST /api/admin/interests`, `PUT`, `DELETE` (full CRUD)
- `GET /api/admin/interests`
- `PUT /api/admin/content/:id/file` — file replacement, version increment
- `PUT /api/admin/content/:id/thumbnail` — thumbnail upload

**Dev B:**
- In-browser video player (HTML5 `<video>` element): play/pause, progress bar, mute
- Open video from library → player view
- PDF viewer: `fetch()` the PDF file → pass `ArrayBuffer` to `PDF.js`; page-by-page navigation
- Open PDF from library → PDF viewer

**Dev C:**
- Admin category CRUD UI: tree display, add top-level, add child, rename, delete
- Admin interest CRUD UI: list, add, rename, delete
- Admin thumbnail upload (separate button on edit form)
- Seed data script: 3 categories, 3 sub-categories, 3 interests (for development use)

**Sprint 2 exit criteria:**
- [ ] Upload a video via admin → appears in `GET /api/catalog`
- [ ] Upload a PDF via admin → appears in `GET /api/catalog`
- [ ] Edge SPA syncs catalog → items appear in library flat list
- [ ] Video file streams with range requests (206 response confirmed)
- [ ] PDF opens and renders in-browser from edge SPA
- [ ] Delete content in admin → removed from catalog on next sync
- [ ] Edge proxy caches content file (confirm `X-Cache-Status: HIT` on second request)

---

### Sprint 3 — Reels Experience (Weeks 5–6)

**Goal:** The TikTok-style feed is working on a tablet. Auto-play, swipe, prefetch, and interest filtering all work. This is the highest-risk capability — it must be prototyped and validated on the actual hardware by end of week 6.

#### Week 5

**Dev B (primary) + Dev C (support):**
- Full-screen vertical reels feed using CSS `scroll-snap`
- Video auto-play when scrolled into view (`IntersectionObserver`)
- Swipe up / swipe down gesture detection (native `touchstart`/`touchend` events; fallback: `wheel` event for desktop testing)
- First video: handle Chrome auto-play policy — use a "tap to start" overlay for the very first video; subsequent videos auto-play
- Video overlay UI: title, description (2-line truncated), Like button, Save button, Download button
- Like button: toggle `LocalAction` in IndexedDB; update icon state
- Save button: toggle `LocalAction` in IndexedDB; update icon state
- Loading/buffering indicator (show while video is loading; hide on `canplay` event)

**Dev A:**
- Investigate and confirm: `proxy_cache_valid 200 206 30d` correctly caches range request responses in nginx
- If range request caching is broken: implement workaround (pre-warm cache with a full GET before video loads; document in `notes/decisions.md`)

**Test on device at end of week 5:**
- Load edge proxy Docker on Linux VM; Chrome on Windows → `localhost:8080`
- Upload 1 test video, sync catalog, open reels feed
- Verify: auto-play works, swipe works, video is smooth

#### Week 6

**Dev B:**
- Video prefetch: when current video reaches 30% playback, issue a `Range: bytes=0-{N}` request for the next video in the feed. Store the partial response in memory. When user swipes, start `<video>` from the prefetched bytes.
- Interest-based feed filtering: read `DeviceProfile.selectedInterestIds` from IndexedDB → filter `CachedCatalog.items` where `interestIds` intersects
- Interest selection screen: shown on first open (when `DeviceProfile.selectedInterestIds` is empty); shows all interests as chip toggles; tapping "Start" saves and navigates to reels
- Access interests settings from profile/settings area (re-opens interest selection)
- Feed empty state: "No videos match your interests" message with link to settings
- Graceful network degradation: if video stalls, show buffering indicator; do not crash

**Dev C:**
- Library category tree: 2-level collapsible tree in the left panel / top section
- Tapping a category filters the content list
- Content type icon (video vs. PDF badge)
- Text search bar: filters `CachedCatalog.items` client-side on `title + description` as user types
- Empty state messages: "No items in this category" / "No results found"
- Download button on content item cards in library

**Sprint 3 exit criteria:**
- [ ] Reels feed scrolls smoothly on 10″ tablet (no jank; confirmed hands-on)
- [ ] First video starts within ≤ 2s on reasonable network
- [ ] Auto-play works after first user gesture
- [ ] Swipe up → next video; swipe down → previous video
- [ ] Interest selection: select 2 interests → feed shows only matching videos
- [ ] Library category tree: tap category → filtered list
- [ ] Text search: type term → filtered list within 1s
- [ ] Video prefetch: swipe to next video; playback starts faster than without prefetch (qualitative)

---

### Sprint 4 — Library, Downloads & Offline (Weeks 7–8)

**Goal:** Users can download videos and PDFs, view them offline, and manage their downloads. Offline mode works transparently.

#### Week 7

**Dev B:**
- Download flow: user taps Download → `fetch("/api/content/{id}/file")` from proxy → read response to completion (forces proxy to cache the full file) → write `DownloadRecord` to IndexedDB → update Downloads tab
- Download progress: track bytes received during fetch; update a progress bar in the download button
- Downloads tab: list all `DownloadRecord` entries from IndexedDB; show title, type, size, download date
- Play/view downloaded video: same `<video src="/api/content/{id}/file">` → proxy serves from cache (no special code path)
- Play/view downloaded PDF: same `fetch("/api/content/{id}/file")` → proxy serves from cache → PDF.js renders
- Delete downloaded item: remove `DownloadRecord` from IndexedDB; proxy cache may still hold file (inform user the proxy cache manages the file)

**Dev C:**
- "Updated" badge logic: on catalog sync, compare `DownloadRecord.version` with `CachedCatalog.items[].version`; if catalog version is higher, mark item in Downloads tab with "Updated" badge
- "Updated" badge in Library: if item has `updatedAt` newer than `CachedCatalog.lastSyncedAt` from the previous sync (approximate heuristic) — simpler alternative: show badge only on downloaded items where version mismatch is clear
- Download button state: if item is in `DownloadRecord` IndexedDB, show "Downloaded" icon; if not, show "Download" button

**Dev A:**
- Nginx edge proxy offline testing: simulate cloud unavailability (`iptables` or by stopping the cloud server); confirm:
  - Edge SPA loads (served from Docker image)
  - `GET /api/catalog` serves stale cache
  - `GET /api/content/:id/file` serves cached file
- Document any nginx config changes needed for stale serving in `packages/edge-proxy/nginx.conf`

#### Week 8

**Dev B:**
- Network status indicator: poll `GET /api/health` via edge proxy; if fails or returns stale-served response, show "Offline" indicator in header
- `X-Cache-Status: STALE` response header detection: if proxy returns stale catalog, show "Last synced {timestamp}" instead of "Synced now"
- Orphan cleanup on sync: after successful catalog sync, remove `DownloadRecord` and `LocalAction` entries for content IDs no longer in catalog
- Offline indicator in Reels view: if offline and video is not cached, show "Not available offline" message
- Downloads tab empty state: "No downloads yet — tap the download button on any video or document"

**Dev C:**
- PDF page navigation: previous/next buttons, page counter (e.g., "3 / 12")
- Standalone video player view (opened from library or downloads): full-screen player with back button; play/pause, progress bar, mute; download button
- Content detail view consistency: same player/viewer components used in reels, library, and downloads

**Dev A:**
- Load test: simulate 5 concurrent video stream requests to Node.js; confirm no bottleneck; if needed, switch to nginx `X-Accel-Redirect` for file serving
- Ensure `Accept-Ranges`, `Content-Length`, and `ETag` headers are correct for all content file responses

**Sprint 4 exit criteria:**
- [ ] Download a video → Download button shows "Downloaded" → item appears in Downloads tab
- [ ] Download a PDF → item appears in Downloads tab
- [ ] Disconnect network → Downloads tab fully functional
- [ ] Offline: play downloaded video → plays without network
- [ ] Offline: open downloaded PDF → renders without network
- [ ] Offline indicator appears in Reels and Library when network is disconnected
- [ ] "Updated" badge appears on a downloaded item after admin updates the content
- [ ] Delete downloaded item → removed from Downloads tab
- [ ] Orphan cleanup: delete content in admin → sync → item disappears from Downloads tab

---

### Sprint 5 — Admin Portal Completion + Integration (Weeks 9–10)

**Goal:** The admin portal is complete. All 21 API endpoints are wired end-to-end. The full demo flow (15 demo steps from MVP Spec §4) works end-to-end in a staging environment.

#### Week 9

**Dev A:**
- End-to-end integration pass: test all 21 API endpoints manually with a REST client (e.g., Insomnia / Bruno)
- Fix any validation gaps (MIME type + magic-byte check; file size enforcement; category depth enforcement)
- Video duration validation: parse MP4 duration using `ffprobe` or a JS library (`mp4-box` / `mp4-parser`); reject if > 180s
- Error response audit: confirm all error responses use the standard envelope `{ error, code }`
- Deployment: cloud VM is running, accessible via HTTPS; Let's Encrypt cert or self-signed

**Dev C:**
- Admin category CRUD: final polish — reorder via sort order input; clear UI for 2-level limit
- Admin interest CRUD: final polish
- Admin content list: sort by created date, title, type; filter by type (video/PDF)
- Upload form: final polish — client-side validation (file type, size) before submission; clear error messages
- Content update workflow: edit metadata + file replacement in admin

**Dev B:**
- Full demo script walkthrough (MVP Spec §4, all 15 steps) on the actual device in a lab environment with simulated connectivity
- Fix any UX issues found in the walkthrough
- Performance: measure video playback start time; tune prefetch timing if needed

#### Week 10

**All three developers — integration and cross-team testing:**
- Run the full demo script (15 steps) twice: once with network, once with network simulated as unstable
- Fix all blockers found during walkthrough
- Acceptance criteria matrix (MVP Spec §7, AC-1 through AC-12): document current status for each criterion
- Any failing acceptance criteria go into a prioritised bug list
- De-scope decisions: if any "Must" capability is not achievable by end of week 10, escalate and apply de-scope levers (see §8)

**Sprint 5 exit criteria:**
- [ ] All 21 API endpoints respond correctly (manual integration test)
- [ ] Full demo script runs end-to-end without errors on staging
- [ ] AC-1 through AC-12 documented; all "Must" criteria green
- [ ] Cloud VM is deployed and reachable via HTTPS
- [ ] Edge proxy Docker image builds and runs on edge device

---

### Sprint 6 — Stabilisation & Demo Preparation (Weeks 11–12)

**Goal:** The demo is polished, reliable, and ready. 15 demo items are loaded. All acceptance criteria pass. The team has rehearsed the demo at least twice.

#### Week 11

**Dev C:**
- Load all 15 demo items: 10 PDFs + 5 videos; assign categories and interests to each
- Verify each item appears correctly in catalog, library, and reels
- Verify thumbnails (upload or accept type-based placeholders)

**Dev B:**
- Performance tuning: video start time, scroll smoothness, swipe responsiveness
- Edge device setup: WSL2 or VirtualBox Linux VM; Docker installed; `tactitok-edge-proxy` container running with `docker restart always`
- Chrome kiosk mode setup on Windows: verify no OS-level pop-ups, browser controls hidden, navigation stays in-app

**Dev A:**
- Regression testing: run all 20 API endpoints after demo content is loaded
- Cloud VM stability: pm2 or systemd for Node.js; nginx TLS; PostgreSQL backup (manual dump)
- Fix any regressions from demo content loading

#### Week 12

**All three — demo preparation:**
- Demo rehearsal 1: full 15-step script, hands-on on tablet; all 3 developers as evaluators
- Bug list from rehearsal 1: fix all P1 issues
- Demo rehearsal 2: repeat with simulated evaluators; time each step; verify all acceptance criteria
- Buffer: 2 days for final fixes

**Sprint 6 exit criteria:**
- [ ] 15 demo items loaded and navigable (AC-10)
- [ ] All 12 acceptance criteria (AC-1 through AC-12) pass on the actual demo device
- [ ] Demo rehearsal completed twice with no blocking issues
- [ ] Chrome kiosk mode confirmed: zero external apps, pop-ups, or OS interactions (AC-11)
- [ ] Edge proxy Docker container restarts automatically after device reboot

---

## 5. Milestones & Demo Checkpoints

| Milestone | Week | What it proves |
|-----------|------|---------------|
| **M1: Everything starts** | End of week 2 | Monorepo builds; DB schema exists; all 3 apps start; edge proxy proxies successfully |
| **M2: Content pipeline works** | End of week 4 | Upload → catalog → stream/view on edge device; categories and interests exist |
| **M3: Reels works on device** | End of week 6 | TikTok-style feed validated hands-on on 10″ tablet; auto-play, swipe, interests confirmed |
| **M4: Full offline loop** | End of week 8 | Download video + PDF → disconnect network → play/view offline; "Updated" badge works |
| **M5: Demo script passes** | End of week 10 | All 15 demo steps run end-to-end; all AC pass or are escalated |
| **M6: Demo ready** | End of week 12 | 15 items loaded; rehearsed twice; all AC green; device is configured and stable |

**If M3 (reels on device) is not solid by end of week 6, trigger de-scope levers immediately — see §8.**

---

## 6. Dependency Map (Critical Path)

The following dependencies are hard: a downstream task cannot start until the upstream task is done.

```
shared/types.ts (Dev A, week 1)
    ├── packages/server routes depend on DTOs
    ├── packages/client API calls depend on DTOs
    └── packages/admin API calls depend on DTOs

PostgreSQL schema (Dev A, week 1)
    └── All server endpoints depend on schema

GET /api/catalog (Dev A, week 3)
    └── Edge SPA catalog sync (Dev B, week 3)
        ├── Library view filtering (Dev C, week 6)
        └── Interest-based feed filtering (Dev B, week 6)

GET /api/content/:id/file (Dev A, week 3)
    ├── Video player (Dev B, week 4)
    ├── PDF viewer (Dev B/C, week 4)
    ├── Download flow (Dev B, week 7)
    └── Reels prefetch (Dev B, week 6)

Edge proxy Docker running (Dev C → Dev B, week 1)
    └── All edge features depend on proxy being reachable

Offline proxy testing (Dev A, week 7)
    └── Offline playback confirmation (Dev B, week 8)
```

**Critical path (longest chain):**

```
Monorepo setup → shared types → schema → catalog endpoint → catalog sync
    → interest filtering → reels feed → reels on device test (M3, week 6)
```

**Reels validation at M3 is the highest-risk milestone.** If it fails, there is still 6 weeks to recover or de-scope.

---

## 7. Weekly Checkpoint Cadence

Each week ends with a short team sync (30 min):

| Check | Question |
|-------|---------|
| **Done** | What was delivered and tested this week? |
| **Blocked** | What is blocking progress? Can a teammate unblock it? |
| **Scope** | Is anything going slower than expected? Should a de-scope lever be pulled now? |
| **Next** | What is each person working on next week? |

Document decisions and de-scope changes in `notes/decisions.md`.

---

## 8. Risk Response Plan (De-scope Levers)

The following decision tree guides scope reduction. Pull levers in priority order. Do not wait until week 12 — if a sprint is running behind, pull levers at the end of that sprint.

### Trigger: Sprint is running > 2 days behind by week 5

Pull **Lever 1** (from MVP Spec §13, priority 1):
- Drop "Updated" badge (CAP-3.7): saves ~2–3 days
- Impact: users don't see a badge when content is updated; they still get the latest content after sync

### Trigger: Reels feed is not working on device by end of week 6 (M3 at risk)

Pull **Lever 2**:
- Drop Like/Save buttons (CAP-2.7, CAP-2.8): saves ~2–3 days
- Impact: no bookmarking; users rely on Downloads tab only

### Trigger: Any Sprint 4 feature is not working by end of week 8

Pull **Lever 3**:
- Drop Interest selection screen + feed filtering (CAP-1.4, CAP-1.5, CAP-2.5): saves ~4–5 days
- Impact: feed shows all videos; library shows all items; simpler but less "TikTok"

### Trigger: Admin portal is not complete by end of week 9

Pull **Lever 4**:
- Seed categories from DB migration; remove admin category CRUD (CAP-6.8): saves ~3–4 days
- Also pull **Lever 5**: seed interests from DB migration; remove admin interest CRUD (CAP-6.9): saves ~1–2 days

### Last resort: Total build is not converging by week 10

Pull **Lever 6** (major):
- Drop PDF support entirely (CAP-3.5, CAP-4.3, CAP-4.4, CAP-6.4): saves ~5–7 days
- Impact: major capability loss — demo shows video only; evaluate before pulling

**Never pull before confirming with the full team and the stakeholder.**

---

## 9. Acceptance Criteria Sign-off

The team must validate all 12 acceptance criteria from MVP Spec §7 on the actual demo device before demo day.

| # | Criterion | Validation method | Target |
|---|----------|------------------|--------|
| AC-1 | End-to-end demo flow completes (all 15 demo steps) | Manual demo walkthrough | All steps pass |
| AC-2 | Reels auto-play and swipe-to-advance work smoothly | Hands-on tablet test | No jank; swipe reliable |
| AC-3 | Video playback starts ≤ 2s on reasonable network | Stopwatch with simulated bandwidth | ≤ 2s |
| AC-4 | Library search returns results for known items | Manual test | Results within 5s |
| AC-5 | PDF renders correctly in-browser for 3+ test documents | Visual check | All pages render |
| AC-6 | Downloaded video plays offline with zero network | Airplane mode test | 100% functional |
| AC-7 | Downloaded PDF renders offline with zero network | Airplane mode test | 100% functional |
| AC-8 | Admin upload → edge visibility ≤ 30s after sync | Timed test | ≤ 30s |
| AC-9 | Interest selection filters reels feed correctly | Manual: select interest → verify feed | Correct filtering |
| AC-10 | 15 demo items (10 PDFs + 5 videos) loaded and navigable | Content check | All 15 accessible |
| AC-11 | All interaction inside Chrome — no pop-ups, no external apps | Visual check on kiosk device | Zero exceptions |
| AC-12 | App handles network drop gracefully — no crashes, clear messaging | Disconnect during active use | No crash; message shown |

---

## 10. Assumptions

| # | Assumption | Impact if wrong |
|---|-----------|----------------|
| PA1 | 3 developers are available full-time for 12 weeks | Reduce scope earlier; compress sprints |
| PA2 | Developers are comfortable with HTML + TypeScript + Node.js | Add 1–2 weeks for ramp-up; reduce scope |
| PA3 | Developers can set up WSL2 + Docker on the edge device Windows PCs without extended IT support | Add 3–5 days for device setup |
| PA4 | Cloud VM is provisioned and accessible by week 1 | Delay cloud deployment; use local development server as fallback |
| PA5 | Target 10″ tablet is available for testing by week 5 (M3) | Reels validation is delayed; risk to demo quality |
| PA6 | 15 demo content items (10 PDFs + 5 videos) are available for loading in week 11 | Delay M6; team must source or create demo content |
| PA7 | Chrome auto-play policy does not block auto-play after the first user gesture | Add tap-to-start fallback for every video; increases effort ~2 days |
| PA8 | nginx `proxy_cache` correctly caches range-request responses | Need a workaround (full-file pre-warm before play); adds ~2 days |

---

## 11. Risks

| # | Risk | Likelihood | Impact | Sprint when it surfaces | Mitigation |
|---|------|-----------|--------|------------------------|-----------|
| PR1 | TikTok-style reels is janky on tablet (scroll, auto-play, swipe) | Medium | High | Sprint 3 | Prototype in week 5; test on device; fallback to Swiper.js if CSS scroll-snap is insufficient |
| PR2 | Chrome auto-play policy blocks video playback in kiosk mode | Medium | High | Sprint 3 | Implement tap-to-start overlay for first video; subsequent videos rely on prior interaction |
| PR3 | nginx proxy_cache range-request caching broken | Medium | High | Sprint 4 | Test in sprint 3; if broken, pre-warm cache with full GET before video plays |
| PR4 | WSL2 / VirtualBox network port mapping is non-trivial | Medium | Medium | Sprint 1 | Test edge proxy → cloud connectivity in week 1; WSL2 maps ports automatically on most Windows versions |
| PR5 | Node.js bottleneck serving concurrent video streams | Low | Medium | Sprint 5 | Load test in week 9; switch to nginx X-Accel-Redirect if needed |
| PR6 | PDF.js fails on complex or large demo PDFs | Low | Medium | Sprint 2 | Test with representative PDFs in week 4; set guidance: PDF ≤ 20 pages, no complex embedded forms |
| PR7 | Demo content (15 items) is not ready by week 11 | Medium | Medium | Sprint 6 | Source placeholder content early; confirm availability in week 8 |
| PR8 | Build falls behind by > 1 sprint | Medium | High | Any | Apply de-scope levers in priority order (§8); review at each weekly checkpoint |
| PR9 | Cloud VM is not provisioned by week 1 | Low | Medium | Sprint 1 | Use a local development server (Node.js on localhost) until VM is available; no blocking |

---

## 12. Open Questions / Pending Decisions

| # | Question | Affects | Recommended default | Deadline |
|---|---------|---------|-------------------|----------|
| PQ1 | Is the target tablet available for hands-on testing by week 5? | Sprint 3, M3 | If not: use a Windows laptop with Chrome in a browser window at 1280×800 as a fallback; test on device before demo | Week 3 |
| PQ2 | Who provides the 15 demo content items (PDFs + videos)? | Sprint 6 | Team sources placeholder content (e.g., public domain training videos; generated PDFs) | Week 8 |
| PQ3 | Is the cloud VM provisioned and accessible? What are the specs? | Sprint 1 | Linux VM, 4+ GB RAM, 50+ GB disk, outbound HTTPS; team confirms in week 1 | Week 1 |
| PQ4 | Are the 3 developers available from day 1, or is there a ramp-up period? | Sprint 1 | All available from day 1; if not, adjust sprint 1 scope | Week 1 |
| PQ5 | Which Linux VM technology on the edge device: WSL2 or VirtualBox? | Edge proxy setup | WSL2 (recommended: automatic port forwarding on Windows 10/11); confirm on actual hardware | Week 1 |

---

## 13. De-scope Levers

Ordered by priority. Cut from the top. Do not skip ahead.

| Priority | Lever | Capabilities removed | Effort saved | When to pull |
|----------|-------|---------------------|-------------|-------------|
| 1st | Drop "Updated" badge | CAP-3.7 | ~2–3 days | Sprint 3 or 4 running late |
| 2nd | Drop Like/Save buttons | CAP-2.7, CAP-2.8 | ~2–3 days | Sprint 3 running late |
| 3rd | Drop interest selection + feed filtering | CAP-1.4, CAP-1.5, CAP-2.5 | ~4–5 days | M3 at risk or sprint 4 behind |
| 4th | Seed categories; drop admin category CRUD | CAP-6.8 | ~3–4 days | Sprint 5 behind |
| 5th | Seed interests; drop admin interest CRUD | CAP-6.9 | ~1–2 days | Sprint 5 behind |
| 6th | Drop PDF support; video-only MVP | CAP-3.5, CAP-4.3, CAP-4.4, CAP-6.4 | ~5–7 days | Sprint 5 or 6 severely behind |
| 7th | Drop Download / offline viewing | CAP-5.x | ~7–10 days | Last resort only |

---

## 14. Continuation Notes

Guidance for a follow-on team picking up after MVP:

- **Week 1 priority for the next team:** read all 7 spec documents in order; `notes/decisions.md` for all locked decisions; `notes/open-questions.md` for unresolved items.
- **Database migrations:** All schema changes must be versioned migration files (Prisma or Knex). The migration history from sprint 1 onward is the authoritative record of schema evolution.
- **Test coverage:** MVP has no automated tests. The next team should add unit tests for the service layer (CatalogService, ContentFileService, AuthService) and integration tests for the critical API endpoints before adding new features.
- **Monitoring:** Add structured server-side request logging (e.g., `pino`) and set up error alerting (e.g., Sentry) before going to production with real users.
- **User authentication:** The edge SPA has no user identity. When auth is added, `DeviceProfile.deviceId` becomes `userId`; the API adds auth middleware to content endpoints; LocalAction records gain a `synced` flag for batch upload.
- **Delta sync:** Replace `GET /api/catalog` full pull with a delta-based response using `?since={timestamp}`. Server returns only changed items and a `deleted` array. This is the highest-priority scalability improvement for catalog growth.
- **Adaptive streaming:** MP4 + range requests works for ≤ 3 min clips. For longer content or very variable bandwidth, add HLS segmentation using ffmpeg on upload and an HLS player (e.g., hls.js) on the client. The `<video>` element can be swapped without changing the rest of the architecture.
- **Edge proxy proactive prefetch:** Add a scheduled job inside the edge proxy (e.g., a cron inside the Docker container) that pulls all content from the cloud into cache on a schedule, rather than waiting for user access. This ensures all content is available offline even before the first user request.
- **Docker Compose:** When the edge device setup grows (e.g., multiple containers), replace bare `docker run` with a `docker-compose.yml`. The `packages/edge-proxy` package should include a `docker-compose.yml` template.

---

*This is the seventh and final document in the TactiTok specification set.*
*Document set: north-star → 01_product-brief → 02_system-boundaries → 03_mvp-spec → 04_system-architecture → 05_data-model → 06_api-contract → 07_delivery-plan*
