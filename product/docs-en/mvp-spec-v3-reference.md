# TactiTok — MVP Specification & Execution Plan

**DK-05 · Version 2.0 · March 2026**

---

| Parameter | Value |
|---|---|
| Developers | 3 |
| Sprints | 6 |
| Duration | 12 weeks |
| Acceptance Criteria | 12 (all must pass on the actual demo device) |
| Backend language | Python (FastAPI) |
| Frontend | Vanilla HTML + CSS + JavaScript (no framework) |
| Admin portal | Plain HTML + vanilla JS (static files served by the cloud FastAPI) |
| Edge server | nginx only — serves static files and proxies/caches cloud content |
| Database | PostgreSQL |

*This document summarises the full MVP execution plan — how 3 developers deliver the product in 12 weeks, what the milestones are, where the risks sit, and what the fallback options are if things go wrong.*

---

## 1. Overview

TactiTok is a TikTok-style training platform where employees scroll through short instructional videos on a tablet, browse a content library, and view materials even when their network connection is unreliable. Content is managed by an admin user through a simple web upload form and stored in the cloud. The edge device caches content locally so the experience stays smooth regardless of connectivity.

**MVP Goal**
- Demonstrate all three user flows in a single end-to-end demo
- Validate the experience on real tablet hardware
- Deliver a simple, maintainable foundation the team can keep building on

**Hard Constraints**
- All 12 acceptance criteria must pass on the actual demo device
- All interaction must stay inside Chrome — no pop-ups or external apps
- 15 demo items: 10 PDFs + 5 videos

### 1.1 The Three User Flows

| Flow | Name | Description |
|---|---|---|
| **Flow A** | Browse Reels | TikTok-style vertical video feed · auto-play · swipe to navigate · interest-based filtering · download for offline viewing |
| **Flow B** | Library Search | Category tree navigation · full-text search · in-browser video and PDF viewer · optional local download |
| **Flow C** | Admin Upload | Simple web form on Windows PC · upload MP4 or PDF with metadata · assign category and interests · edge device syncs within 30 s |

---

## 2. System Architecture

The system has three distinct components, each with a clear responsibility. They communicate over HTTP. No component is aware of the internal implementation of the others.

| Component | Runs On | Technology | Responsibility |
|---|---|---|---|
| **Cloud API** | Cloud VM (Linux) | FastAPI · PostgreSQL · file storage on disk | Stores all content and metadata. Serves catalog and files to the edge device. Receives uploads from the admin portal. |
| **Edge Client** | Linux VM (on-site) | nginx only | Serves the HTML, CSS, and JS files directly to Chrome on the tablet. Also proxies and caches videos and PDFs from the cloud API locally, so content plays even when the cloud is unreachable. |
| **Admin Portal** | Windows PC (admin browser) | Plain HTML + vanilla JS | A static HTML page served by the cloud FastAPI. Admin opens Chrome, fills in the upload form, submits directly to the API. No framework, no install required. |

### 2.1 How the Components Connect

The admin portal talks only to the Cloud API. The edge Linux VM polls the Cloud API periodically to sync the content catalog, and fetches files on demand through nginx — which caches them. The end user's tablet simply opens Chrome pointing at the edge VM; it never talks to the cloud directly.

**Data flow summary**
- Admin PC (Chrome) → Cloud API: submit upload form, manage content
- Edge VM (nginx) → Cloud API: sync catalog every N seconds, fetch files on first request
- Tablet (Chrome) → Edge VM: all video and PDF requests served locally from nginx cache
- Tablet → Cloud API: never (all traffic goes through the edge VM)

### 2.2 Why nginx on the Edge VM

The end users may have an unstable or slow connection to the cloud. nginx sits between the tablet and the cloud and acts as a caching proxy — the first time a video is requested, nginx fetches it from the cloud and stores a local copy. Every subsequent request for the same file is served instantly from that local copy, with no cloud dependency. If the cloud goes offline entirely, already-cached content remains available.

**Offline capability**
- First access: nginx fetches from cloud and caches locally
- Subsequent access: served from local cache — fast and reliable
- Cloud offline: cached files still served; only new content is unavailable
- User downloads a file: nginx cache is pre-warmed, guaranteeing offline availability

---

## 3. Technology Stack

The stack was chosen to minimise framework overhead and keep every layer readable to developers who are still building their foundations. No build tools, no transpilers, no frontend framework.

| Layer | Technology | Why |
|---|---|---|
| Backend API | Python · FastAPI | Team knows Python. FastAPI is straightforward, well-documented, and has automatic API docs built in. |
| Database | PostgreSQL | Reliable, widely supported. Stores content metadata (title, category, interests, file path, version). |
| Admin UI | Plain HTML + vanilla JS | A static HTML file served by the cloud FastAPI. The upload form posts directly to the API endpoint. No framework, no build step. |
| Edge server | nginx | Does two jobs: serves the static HTML/CSS/JS files to the tablet browser, and proxies and caches content files from the cloud API. No other software needed on the edge VM. |
| End user client | Vanilla HTML + CSS + JS | No framework, no build step. The reels feed, library, and download logic are plain JavaScript files served by nginx. Debuggable directly in Chrome DevTools. |
| File storage | Server disk (cloud VM) | Files stored directly on disk alongside the API server. Simple for the MVP; can be migrated to object storage later. |

**What this project does NOT use**
- No React, Vue, or any other JS framework — on either the edge client or the admin portal
- No npm, no package.json, no build step on the frontend
- No TypeScript — plain JavaScript only
- No server-side templating — HTML files are static
- When something breaks, F12 in Chrome shows the error directly

---

## 4. Timeline — 12 Weeks, 6 Sprints

Six two-week sprints. The single hardest constraint: all 12 acceptance criteria must pass on the actual demo device by end of week 12. The highest-risk milestone is M3 — validating the reels feed on real tablet hardware by end of week 6.

| Sprint | Weeks | Goal | Milestone |
|---|---|---|---|
| **Sprint 1** | 1–2 | Foundation: API skeleton, database schema, nginx running, static files served to Chrome | **M1 — Everything starts** |
| **Sprint 2** | 3–4 | Content pipeline: upload via admin form → API → catalog sync → viewable on edge device | **M2 — Content pipeline works** |
| **Sprint 3 ⚠** | 5–6 | Reels experience: TikTok feed, auto-play, swipe, interest filtering — on real tablet | **M3 — Reels on device ⚠ HIGHEST RISK** |
| **Sprint 4** | 7–8 | Library + Downloads + offline: PDF viewer, downloads list, offline mode confirmed | **M4 — Full offline loop** |
| **Sprint 5** | 9–10 | Admin portal completion + full end-to-end integration pass | **M5 — Demo script passes** |
| **Sprint 6** | 11–12 | Stabilisation, 15 demo items loaded, rehearsal, final bug fixes | **M6 — Demo ready** |

> **Hard Constraint:** All 12 acceptance criteria (AC-1 through AC-12) must pass on the actual demo device by end of week 12.

---

## 5. Sprint Details

### 5.1 Sprint 1 — Foundation (Weeks 1–2)

Goal: get all three pieces of the system running and talking to each other, however crudely. By end of week 2, the cloud API is reachable, the edge VM proxies successfully through nginx, and both the tablet and the admin PC can open their respective HTML pages in Chrome.

**Cloud API**
- FastAPI project set up with a virtual environment
- PostgreSQL database running on the cloud VM; schema created (content, categories, interests tables)
- `GET /health` endpoint returning 200
- Skeleton upload endpoint (accepts a file, saves it to disk, returns 200)
- Static file serving configured — the admin HTML page is accessible via the browser

**Edge VM**
- nginx installed and configured — serves a placeholder HTML file to Chrome on the tablet
- nginx also configured as a reverse proxy pointing at the cloud API
- Tablet opens Chrome at the edge VM address and sees the placeholder page
- nginx successfully proxies a request through to the cloud `GET /health`

**Admin Portal**
- A static HTML file with a basic upload form (file picker, title field, submit button)
- Served as a static file by the cloud FastAPI — admin opens it in Chrome on the Windows PC
- Form posts directly to the skeleton upload endpoint and shows a success or error message

**Sprint 1 Exit Criteria**
- `GET /health` on the cloud API returns 200
- Skeleton upload endpoint accepts a file and saves it to disk
- nginx on the edge VM proxies `GET /health` from the cloud successfully
- Tablet opens Chrome and sees an HTML page served from the edge VM
- Admin opens Chrome on the Windows PC and sees the upload form

> **Milestone M1 — End of Week 2:** All three components are running and reachable. The basic plumbing works.

---

### 5.2 Sprint 2 — Content Pipeline (Weeks 3–4)

Goal: a file uploaded through the admin form must appear in the catalog and be playable on the edge device. This is the core data pipeline that everything else builds on. Range request support for video must be confirmed here — it is required for the nginx cache and for smooth video playback.

**Cloud API**
- `GET /catalog` — returns list of all published content (title, type, category, interests, version, file URL)
- `GET /content/{id}/file` — serves the file with range request support (HTTP 206)
- `POST /content` — full upload endpoint (file + metadata)
- `PUT/DELETE /content/{id}` — edit and delete
- CRUD endpoints for categories and interests
- Thumbnail generation or URL for video files

**Edge Client (Vanilla JS)**
- JavaScript fetches `GET /catalog` through nginx on page load
- Stores catalog in memory (simple JS array)
- Renders a flat list of content cards in the library view
- Clicking a video card opens an HTML5 `<video>` player
- Clicking a PDF card opens the file in-browser via PDF.js
- Manual refresh button re-fetches the catalog

**Admin Portal (HTML + vanilla JS)**
- Upload form: file picker, title, description, category selector, interest checkboxes, progress bar
- On submit: JS sends a multipart POST to the cloud API upload endpoint
- Content list page: fetches `GET /catalog` and renders a table of uploaded items
- Delete button: sends `DELETE /content/{id}` and removes the row from the table
- Edit form: fetches item metadata, renders a pre-filled form, submits a PUT request
- Category and interest management pages

**Sprint 2 Exit Criteria**
- Upload a video via admin form → appears in `GET /catalog` response
- Upload a PDF via admin form → appears in `GET /catalog` response
- Edge client fetches catalog → items appear in the library list on the tablet
- Video streams with range requests (HTTP 206 response confirmed in browser DevTools)
- PDF opens and renders in-browser on the tablet
- Delete an item in admin → removed from catalog on next sync
- nginx caches a content file (second request is served from cache)

> **Milestone M2 — End of Week 4:** Upload → catalog → stream or view on the tablet. The content pipeline works end-to-end.

---

### 5.3 Sprint 3 — Reels Experience (Weeks 5–6) ⚠ HIGHEST-RISK SPRINT

The TikTok-style feed is the differentiating feature of the product. It is also the most technically demanding part of the client, because several browser behaviours must work together correctly on real tablet hardware: CSS scroll-snap for snapping between videos, IntersectionObserver for detecting which video is on screen, Chrome's auto-play policy requiring a prior user gesture, and touch gesture handling for swipe navigation. All of this is vanilla JavaScript — but it must be tested on the actual device, not just on a development laptop.

> ⚠ **Why this is the highest-risk sprint:** CSS scroll-snap + IntersectionObserver + touch gestures + Chrome auto-play policy must all work together on the real tablet. These interactions are easy to get wrong on specific hardware or browser versions. Must be validated hands-on by end of week 6. If M3 is at risk → pull de-scope levers immediately. Six weeks remain.

**Reels Feed (Vanilla JS + CSS)**
- Full-screen vertical layout with `scroll-snap-type: y mandatory`
- Each video is a `<video>` element sized to 100vh
- IntersectionObserver (threshold 0.7) pauses all videos and plays the one entering view
- Tap-to-start overlay on first load to satisfy Chrome's auto-play policy
- Swipe up/down handled natively by CSS scroll-snap (no extra JS needed for basic swipe)
- Overlay UI per video: title, Like button, Save button, Download button
- Video prefetch: when a video reaches 30% playback, preload the next video's src
- Interest selection screen: checkboxes stored in localStorage, filters which videos appear
- Feed empty state message when no videos match selected interests

**Library View**
- Category tree: two-level collapsible list built from the catalog data
- Content type badges (VIDEO / PDF) on each card
- Text search bar: filters the in-memory catalog array as the user types
- Download button on each card
- Empty state message when search returns no results

**Sprint 3 Exit Criteria**
- Reels feed scrolls smoothly on the 10" tablet — no jank; confirmed hands-on
- First video starts within ≤ 2 s on a reasonable network connection
- Auto-play works after the first user tap (Chrome auto-play policy satisfied)
- Swipe up → next video snaps into view; swipe down → previous video
- Interest selection: choose 2 interests → feed shows only matching videos
- Library category tree: tap a category → list filters to that category
- Text search: type a term → list filters within 1 s (client-side, no server round-trip)
- Video prefetch: swiping to the next video starts noticeably faster after prefetch

> **Milestone M3 — End of Week 6 (CRITICAL):** TikTok-style feed validated hands-on on the 10" tablet. Auto-play, swipe, and interest filtering all confirmed working. If M3 is at risk → pull de-scope levers immediately.

---

### 5.4 Sprint 4 — Downloads & Offline (Weeks 7–8)

Sprint 4 closes the offline loop. When a user explicitly downloads a file, the client forces nginx to cache a full copy by fetching the entire file. After that, playback goes through nginx regardless of whether the cloud is reachable. The offline test is simple and concrete: stop the cloud server, confirm the tablet can still play downloaded content.

**Download Flow (Vanilla JS)**
- Download button triggers a full fetch of the file URL (forces nginx to cache it)
- On completion, store a DownloadRecord in IndexedDB: `{ id, title, type, version, cachedUrl }`
- Download progress shown via a progress bar (fetch with ReadableStream)
- Downloads tab: list of all DownloadRecords — title, type, file size, date downloaded
- Play or view a downloaded item: loads from the nginx-cached URL
- Delete a downloaded item: removes DownloadRecord from IndexedDB

**Offline & Sync**
- Network status indicator: polls `GET /health` every 30 s; shows online/offline banner
- Offline messaging in Reels and Library when cloud is unreachable
- "Updated" badge: compare DownloadRecord.version with catalog version; show badge if stale
- Orphan cleanup: if a downloaded item is deleted from the catalog, remove it from IndexedDB on next sync
- PDF page navigation: previous/next buttons, page counter (using PDF.js page API)

**nginx Offline Validation**
- Stop the cloud server entirely
- Confirm: the edge HTML/JS/CSS files still load (served by nginx from disk)
- Confirm: catalog is served stale from nginx cache
- Confirm: previously cached video and PDF files are served from nginx cache
- Document the nginx stale-cache configuration (`proxy_cache_use_stale` directives)
- Load test: 5 concurrent video streams — switch to nginx X-Accel-Redirect if needed

**Sprint 4 Exit Criteria**
- Download a video → progress bar completes → appears in Downloads tab
- Download a PDF → appears in Downloads tab
- Disconnect network → Downloads tab is fully usable
- Offline: tap a downloaded video → plays without any network connection
- Offline: tap a downloaded PDF → renders without any network connection
- Offline banner appears in Reels and Library views when disconnected
- "Updated" badge appears when admin updates a file the user has downloaded
- Delete a downloaded item → removed from the Downloads tab and IndexedDB

> **Milestone M4 — End of Week 8:** Download a video and a PDF, disconnect from the network, play and view both offline. It works.

---

### 5.5 Sprint 5 — Admin Portal Completion + Integration (Weeks 9–10)

Sprint 5 is the integration sprint. The goal is a full end-to-end run of the 15-step demo script without errors, in a staging environment that mirrors the demo setup. Any acceptance criterion that is failing by end of week 10 is escalated immediately — there is no time to leave problems for Sprint 6.

**Cloud API — Integration Pass**
- Test all API endpoints end-to-end
- Fix any validation gaps: MIME type checking, file size limits, category depth enforcement
- Video duration validation (reject files longer than 180 s)
- Consistent error responses across all endpoints
- Cloud VM reachable via HTTPS with a valid certificate

**Admin Portal — Final Polish**
- Category management: reorder categories, enforce 2-level maximum in the UI
- Interest management: add, edit, delete interests
- Content list: filter by type (video / PDF), sort by date
- Upload form: clear validation messages, show progress bar, confirm success or failure
- Content update workflow: replace a file and increment version

**Full Demo Walkthrough**
- Run the complete 15-step demo script on the actual tablet
- Fix any UX issues found during the walkthrough
- Measure video playback start time with a stopwatch
- Run the demo a second time with simulated poor connectivity
- Document which acceptance criteria pass and which are still at risk

**Sprint 5 Exit Criteria**
- All API endpoints respond correctly (tested manually)
- Full 15-step demo script runs end-to-end without errors on staging
- All 12 acceptance criteria are documented as passing or escalated to the stakeholder
- Cloud VM is reachable via HTTPS
- Edge VM nginx is running, serving files, and proxying to the cloud correctly

> **Milestone M5 — End of Week 10:** All 15 demo steps run end-to-end. Every acceptance criterion is either green or escalated.

---

### 5.6 Sprint 6 — Stabilisation & Demo Preparation (Weeks 11–12)

Sprint 6 is about making the demo airtight. Load the real demo content, rehearse twice, fix anything that breaks. Two days of buffer are reserved at the end of week 12 for last-minute fixes before demo day.

**Demo Content Loading (Week 11)**
- Load all 15 demo items: 10 PDFs + 5 videos
- Assign each item to the correct category and interests
- Verify every item appears correctly in the catalog, library view, and reels feed
- Verify thumbnails display correctly for all items

**Device Setup (Week 11)**
- Performance tuning: measure and optimise video start time, scroll smoothness, swipe responsiveness
- Configure Chrome to launch in kiosk mode: no address bar, no OS interactions, navigation stays in-app
- Confirm edge VM nginx restarts automatically after a device reboot
- Pre-warm the nginx cache: download all 15 items so they are available offline

**Regression & Stability (Week 11)**
- Re-run all API endpoint tests after demo content is loaded
- Confirm cloud VM stability: FastAPI process managed by systemd, nginx TLS configured, database backed up
- Fix any regressions found

**Sprint 6 Exit Criteria**
- 15 demo items loaded and navigable across all three views (AC-10)
- All 12 acceptance criteria pass on the actual demo device
- Demo rehearsal completed twice with no blocking issues found
- Chrome kiosk mode confirmed: no external apps, pop-ups, or OS interactions visible (AC-11)
- Edge VM restarts and all services come back up automatically

> **Milestone M6 — End of Week 12 — DEMO READY:** 15 items loaded · rehearsed twice · all 12 AC green · device stable. Demo ready.

---

## 6. Milestones

Six milestones, one per sprint. Each one proves something concrete about the system. Missing a milestone is a signal to act — not to wait and see.

| Milestone | Week | What It Proves |
|---|---|---|
| **M1: Everything starts** | End of 2 | All three components are running and reachable. nginx proxies successfully to the cloud API. |
| **M2: Content pipeline works** | End of 4 | Upload → catalog → stream or view on the tablet. Categories and interests exist. |
| **M3: Reels on device ⚠** | End of 6 | TikTok-style feed validated hands-on on the 10" tablet. Auto-play, swipe, and interest filtering confirmed. HIGHEST-RISK MILESTONE. |
| **M4: Full offline loop** | End of 8 | Download a video and PDF, disconnect from the network, play and view both offline. |
| **M5: Demo script passes** | End of 10 | All 15 demo steps run end-to-end. All AC green or escalated. |
| **M6: Demo ready** | End of 12 | 15 items loaded · rehearsed twice · all 12 AC green · device stable. |

> If M3 is not solid by end of week 6: pull de-scope levers immediately. Six weeks remain. Do not wait.

---

## 7. Critical Path & Dependencies

The longest dependency chain ends at M3. Every step in the chain must complete before the next can start. A delay anywhere in this chain delays the reels feed validation, which is the hardest milestone to recover from.

**Critical Path (longest chain → M3)**
```
PostgreSQL schema + FastAPI skeleton (week 1)
  ↓  GET /catalog endpoint live (week 3)
  ↓  Edge client fetches and displays catalog (week 3)
  ↓  Interest-based feed filtering working in JS (week 6)
  ↓  ⚠ Reels feed validated on tablet — M3 (end of week 6)
```

### 7.1 Other Hard Dependencies

| Dependency | Detail |
|---|---|
| **nginx running → all edge features** | nginx must be configured and proxying before any edge client work can be tested on the tablet. This is a week 1 deliverable and blocks everything else on the edge. |
| **File endpoint with range support → video player, downloads, prefetch** | `GET /content/{id}/file` with HTTP 206 range support (week 3) is required for the HTML5 video player, the nginx cache to work correctly, and the download flow in Sprint 4. |
| **nginx offline test → offline playback confirmation** | The nginx stale-cache configuration must be tested and documented in Sprint 4 (week 7) before offline playback can be confirmed as working. |

> **Watch Signal:** If the database schema or `GET /catalog` slip past day 3 of weeks 1 or 3 respectively — escalate immediately. They are on the critical path to M3.

---

## 8. Acceptance Criteria — Definition of Done

These 12 criteria define what "done" means for the MVP. Every criterion must be validated on the actual demo device. Validation methods are intentionally simple: manual walkthrough, stopwatch, visual check, or airplane mode test. The results are binary — it either works or it does not.

| # | Criterion | Validation Method | Target |
|---|---|---|---|
| **AC-1** | End-to-end demo flow completes (all 15 demo steps) | Manual demo walkthrough | All steps pass |
| **AC-2** | Reels auto-play and swipe-to-advance work smoothly on the tablet | Hands-on tablet test | No jank; swipe reliable |
| **AC-3** | Video playback starts within ≤ 2 s on a reasonable network | Stopwatch test | ≤ 2 s |
| **AC-4** | Library search returns results for known items | Manual test | Results within 5 s |
| **AC-5** | PDF renders correctly in-browser for 3 or more test documents | Visual check | All pages render correctly |
| **AC-6** | Downloaded video plays offline with zero network connection | Airplane mode test | Plays fully |
| **AC-7** | Downloaded PDF renders offline with zero network connection | Airplane mode test | Renders fully |
| **AC-8** | Admin upload → content visible on edge device within 30 s of sync | Timed test | ≤ 30 s |
| **AC-9** | Interest selection filters the reels feed correctly | Select interests → verify feed | Correct filtering |
| **AC-10** | 15 demo items (10 PDFs + 5 videos) are loaded and navigable | Content check across all views | All 15 accessible |
| **AC-11** | All interaction stays inside Chrome — no pop-ups or external apps | Visual check on kiosk device | Zero exceptions |
| **AC-12** | App handles a network drop gracefully — no crash, clear message shown | Disconnect cable during active use | No crash; message displayed |

---

## 9. De-scope Levers

De-scope levers are pre-approved scope reductions the team can pull when a sprint is running late. Work through them in order — do not skip ahead. The first three levers together save up to 10 days while keeping the core demo intact.

| Priority | What to Drop | Effort Saved | When to Pull |
|---|---|---|---|
| **1st** | Drop the "Updated" badge on downloaded items | ~2–3 days | Sprint 3 or 4 running late |
| **2nd** | Drop Like and Save buttons from the reels overlay | ~2–3 days | Sprint 3 running late |
| **3rd** | Drop interest selection and feed filtering entirely | ~4–5 days | M3 at risk or Sprint 4 behind |
| **4th** | Seed categories as static data; drop admin category editing | ~3–4 days | Sprint 5 behind |
| **5th** | Seed interests as static data; drop admin interest editing | ~1–2 days | Sprint 5 behind |
| **6th** | Drop PDF support entirely — video-only MVP | ~5–7 days | Sprint 5 or 6 severely behind |
| **7th (last resort)** | Drop downloads and offline viewing | ~7–10 days | Last resort only |

> **De-scope Rule:** Cut from the top. Do not skip ahead. Do not pull any lever without confirming with the full team and the stakeholder.

---

## 10. Risk Register

The five highest-impact risks across the project, with their mitigations. The first two both threaten M3 and should be prototyped early in Sprint 3.

| # | Risk | Likelihood | Impact | Sprint | Mitigation |
|---|---|---|---|---|---|
| **PR1 ⚠** | Reels feed is janky on the tablet (scroll, auto-play, swipe don't feel smooth) | Medium | High | 3 | Build a prototype of the scroll-snap feed in week 5 and test it on the actual device before building the rest of the sprint. Fallback: use Swiper.js if native CSS scroll-snap is insufficient. |
| **PR2 ⚠** | Chrome auto-play policy blocks video playback in kiosk mode | Medium | High | 3 | Implement a tap-to-start overlay on first load. After the first user gesture, IntersectionObserver auto-play works normally. |
| **PR3** | nginx proxy cache does not handle HTTP range requests correctly for video | Medium | High | 4 | Test range request caching in Sprint 3 before the download flow depends on it. If broken: pre-warm the cache with a full GET request before the video player tries to seek. |
| **PR4** | Edge VM network configuration (port forwarding, DNS) is harder than expected | Medium | Medium | 1 | Test the full network path (tablet → edge VM → cloud) in week 1. Resolve any port or firewall issues before Sprint 2 work depends on it. |
| **PR5** | Build falls more than one sprint behind schedule | Medium | High | Any | Review progress every Friday (Done / Blocked / Scope / Next). Apply de-scope levers in order if behind. Do not wait until week 12. |

> **Weekly Checkpoint Cadence:** Every Friday: Done / Blocked / Scope / Next. Document all de-scope decisions in `notes/decisions.md` as they are made.

---

## 11. Post-MVP Roadmap

The MVP is built to be extended. None of the post-MVP features require rewriting the core architecture — they slot in on top of what is already there.

| # | Feature | Priority | Detail |
|---|---|---|---|
| **1** | Delta sync | High | Replace the full catalog pull with a delta response: `GET /catalog?since={timestamp}` returns only changed or deleted items. Essential as the catalog grows beyond a few dozen items. |
| **2** | User authentication | Medium | The edge client currently has no user identity. Add a login screen and a session token. The DownloadRecord in IndexedDB already has an id field that can become a userId. |
| **3** | HLS adaptive streaming | Medium | MP4 with range requests works well for clips under 3 minutes. For longer content or variable bandwidth: transcode uploads to HLS with ffmpeg, and swap the `<video>` src for an HLS manifest. The rest of the client stays the same. |
| **4** | Proactive cache warm | Medium | Add a scheduled job on the edge VM that pulls all catalog files into the nginx cache on a timer, rather than waiting for a user to request them. Guarantees offline availability before the first access. |
| **5** | Automated tests | Medium | The MVP has no automated tests. Before adding new features, add pytest tests for the FastAPI endpoints and a simple integration test that uploads a file and verifies it appears in the catalog. |
| **6** | Monitoring | Medium | Add structured request logging (Python logging / structlog) and an error alerting service before going to production with real users. |

---

## 12. Summary

| Key Point | Detail |
|---|---|
| **Stack** | FastAPI + PostgreSQL (cloud) · nginx only (edge) · plain HTML + vanilla JS (admin + end user client) |
| **3 developers · 6 sprints · 12 weeks · 12 AC** | All 12 acceptance criteria must pass on the actual demo device. |
| **M3 (week 6) is the highest-risk milestone** | Reels feed must be validated hands-on. If it slips, pull de-scope levers immediately. |
| **7 de-scope levers in priority order** | First three save up to 10 days without losing core demo viability. |
| **Continuation-ready** | Delta sync, user auth, HLS, and proactive cache warm are the next-phase priorities. |

---

*DK-05 · Version 2.0 · March 2026*
