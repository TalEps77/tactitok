# MVP Spec — TactiTok

> **Version:** 0.1
> **Status:** Draft
> **Last updated:** 2026-03-06
> **Preceding document:** `product/02_system-boundaries.md`
> **Next document:** `product/04_system-architecture.md`

---

## 1. Purpose of This Document

This MVP Spec translates the Product Brief and System Boundaries into a concrete, buildable scope. It defines:

- What exactly is included in the MVP build
- What the core user-visible capabilities are
- Which user journeys must work end to end
- What acceptance criteria define "done"
- What is intentionally excluded
- What can be cut first if time runs short

Every downstream document (System Architecture → Data Model → API Contract → Delivery Plan) must implement this spec. If a conflict arises, the Product Brief governs unless the North Star overrides it.

---

## 2. MVP Objective

Deliver a working end-to-end prototype that demonstrates:

1. A **TikTok-style reels experience** for consuming short training videos on a 10″ tablet.
2. A **searchable content library** with category-based browsing for videos and PDFs.
3. An **admin portal** where HQ staff upload and organize content.
4. **Offline access** to previously downloaded content.
5. All of the above running **entirely in Chrome**, with a **hybrid connectivity model**.

The MVP must be **demoable hands-on** with 15 content items (10 PDFs + 5 videos) and must convince evaluators that the approach is viable and worth continuing.

---

## 3. Definitions / Terms

Carried forward from the Product Brief (section 7). Additional MVP-specific terms:

| Term | Definition |
|------|-----------|
| **Auto-play** | Video begins playing automatically when it scrolls into view (TikTok-style); no tap required |
| **Swipe-to-advance** | Vertical swipe gesture moves to the next/previous video in the reels feed |
| **Bottom tab bar** | The primary navigation element with 3 tabs: Reels, Library, Downloads |
| **Interest selection screen** | A one-time setup screen shown on first app open where the user picks interests |
| **Updated badge** | A visual indicator on a content item showing it has been updated since the user last saw it |
| **Prefetch** | Buffering the first N seconds of a video before the user scrolls to it, enabling instant playback start |

---

## 4. Target Demo Outcome

### Demo scenario
A hands-on session where evaluators interact directly with a 10″ tablet in a lab environment with simulated network conditions.

### Demo script (what evaluators should experience)

| Step | Action | Expected result |
|------|--------|----------------|
| 1 | HQ staff uploads a new video via admin portal | Video appears in catalog with metadata |
| 2 | HQ staff uploads a PDF and assigns categories/interests | PDF appears in catalog, organized in category tree |
| 3 | Edge device opens app for the first time | Interest selection screen appears |
| 4 | User selects 2–3 interests | Reels feed loads with filtered videos |
| 5 | User scrolls through reels | Videos auto-play smoothly; swipe advances to next |
| 6 | User taps "Download" on a video | Video saved locally; appears in Downloads tab |
| 7 | User navigates to Library tab | Category tree shown; text search available |
| 8 | User searches for a topic | Relevant results appear within seconds |
| 9 | User opens a PDF from library | PDF renders in-browser, page-by-page |
| 10 | User downloads the PDF | PDF saved locally; appears in Downloads tab |
| 11 | Network is disconnected (simulated) | App shows offline indicator |
| 12 | User opens Downloads tab | Previously downloaded video + PDF are accessible |
| 13 | User plays downloaded video offline | Video plays fully without network |
| 14 | User opens downloaded PDF offline | PDF renders fully without network |
| 15 | Network restored; HQ uploads updated video | Edge device shows "updated" badge after sync |

### Demo success criteria

| # | Criterion | Target |
|---|----------|--------|
| D1 | End-to-end flow completes | All 15 demo steps work without errors |
| D2 | Reels playback start | ≤ 2 seconds on reasonable network |
| D3 | Library lookup | ≤ 60 seconds to find a specific item |
| D4 | Offline playback | 100% functional for downloaded items |
| D5 | Browser containment | Zero external apps, pop-ups, or OS-level interactions |
| D6 | Content corpus | 15 items loaded (10 PDFs + 5 videos) |
| D7 | Interest filtering | At least 3 interests; feed filters correctly |

---

## 5. Core User Journeys

### Journey 1 — First-Time Setup (Edge Consumer)

| Step | Detail | Acceptance criteria |
|------|--------|-------------------|
| 1 | User opens app in Chrome | App loads fully in browser; no splash screen longer than 2s |
| 2 | Interest selection screen appears | Shows all available interests as selectable chips/toggles |
| 3 | User selects 1+ interests | Selections are persisted in device profile |
| 4 | User taps "Continue" / "Start" | Navigates to Reels feed, filtered by selected interests |

**Post-setup:** On subsequent opens, app goes directly to Reels feed using saved interests. User can change interests later from a settings/profile area.

---

### Journey 2 — Browse Reels (Edge Consumer)

| Step | Detail | Acceptance criteria |
|------|--------|-------------------|
| 1 | Reels tab is active (default on open) | Full-screen vertical video feed loads |
| 2 | First video auto-plays | Playback starts ≤ 2s on reasonable network; prefetch enables fast start |
| 3 | User swipes up | Current video stops; next video auto-plays |
| 4 | User swipes down | Returns to previous video; auto-plays |
| 5 | Video shows overlay UI | Title, description (truncated), Like button, Save button, Download button |
| 6 | User taps Like | Heart icon toggles; like stored locally |
| 7 | User taps Save | Bookmark icon toggles; save stored locally |
| 8 | User taps Download | Download begins; progress indicator shown; on completion, item appears in Downloads |
| 9 | Feed filters by interests | Only videos matching selected interests appear; if no interests set, show all |
| 10 | Feed handles empty state | If no videos match interests, show a clear message |
| 11 | Network degrades mid-scroll | Current video continues if buffered; next video shows loading indicator |

---

### Journey 3 — Find Content in Library (Edge Consumer)

| Step | Detail | Acceptance criteria |
|------|--------|-------------------|
| 1 | User taps Library tab | Library view loads with category tree |
| 2 | Category tree shows 2-level hierarchy | Top-level categories with expandable children |
| 3 | User taps a category | Filtered list of content items (videos + PDFs) shown |
| 4 | User types in search bar | Results filter in real-time or on submit; searches title + description |
| 5 | Search results show item type | Clear icon/badge distinguishing video vs. PDF |
| 6 | User taps a video item | Video opens in player view (same as reels but standalone); can download |
| 7 | User taps a PDF item | PDF opens in in-browser viewer; page-by-page navigation; can download |
| 8 | Downloaded items show "updated" badge | If a downloaded item's catalog version exceeds the download record version, badge is visible |
| 9 | Empty category | Shows clear "No items in this category" message |
| 10 | Search with no results | Shows clear "No results found" message |

---

### Journey 4 — Offline Access (Edge Consumer)

| Step | Detail | Acceptance criteria |
|------|--------|-------------------|
| 1 | User taps Downloads tab | List of all downloaded items shown (videos + PDFs) |
| 2 | List shows item metadata | Title, type (video/PDF), file size, download date |
| 3 | User taps a downloaded video | Video plays from edge proxy cache; no network required |
| 4 | User taps a downloaded PDF | PDF renders from edge proxy cache; no network required |
| 5 | User deletes a downloaded item | Confirmation prompt → item removed from local storage and list |
| 6 | Downloads list is empty | Clear "No downloads yet" message with guidance |
| 7 | App is fully offline | Downloads tab works; Reels and Library show offline indicator; cached metadata still browsable |

---

### Journey 5 — Content Upload & Admin (HQ Staff)

| Step | Detail | Acceptance criteria |
|------|--------|-------------------|
| 1 | Staff navigates to admin portal URL | Login screen appears |
| 2 | Staff enters password | Authenticated; dashboard/content list shown |
| 3 | Staff clicks "Upload Content" | Upload form appears: file picker, title, description, category selector, interest tags, content type auto-detected |
| 4 | Staff uploads a video (MP4, ≤3 min) | File uploads with progress bar; server validates format and duration |
| 5 | Staff uploads a PDF | File uploads with progress bar; server validates format |
| 6 | Staff fills metadata and publishes | Content item created; appears in content list |
| 7 | Staff updates existing content | Upload replaces file; version date updates; edge devices see "updated" badge on next sync |
| 8 | Staff manages category tree | Create, rename, reorder, delete categories (max 2 levels) |
| 9 | Staff manages interests | Create, rename, delete interest tags |
| 10 | Staff views content list | Sortable/filterable list of all content with metadata |
| 11 | Staff deletes content | Confirmation → content removed from catalog; edge devices remove on next sync |
| 12 | Invalid upload rejected | Server rejects non-MP4 video or non-PDF file with clear error message |

---

## 6. MVP Capabilities

### CAP-1: Edge App Foundation

| ID | Capability | Priority |
|----|-----------|----------|
| CAP-1.1 | App loads in Chrome kiosk mode on 10″ tablet | Must |
| CAP-1.2 | Bottom tab bar navigation (Reels, Library, Downloads) | Must |
| CAP-1.3 | Responsive layout optimized for 10″ tablet (landscape + portrait) | Must |
| CAP-1.4 | First-time interest selection screen | Must |
| CAP-1.5 | Persistent device profile (interests stored in IndexedDB) | Must |
| CAP-1.6 | Change interests from settings/profile area | Should |
| CAP-1.7 | Network status indicator (online/offline) | Must |
| CAP-1.8 | Metadata sync on app open + manual refresh button | Must |
| CAP-1.9 | "Last synced" timestamp visible to user | Should |

### CAP-2: Reels Feed

| ID | Capability | Priority |
|----|-----------|----------|
| CAP-2.1 | Full-screen vertical video feed (TikTok-style) | Must |
| CAP-2.2 | Auto-play on scroll into view | Must |
| CAP-2.3 | Swipe up/down to advance/return | Must |
| CAP-2.4 | Video prefetch (buffer first N seconds of next video) | Must |
| CAP-2.5 | Interest-based feed filtering | Must |
| CAP-2.6 | Video overlay: title, description | Must |
| CAP-2.7 | Like button (local-only) | Should |
| CAP-2.8 | Save/bookmark button (local-only) | Should |
| CAP-2.9 | Download button on video overlay | Must |
| CAP-2.10 | Loading/buffering indicator | Must |
| CAP-2.11 | Graceful degradation on weak network | Must |
| CAP-2.12 | Empty feed state ("No videos match your interests") | Must |

### CAP-3: Library

| ID | Capability | Priority |
|----|-----------|----------|
| CAP-3.1 | Category tree browsing (2-level hierarchy) | Must |
| CAP-3.2 | Text search (searches title + description) | Must |
| CAP-3.3 | Content list with type indicator (video/PDF icon) | Must |
| CAP-3.4 | Open video from library (standalone player view) | Must |
| CAP-3.5 | Open PDF from library (in-browser viewer) | Must |
| CAP-3.6 | Download button on content detail | Must |
| CAP-3.7 | "Updated" badge on recently updated items | Should |
| CAP-3.8 | Interest-based filtering in library (optional) | Could |
| CAP-3.9 | Empty state messages (no items, no results) | Must |

### CAP-4: Content Consumption

| ID | Capability | Priority |
|----|-----------|----------|
| CAP-4.1 | In-browser video player (HTML5 video, MP4) | Must |
| CAP-4.2 | Player controls: play/pause, progress bar, mute | Must |
| CAP-4.3 | In-browser PDF viewer (PDF.js or equivalent) | Must |
| CAP-4.4 | PDF page-by-page navigation | Must |
| CAP-4.5 | Video streaming via HTTP range requests | Must |
| CAP-4.6 | Playback start ≤ 2s on reasonable network | Must |

### CAP-5: Download & Offline

| ID | Capability | Priority |
|----|-----------|----------|
| CAP-5.1 | User-initiated download of video or PDF | Must |
| CAP-5.2 | Download progress indicator | Must |
| CAP-5.3 | Downloads tab: list of downloaded items | Must |
| CAP-5.4 | Play/view downloaded content fully offline | Must |
| CAP-5.5 | Delete individual downloaded items | Must |
| CAP-5.6 | Downloaded items show title, type, size, date | Should |
| CAP-5.7 | Metadata cache for offline library browsing | Should |
| CAP-5.8 | Offline indicator in Reels and Library views | Must |

### CAP-6: Admin Portal

| ID | Capability | Priority |
|----|-----------|----------|
| CAP-6.1 | Password-protected login | Must |
| CAP-6.2 | Content list (all items, sortable/filterable) | Must |
| CAP-6.3 | Upload video (MP4) with metadata form | Must |
| CAP-6.4 | Upload PDF with metadata form | Must |
| CAP-6.5 | Edit content metadata | Must |
| CAP-6.6 | Delete content | Must |
| CAP-6.7 | Update/replace content file (new version) | Must |
| CAP-6.8 | Category tree CRUD (create, rename, reorder, delete) | Must |
| CAP-6.9 | Interest/tag management (create, rename, delete) | Must |
| CAP-6.10 | Upload validation (reject non-MP4 video, non-PDF) | Must |
| CAP-6.11 | Upload progress bar | Should |
| CAP-6.12 | Video duration validation (reject >3 min) | Should |

### CAP-7: Hybrid Connectivity

| ID | Capability | Priority |
|----|-----------|----------|
| CAP-7.1 | Metadata sync (pull on app open) | Must |
| CAP-7.2 | Manual refresh button for metadata | Must |
| CAP-7.3 | Content fetched on demand (not pre-pushed) | Must |
| CAP-7.4 | Edge app functional offline with downloaded content | Must |
| CAP-7.5 | Graceful handling of network loss mid-operation | Must |
| CAP-7.6 | "Last synced" timestamp | Should |

---

## 7. Acceptance Criteria (Summary Matrix)

### Must-pass criteria for MVP sign-off

| # | Criterion | Validation method |
|---|----------|------------------|
| AC-1 | End-to-end demo flow completes (all 15 demo steps) | Manual demo walkthrough |
| AC-2 | Reels auto-play and swipe-to-advance work smoothly | Hands-on tablet test |
| AC-3 | Video playback starts ≤ 2s on reasonable network | Stopwatch test with simulated bandwidth |
| AC-4 | Library search returns results for known items ≤ 5s | Manual test |
| AC-5 | PDF renders correctly in-browser for 3+ test documents | Visual check |
| AC-6 | Downloaded video plays offline with zero network | Airplane mode / disconnect test |
| AC-7 | Downloaded PDF renders offline with zero network | Airplane mode / disconnect test |
| AC-8 | Admin upload → edge visibility ≤ 30s after sync | Timed test |
| AC-9 | Interest selection filters reels feed correctly | Manual: select interest → verify feed content |
| AC-10 | 15 demo items (10 PDFs + 5 videos) loaded and navigable | Content check |
| AC-11 | All interaction happens inside Chrome — no pop-ups, no external apps | Visual check on kiosk device |
| AC-12 | App handles network drop gracefully — no crashes, clear messaging | Disconnect during use |

---

## 8. In Scope

Carried forward from Product Brief section 9, with MVP Spec refinements:

1. Edge SPA with bottom tab bar (Reels, Library, Downloads)
2. TikTok-style reels feed with auto-play, swipe-to-advance, and video prefetch
3. Interest selection screen (first-time setup) + ability to change interests
4. Library with 2-level category tree + text search (title + description)
5. In-browser video playback (HTML5 video, MP4, HTTP range requests)
6. In-browser PDF viewer (PDF.js or equivalent, page-by-page)
7. User-initiated download of video/PDF to browser local storage
8. Downloads management tab (list, play/view, delete)
9. Offline playback of downloaded content
10. Like/Save buttons (local-only storage)
11. "Updated" badge on content items with newer versions
12. Admin portal: upload, edit, delete content; manage categories and interests
13. Admin password authentication (simple shared password)
14. Upload validation (MP4 only for video, PDF only for documents)
15. Metadata sync (pull on app open + manual refresh)
16. Network status indicator + offline graceful degradation
17. English-language UI (string-key architecture for future i18n)
18. Demo corpus: 10 PDFs + 5 videos preloaded
19. Tablet-optimized layout (10″, landscape + portrait)

---

## 9. Out of Scope

Carried forward from Product Brief section 10, with additions:

1. Advanced recommendation / personalization engine
2. Analytics dashboards, usage monitoring, or reporting
3. User authentication or RBAC (beyond admin password)
4. Social features: chat, comments, sharing
5. DRM or content protection beyond TLS
6. Push-based content delivery
7. External system integrations (SSO, military systems)
8. Translation, auto-subtitles, AI summaries
9. Complex version management (rollback, diff, approvals)
10. Storage quota enforcement
11. In-document search within PDFs
12. Server-side Like/Save reporting
13. Multi-language UI
14. Video transcoding (server accepts MP4 only)
15. Desktop-optimized edge layout (tablet-first only)
16. Continuous/background sync (only on app open + manual)
17. Content preview thumbnails auto-generated by server
18. Saved items view (separate from Downloads) — Like/Save are indicators only in MVP
19. Reels feed for PDFs (PDFs appear in Library only)

---

## 10. Assumptions

| # | Assumption | Impact if wrong |
|---|-----------|----------------|
| MA1 | English UI is acceptable for MVP; Hebrew-speaking developers can build English UI without friction | UI text rework needed; low risk |
| MA2 | TikTok-style auto-play works reliably in Chrome kiosk mode without user gesture requirement | Chrome may require initial gesture to enable auto-play; fallback: tap-to-play first video |
| MA3 | HTML5 `<video>` with MP4 + HTTP range requests is sufficient for prefetch + streaming at ≤3 min | May need HLS/DASH; significant complexity increase |
| MA4 | PDF.js renders all demo PDFs correctly (various page counts, embedded images) | Need fallback viewer or constrain PDF complexity |
| MA5 | Edge proxy cache (nginx `proxy_cache`, up to 10 GB) provides enough storage for 15 downloaded content files; IndexedDB stores only metadata records (<50 KB total) | Edge proxy cache disk space limit hit (unlikely at 10 GB for demo); or Docker volume cleared unexpectedly |
| MA6 | Swipe gestures work reliably in Chrome on the target 10″ tablet | Touch events may need polyfill or tuning |
| MA7 | 2-level category tree is sufficient for organizing 15 demo items meaningfully | Flat list may be needed as de-scope; or deeper tree needed |
| MA8 | Video prefetch (buffer next video while current plays) is achievable with standard browser APIs | May need Service Worker or custom buffering strategy |

---

## 11. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| MR1 | Chrome auto-play policy blocks video auto-play without user gesture | Medium | High | Test on target device early; implement tap-to-start fallback for first video; subsequent videos should auto-play after initial interaction |
| MR2 | Swipe gesture detection is unreliable on target tablet | Medium | Medium | Use established touch library (e.g., Hammer.js or native touch events); test on device early |
| MR3 | Video prefetch of next video while current plays causes stuttering | Medium | High | Limit prefetch to first 2–3 seconds; use low-priority fetch; test under throttled network |
| MR4 | PDF.js fails on complex or large PDFs | Low | Medium | Test with representative docs in week 1; set soft guidance on PDF complexity |
| MR5 | TikTok-style full-screen experience is hard to achieve with standard HTML/CSS | Medium | Medium | Use established patterns (CSS `scroll-snap`); prototype in week 1 |
| MR6 | Total build exceeds 10-week window | Medium | High | Use de-scope levers aggressively; prioritize Must items; weekly scope review |
| MR7 | Metadata sync design becomes complex (conflict handling, partial updates) | Low | Medium | Server is authoritative; edge does full catalog replace on sync |

---

## 12. Open Questions / Pending Decisions

| # | Question | Affects | Recommended default | Deadline |
|---|---------|---------|-------------------|----------|
| MQ1 | Exact prefetch strategy: how many seconds of next video? 2s? 5s? | Reels UX, bandwidth | 3 seconds of next video | Before implementation (sprint 1) |
| MQ2 | Should the standalone video player (opened from Library) use the same full-screen UI as reels, or a different layout? | UI consistency | Same player component, but without swipe navigation | Before UI design |
| MQ3 | How should the admin portal handle very large video files (e.g., 500MB for a 3-min high-quality video)? Upload size limit? | Admin UX, server | Set upload limit at 100MB per file; sufficient for 3 min at reasonable quality | Before API Contract |
| MQ4 | Should metadata sync be a full catalog pull or delta-based? | API design, bandwidth | Full catalog pull (≤15 items = small payload); delta only if catalog grows | Before API Contract |
| MQ5 | Should the "Saved" items be accessible from a separate sub-view, or just marked in the Library? | Edge UX | Marked in Library with a filter toggle; no separate view | Before UI design |

---

## 13. De-scope Levers

Ordered by priority — cut from the top first:

| Priority | Capability to cut | IDs affected | Impact | Effort saved |
|----------|------------------|-------------|--------|-------------|
| 1st | "Updated" badge | CAP-3.7 | Minor UX; users still get latest content after sync | ~2–3 days |
| 2nd | Like/Save buttons | CAP-2.7, CAP-2.8 | No bookmarking; users rely on Downloads only | ~2–3 days |
| 3rd | Interest-based filtering + selection screen | CAP-1.4, CAP-1.5, CAP-2.5 | Feed shows all videos; library shows all items; simpler but less "TikTok" | ~4–5 days |
| 4th | Category tree management in admin (use seed data) | CAP-6.8 | Categories are pre-seeded; admin cannot modify | ~3–4 days |
| 5th | Text search in library | CAP-3.2 | Users browse by category only | ~3–4 days |
| 6th | Change interests (settings area) | CAP-1.6 | Interests set once on first open; reset only by clearing browser data | ~1–2 days |
| 7th | PDF support (video-only MVP) | CAP-3.5, CAP-4.3, CAP-4.4, CAP-6.4 | Major capability loss; demo shows video only | ~5–7 days |
| 8th | Download / offline viewing | CAP-5.x | Requires network always; core capability loss — last resort | ~7–10 days |

---

## 14. Continuation Notes

Guidance for extending the MVP into a production-ready system:

- **Recommendation engine:** The reels feed currently uses interest-based filtering. The content model should include view-count and like-count fields (populated locally in MVP) that a future algorithm can consume. The feed API should accept a `sort` or `recommend` parameter that MVP ignores.
- **Server-side analytics:** Like/Save are local-only. The local storage schema stores these with content-id + timestamp so a future sync job can batch-upload them. The API should have a placeholder endpoint for action reporting.
- **Saved items view:** MVP marks Saved items in the Library. A dedicated "Saved" tab or view can be added to the tab bar later without restructuring.
- **Rich admin features:** MVP admin is functional but minimal. Future additions include: bulk upload, content preview before publish, usage statistics per item, multi-user admin with roles.
- **Adaptive streaming:** MVP uses plain MP4 + range requests. If bandwidth proves too variable, HLS/DASH can be added behind the same video player component by swapping the source URL format.
- **Auto-play policy:** If Chrome blocks auto-play, the architecture should support a "tap to start" first-video fallback that enables auto-play for subsequent videos. This is a known browser pattern.
- **Content thumbnails:** MVP relies on admin-uploaded metadata. A future enhancement can auto-generate video thumbnails on upload via ffmpeg.
- **Deeper category tree:** MVP supports 2 levels. The data model should use a parent-id pattern (not hardcoded depth) so deeper trees work without schema changes.

---

*This document is the third in the TactiTok document set. Proceed to `product/04_system-architecture.md`.*
