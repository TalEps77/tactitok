# Product Brief — TactiTok

> **Version:** 0.1
> **Status:** Draft
> **Last updated:** 2026-03-06
> **Preceding document:** `product/north-star.md` (binding source of truth)
> **Next document:** `product/02_system-boundaries.md`

---

## 1. Purpose of This Document

This Product Brief anchors all downstream engineering and design decisions for the TactiTok MVP. It defines:

- what problem TactiTok solves
- for whom
- in what operational context
- what value it delivers in MVP form
- what the core user flows are
- what is in scope and out of scope
- how success is judged in demo terms

Every subsequent document (System Boundaries → MVP Spec → Architecture → Data Model → API Contract → Delivery Plan) must be consistent with this brief. If a conflict arises, this brief governs unless the North Star overrides it.

---

## 2. Product Summary

TactiTok is a browser-based learning platform that delivers short training videos and PDF documents to edge devices (10″ tablets) in environments with unstable connectivity.

- **Consumption side:** A "TikTok-like" reels feed + an organized content library, running in Chrome on a kiosk tablet.
- **Management side:** A web-based admin portal where a centralized HQ training team uploads and catalogs content.
- **Offline support:** Hybrid — metadata syncs when network is available; content is fetched on demand with an option to download for offline use.

---

## 3. Problem Statement

- There is no centralized, convenient way to deliver up-to-date training content to personnel at the edge during operations.
- Training today relies on face-to-face sessions and ad-hoc file sharing (PDFs in unsuitable channels); updates don't arrive in time or aren't consumed.
- Under limited bandwidth and a kiosk-like setup, consuming video and documents is cumbersome and inconsistent.
- There is no way to "pull" learning naturally during short rest breaks — no experience that mirrors habitual short-form content consumption.

---

## 4. Target Users

### 4.1 Primary — Edge Consumer (Fighter)

- **Who:** Individual fighter at the edge, operating in the field.
- **Device:** ~10″ tablet, Windows host running Chrome in kiosk mode.
- **When:** During short rest breaks between operational activities.
- **Goal:** Learn or refresh knowledge quickly without searching through files or waiting for trainers.
- **Behavior model:** Passive "scrolling" (reels) or active search (library) depending on intent.
- **Identity:** No login. A local device profile stores selected interests.

### 4.2 Secondary — Content Manager (HQ Training Staff)

- **Who:** Centralized HQ training team — dedicated staff, not field personnel.
- **Device:** Standard desktop/laptop, modern browser.
- **When:** During working hours, when new or updated training material is ready.
- **Goal:** Upload, organize, and publish content so it appears quickly on edge devices.
- **Identity:** MVP — simple admin password protecting the portal. No RBAC.

---

## 5. Operational Context

| Dimension | Detail |
|-----------|--------|
| **Edge runtime** | Windows host → Linux VM → Chrome browser (kiosk mode) |
| **Screen** | ~10″ tablet; sometimes projected for a small team |
| **Network** | Unstable / limited bandwidth; may drop entirely |
| **Connectivity model** | Hybrid: metadata syncs when online; content fetched on demand; manual download for offline |
| **Server** | Reachable by edge devices at least intermittently (same network segment or VPN) |
| **Content sensitivity** | Assume sensitive — store locally only what is explicitly downloaded; minimize telemetry |
| **Demo environment** | Lab with simulated conditions; evaluators interact hands-on with a real tablet |
| **Concurrent edge devices** | ~20 for MVP; architecture should allow scale-up |
| **Language** | Single language in MVP; architecture must not block RTL/LTR addition later |

---

## 6. Value Proposition

1. **Immediate access to current content** — short videos (≤3 min) and PDFs available without waiting for a trainer or searching through file shares.
2. **Habitual consumption model** — a "TikTok-like" feed that makes learning feel natural during rest breaks, reducing the friction of intentional study.
3. **Organized knowledge base** — a searchable library with a category tree for targeted lookup ("I have a question about X").
4. **Resilient under poor connectivity** — smart prefetch for video start, on-demand streaming for the rest, and manual download for fully offline use.
5. **Continuation-ready codebase** — clean layered architecture that a follow-on team can extend without major rewrites.

---

## 7. Key Terms

| Term | Definition |
|------|-----------|
| **Edge device** | The 10″ tablet (Windows + Chrome kiosk) used by fighters in the field |
| **Reels feed** | A vertical-scroll feed of short training videos, inspired by TikTok/Instagram Reels |
| **Library** | A browseable, searchable catalog of all content (video + PDF), organized by category tree |
| **Content item** | A single uploadable unit: either a video (≤3 min) or a PDF (any page count) |
| **Interest** | A tag selected on the device profile that filters the reels feed and library; managed by HQ staff in the admin portal |
| **Category** | A node in a hierarchical tree used to organize content in the library; managed by HQ staff |
| **Device profile** | A local-only configuration on the edge device storing selected interests; no user identity |
| **Admin portal** | The server-side web UI used by HQ training staff to upload, organize, and publish content |
| **Metadata sync** | The process by which the edge device pulls the latest content catalog (titles, categories, tags) when network is available |
| **Content fetch** | On-demand retrieval of the actual media file (video stream or PDF) when a user opens an item |
| **Download** | Explicit user action to save a content item locally for offline access |

---

## 8. Core Flows

### Flow A — Browse Reels (Edge Consumer)

| Step | Detail |
|------|--------|
| **Trigger** | Rest time; user wants to scroll short content |
| **1** | Open app → land on reels feed (filtered by device profile interests, or default "all") |
| **2** | Swipe/scroll through short videos (≤3 min each) |
| **3** | Playback: prefetch first seconds → stream remainder; buffer indicator if network is slow |
| **4** | Optional: tap "Save" to bookmark locally; tap "Like" (stored locally in MVP) |
| **5** | Optional: tap "Download" to save video for offline viewing |
| **Outcome** | Smooth viewing of short, relevant training videos; saved/downloaded items accessible later |

### Flow B — Find Content in Library (Edge Consumer)

| Step | Detail |
|------|--------|
| **Trigger** | User has a specific question or needs guidance on a topic |
| **1** | Navigate to Library view |
| **2** | Browse category tree or use text search |
| **3** | Open a content item (video or PDF) |
| **4** | Video: plays in-browser; PDF: renders in-browser (page-by-page) |
| **5** | Optional: tap "Download" for offline access |
| **Outcome** | User finds relevant material within 30–60 seconds and consumes it in-browser |

### Flow C — Content Upload & Catalog Admin (HQ Staff)

| Step | Detail |
|------|--------|
| **Trigger** | New or updated training material is ready to publish |
| **1** | Log in to admin portal (simple password) |
| **2** | Upload video or PDF + fill metadata (title, description, categories, interests/tags, version date) |
| **3** | If updating existing content: upload replaces previous version; edge devices see "updated" badge |
| **4** | Manage category tree (create / rename / reorder / delete categories) |
| **5** | Publish → content appears in catalog; edge devices receive updated metadata on next sync |
| **Outcome** | Content is cataloged and available at the edge promptly |

### Flow D — Offline Access (Edge Consumer)

| Step | Detail |
|------|--------|
| **Trigger** | User wants to view content without network, or network drops |
| **1** | Open "Downloads" section |
| **2** | Browse previously downloaded items (video + PDF) |
| **3** | Open and consume content fully offline |
| **4** | Optional: delete downloaded items to free space |
| **Outcome** | Reliable content access regardless of connectivity |

---

## 9. In Scope (MVP)

1. **Edge web app** running in Chrome kiosk mode on a 10″ tablet.
2. **Reels feed** — vertical-scroll short-video feed with interest-based filtering.
3. **Library view** — category tree + text search across all content types.
4. **Content types:** short video (≤3 min) and PDF (any page count).
5. **In-browser playback** — video player + PDF viewer, no external apps.
6. **Video prefetch** — buffer the first few seconds for fast start; stream the rest.
7. **Manual download** — user-initiated download of video/PDF for offline use (file cached by edge proxy; metadata record stored in IndexedDB).
8. **Downloads management** — list of downloaded items (from IndexedDB records) with delete option; no storage quota in MVP.
9. **Device profile** — local interest selection that persists across sessions (no login).
10. **Like/Save** — local-only in MVP (stored on device; no server reporting).
11. **Content "updated" indicator** — badge on downloaded items when the server has a newer version (compare download version with catalog version on sync).
12. **Admin portal** — web UI for HQ staff to upload, organize, and publish content.
13. **Category tree CRUD** — create, rename, reorder, delete categories in admin portal.
14. **Interest/tag management** — HQ staff defines the interest list in admin portal.
15. **Metadata sync** — edge device pulls latest catalog on app open / periodic interval.
16. **Single-language UI** — one language for MVP; architecture supports adding more later.
17. **Demo corpus** — 10 PDFs + 5 videos preloaded for demo.

---

## 10. Out of Scope (MVP)

1. Advanced recommendation / personalization engine.
2. Analytics dashboards, usage monitoring, or reporting.
3. User authentication, identity management, or RBAC (beyond admin portal password).
4. Social features: chat, comments, sharing, reactions beyond simple Like.
5. DRM or complex rights management.
6. Push-based content delivery or automatic content prioritization.
7. Integration with external military systems or organizational SSO.
8. Translation, auto-subtitles, or AI-generated summaries.
9. Complex version management (rollback, diff, multi-step approval workflows).
10. Storage quota enforcement on edge devices.
11. In-document search within PDFs.
12. Server-side reporting of Like/Save actions.
13. Multi-language UI.

---

## 11. Success Metrics

### Demo success (primary — hands-on evaluation)

| # | Metric | Target |
|---|--------|--------|
| S1 | End-to-end flow works | Upload → publish → catalog → consume (video+PDF) → download → view offline |
| S2 | Library lookup time | ≤ 60 seconds to find a specific item in a demo scenario |
| S3 | Reels playback start | ≤ 2 seconds under reasonable network; fast-start via prefetch under weak network |
| S4 | Browser containment | 100% of viewing inside Chrome — no external apps, no pop-ups |
| S5 | Interest filtering | At least 3 selectable interests that consistently filter feed and library |
| S6 | Offline playback | Previously downloaded video and PDF viewable with zero network |
| S7 | Content update visibility | Downloaded items show "updated" badge when catalog version exceeds download version after sync |
| S8 | Demo corpus | 15 items (10 PDFs + 5 videos) loaded and navigable |

### Structural success (secondary — code quality)

| # | Metric | Target |
|---|--------|--------|
| S9 | Continuation readiness | A new developer can set up the project and understand the architecture within 1 day |
| S10 | Layer separation | Clear separation between content management, catalog/API, delivery/offline, and UI layers |

---

## 12. Assumptions

| # | Assumption | Impact if wrong |
|---|-----------|----------------|
| A1 | Chrome in kiosk mode supports IndexedDB sufficiently for storing device state (profile, download records, local actions); content files are cached by edge proxy (nginx `proxy_cache`) | Core local state feature breaks; would need native wrapper for IndexedDB; edge proxy cache failure would break offline content access |
| A2 | A standard video format (e.g., MP4/H.264) with HTTP range requests provides adequate prefetch + streaming for ≤3 min clips | Reels experience degrades; may need HLS/DASH which adds complexity |
| A3 | PDFs can be rendered reliably in-browser (e.g., PDF.js) without external plugins | PDF viewing fails in kiosk; would need alternative viewer |
| A4 | The demo lab environment provides a server reachable by edge devices on the same network | Metadata sync and content fetch fail; demo breaks |
| A5 | A simple flat or one-level interest list is sufficient for meaningful feed filtering | Feed feels random; may need deeper taxonomy |
| A6 | 20 concurrent devices will not strain a single-server deployment in a demo setting | Needs load testing; may need caching layer |
| A7 | Centralized HQ staff can prepare 15 demo content items (10 PDFs + 5 videos, ≤3 min each) | Demo corpus is thin; less convincing evaluation |
| A8 | A simple admin password is an acceptable security boundary for the MVP demo | Organizational security review blocks the demo |

---

## 13. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| R1 | Smooth "TikTok" feel is hard to achieve under weak bandwidth | High | High | Aggressive prefetch; degrade gracefully with loading indicator; test early with throttled network |
| R2 | Browser kiosk mode restricts storage/cache APIs | Medium | High | Spike test early on target hardware; have fallback to smaller cache |
| R3 | No user auth becomes an organizational blocker even for demo | Medium | Medium | Document security boundary clearly; isolate demo on internal network; admin portal behind password |
| R4 | Category/interest taxonomy becomes unwieldy without clear design | Medium | Medium | Define a fixed starter taxonomy in MVP Spec; keep it flat or max 2 levels |
| R5 | PDF rendering is inconsistent for large or complex documents | Low | Medium | Test with representative docs early; set a soft page-count guidance (not a hard limit) |
| R6 | Scope creep during development pushes past 10-week MVP window | Medium | High | Strict scope; use de-scope levers below; weekly scope check |

---

## 14. Open Questions / Pending Decisions

| # | Question | Affects | Recommended default | Decision deadline |
|---|---------|---------|-------------------|------------------|
| Q1 | Which video protocol/format for MVP? (plain MP4 with range requests vs. HLS/DASH) | Architecture, streaming UX | MP4 + HTTP range requests (simplest) | Before System Architecture |
| Q2 | Metadata sync mechanism: pull on app open, periodic polling, or push? | API design, offline behavior | Pull on app open + manual refresh button | Before API Contract |
| Q3 | What is stored in IndexedDB vs. Cache API vs. filesystem? | Offline architecture | IndexedDB for metadata + device profile; Cache API for media files | Before System Architecture |
| Q4 | How are interests defined and managed? Fixed list, admin-managed, hierarchical? | Admin portal, data model | Admin-managed flat list (no hierarchy) | Before Data Model |
| Q5 | Minimum demo security posture — network isolation only, or admin password too? | Deployment, demo prep | Both: network isolation + admin portal password | Before Delivery Plan |
| Q6 | Which single language for MVP UI? | UI development | To be decided by stakeholders | Before MVP Spec |
| Q7 | Should the reels feed show PDFs or only videos? | Feed design, UX | Videos only in reels; PDFs only in library | Before MVP Spec |

---

## 15. De-scope Levers

If the team runs behind schedule, cut in this order (each item is independently removable):

| Priority | Feature to cut | Impact |
|----------|---------------|--------|
| 1st cut | "Updated" badge on content items | Minor UX loss; users still get latest content |
| 2nd cut | Interest-based feed filtering | Feed shows all content; still functional |
| 3rd cut | Category tree management in admin (use seed data instead) | Admin can still upload; categories are pre-seeded |
| 4th cut | Text search in library | Users browse by category only; still functional |
| 5th cut | PDF support (video-only MVP) | Reduces content types but preserves core reels experience |
| 6th cut | Download / offline viewing | Requires network; major capability loss — last resort |

---

## 16. Continuation Notes

This section documents what a follow-on team should expect to extend after the MVP:

- **User identity & RBAC** — The MVP is userless (kiosk). The data model and API should use a device-id pattern that can later be replaced by user-id without schema rewrites.
- **Like/Save server reporting** — MVP stores locally. The data model should include a local action log that can be batch-synced to the server when identity + analytics are added.
- **Storage quota** — MVP has no limit. The download manager should track file sizes so a quota system can be layered on.
- **Multi-language / RTL** — MVP is single-language. UI components should use a string-key pattern (not hardcoded strings) so i18n can be added.
- **Recommendation engine** — MVP uses interest-based filtering only. The content model should include fields (view count, like count) that a future algorithm can consume.
- **Push-based sync** — MVP uses pull. The API should be designed so a WebSocket or SSE channel can be added alongside the existing REST pull.
- **Advanced content versioning** — MVP replaces content silently with an "updated" badge. The data model should store a version counter and previous-version reference for future rollback capability.

---

*This document is the first in the TactiTok document set. Proceed to `product/02_system-boundaries.md`.*
