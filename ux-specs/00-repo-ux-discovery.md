# UX Discovery — TactiTok

> **Version:** 0.1
> **Status:** Draft
> **Created:** 2026-03-19
> **Purpose:** Summarise what was read from the repo before producing the UX specification. This file is a working record, not a deliverable.

---

## 1. Files Reviewed

| File | Version | Key UX inputs extracted |
|------|---------|------------------------|
| `product/docs-en/north-star.md` | 0.1 | Vision, target users, core flows, MVP boundary, hard constraints |
| `product/docs-en/03_mvp-spec.md` | 0.1 | 5 user journeys, 7 capability groups, acceptance criteria, out-of-scope list, de-scope ladder |
| `product/docs-en/04_system-architecture.md` | 0.2 | Component inventory, tech stack decisions, edge proxy topology, offline capability matrix |
| `product/docs-en/05_data-model.md` | 0.2 | Entity shapes that drive UI state (DeviceProfile, CachedCatalog, DownloadRecord, LocalAction, ContentItemDTO) |
| `product/docs-en/06_api-contract.md` | 0.2 | Endpoint shapes, response DTOs, caching model, error format |
| `notes/decisions.md` | — | D3 (like/save local-only), D19 (PDFs library-only), D20 (bottom tab bar), D21 (first-run interest selection), D24 (React), D60 (updated badge on downloads only), D61 (save/like write-only, no recall surface) |

---

## 2. Product Model Summary

### Two independent surfaces

| Surface | Who uses it | Device | Network | Auth |
|---------|------------|--------|---------|------|
| **Edge SPA** | Fighters at the edge | ~10" tablet, Chrome kiosk, Windows + Linux VM + Docker | Unstable / low-bandwidth | None (anonymous) |
| **Admin Portal** | HQ training staff | Desktop browser | Stable HQ network | Shared password → JWT (sessionStorage) |

### Content model (what the UI shows)

- **ContentItem** — has `id`, `title`, `description`, `type` (video | pdf), `fileSize`, `duration` (video only), `thumbnailUrl`, `version`, `categoryIds[]`, `interestIds[]`
- **Category** — `id`, `name`, `parentId` (null = top-level), `sortOrder`; max 2 levels
- **Interest** — `id`, `name`; flat list; admin-managed
- **DownloadRecord** (edge IndexedDB) — `contentId`, `title`, `type`, `fileSize`, `downloadedAt`, `version`
- **LocalAction** (edge IndexedDB) — `contentId`, `action` (like | save), `active`, `timestamp`
- **DeviceProfile** (edge IndexedDB) — `selectedInterestIds[]`, `deviceId`

### Content lifecycle that drives UI state

```
Upload (admin) → version=1, published immediately
Replace file (admin) → version++, updatedAt updated
Delete (admin) → removed; edge cleans up on next sync
```

### Offline model (relevant to edge UX)

- SPA served from Docker image (nginx) — always available at `localhost:8080`
- Content files cached by nginx proxy on first access
- User-initiated "download" = SPA reads file fully (warms proxy cache) + writes DownloadRecord to IndexedDB
- Offline playback = same URL request → proxy serves from cache
- SPA never touches Cache API or Service Worker

---

## 3. Conflicts and Gaps Found

### CONFLICT-1 — Framework: React vs. "HTML + TypeScript"

| Source | Says |
|--------|------|
| Architecture doc §6.1 C1/C2 | "HTML + TypeScript" |
| Architecture doc AD2 | "HTML + TypeScript for both SPAs; No framework dependency" |
| `notes/decisions.md` D24 | "React + TypeScript (edge SPA + admin SPA)" |

**Resolution for UX spec:** D24 in the decisions log is the most recent, explicit decision record and overrides the architecture doc narrative. The UX spec assumes **React + TypeScript** for both SPAs. The architecture doc should be corrected in a future revision.

**Impact on UX spec:** Component boundaries are React components; state management uses React state / hooks + IndexedDB; routing uses a React router.

---

### CONFLICT-2 — Save button: action with no recall surface

- Like/Save buttons are in scope (CAP-2.7, CAP-2.8 — Should priority)
- D61 explicitly states: Save/Like are **write-only** in MVP — stored in IndexedDB, no "Saved" tab, no "Liked" view
- MVP Spec OOS-18: "Saved items view (separate from Downloads) — Like/Save are indicators only in MVP"

**UX consequence:** The Save button toggles a LocalAction in IndexedDB and changes its visual state (active/inactive). Tapping Save does **not** navigate anywhere and does not add the item to Downloads. Users who want offline access must use the Download button. The UX must make this distinction clear.

---

### CONFLICT-3 — Interest filtering in Library (optional)

- CAP-3.8: "Interest-based filtering in library" — **Could** priority (lowest)
- Reels feed filtering is **Must** (CAP-2.5)

**UX consequence:** Library UX must be designed so interest filtering can be added without restructuring (e.g., a filter chip row above the content list), but it is not required for MVP and should not be implemented unless the Must items are complete.

---

### CONFLICT-4 — Change interests / settings

- CAP-1.6 (Change interests from settings/profile area) — **Should** priority
- De-scope lever #6 in MVP Spec §13

**UX consequence:** The UX spec should include a settings entry point (e.g., a gear icon or "Edit interests" link in the Reels header or bottom tab area) but must mark it as a Should-priority screen. If cut, users set interests once on first open and can only reset by clearing browser data.

---

### CONFLICT-5 — Network indicator placement

- CAP-1.7: Network status indicator — Must
- No location specified in any document

**UX resolution:** Place a small persistent status chip (e.g., top-right of all edge screens) that shows "Offline" when `GET /api/health` fails. When online, the chip is hidden or shows a subtle "Online" state. See component inventory for spec.

---

### GAP-1 — Swipe vs. click/arrow fallback in Reels

The North Star and MVP Spec define swipe-to-advance (CAP-2.3) but do not specify a non-touch fallback. MR2 notes that swipe may be unreliable and recommends testing early.

**UX consequence:** The Reels screen should support both touch swipe (primary) and visible arrow buttons or keyboard arrow keys (fallback) for advancing between videos. The fallback must not clutter the full-screen UI — arrows shown only on hover/focus or as a thin hit-target on the screen edges.

---

### GAP-2 — "Updated" badge scope (library vs. downloads only)

- D60 (decisions.md): "Updated badge shows on downloaded items only"
- Data model §9.3: badge shows on items in Library and Downloads where there is a version mismatch

**UX resolution:** Follow D60. Updated badge shown only on DownloadRecord items (where a version baseline exists). No badge in Library for non-downloaded items.

---

### GAP-3 — PDF in Reels

- D19: Reels = videos only; PDFs appear only in Library
- The Reels feed API delivers only `type=video` items

**UX consequence:** The PDF viewer is accessible only from Library Detail. There is no path from Reels to a PDF. The Reels feed must not display PDF content items.

---

### GAP-4 — Empty states

Empty states are specified at journey level (Journey 2 step 10, Journey 3 steps 9–10, Journey 4 step 6) but not per-screen. The detailed UX spec defines empty states for every screen that can be empty.

---

### GAP-5 — Admin logout / session end

- JWT in sessionStorage — tab close = logout (by browser behaviour)
- No "remember me" option (D48)
- No token refresh in MVP

**UX consequence:** Admin sees the login screen on every fresh tab open or browser restart. There is no persistent session. The admin portal should show an expiry warning when the token is near expiry (8-hour window, configurable).

---

## 4. Open UX Questions

| # | Question | Where it bites | Recommended default |
|---|---------|----------------|-------------------|
| UQ1 | Should the Reels feed show a visible scroll progress indicator (e.g., dots on the right edge showing position in feed)? | Reels screen | No indicator in MVP — feed is infinite-style; adds implementation complexity for marginal value |
| UQ2 | When the user taps a video from Library Detail, does it open in the Reels-style full-screen player or a non-swipeable standalone player? | Library Detail → Video Player | Non-swipeable standalone player (no adjacent videos to swipe to); same player component, different mode. Aligns with MQ2 recommendation in MVP Spec. |
| UQ3 | What happens if the user taps Download on an item already in Downloads? | Download button state | Button shows "Downloaded" state (disabled or icon change); tapping has no effect. |
| UQ4 | Should the Settings / Change Interests screen be a full screen or a modal/sheet? | Settings | Bottom sheet or modal (less navigation overhead); full screen acceptable too. |
| UQ5 | In Category Management (admin), should drag-and-drop reorder be in scope, or is a manual up/down arrow approach acceptable? | Admin categories | Up/down arrow buttons for MVP (D51 cascade delete is already complex enough); drag-and-drop is a continuation item. |
| UQ6 | Should the admin Upload form auto-detect content type (video vs. PDF) from the uploaded file, or require the user to select it explicitly? | Upload form | Auto-detect from MIME type (file-type library validates server-side); no explicit type selector needed in the form. |
| UQ7 | What is the admin view for a deleted interest that is still referenced in existing content's interestIds? | Interest Management | Server removes ContentInterest junction rows on delete; content remains but loses the interest tag. Admin sees no orphan warning in MVP. |
