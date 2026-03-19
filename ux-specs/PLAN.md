# UX Spec Build Plan — TactiTok

> **Purpose:** Step-by-step execution plan for the loop. Each step is small enough to complete in one context window. The loop reads this file, executes the next `[ ]` step, marks it `[x]`, and updates the status block below.
>
> **Source files to read before each step:**
> - `ux-specs/00-repo-ux-discovery.md` — conflicts, gaps, open questions
> - `ux-specs/01-ux-planning.md` — screen inventory, nav model, shared patterns
> - `product/docs-en/03_mvp-spec.md` — capabilities, journeys, acceptance criteria
> - `product/docs-en/05_data-model.md` — entity shapes
> - `product/docs-en/06_api-contract.md` — DTO shapes

---

## Status

```
Total steps : 16
Done        : 15
In progress : 0
Remaining   : 1
```

---

## Completed

- [x] **DONE** — Write `ux-specs/00-repo-ux-discovery.md`
- [x] **DONE** — Write `ux-specs/01-ux-planning.md`

---

## Remaining Steps

Each step for `02-detailed-ux-spec.md` appends a new section to the file using the Edit tool (add after last line). Step 02-INIT creates the file with the header only.

---

### Step 02-INIT — Create `02-detailed-ux-spec.md` with header

**Status:** `[x]`

**Instructions:**
Write `ux-specs/02-detailed-ux-spec.md` with only the document header:

```markdown
# Detailed UX Specification — TactiTok

> **Version:** 0.1
> **Status:** Draft
> **Created:** 2026-03-19
> **Depends on:** `01-ux-planning.md`, `00-repo-ux-discovery.md`

This document provides per-screen UX specifications for both surfaces of the TactiTok MVP.

For each screen:
- **Purpose** — what the screen is for
- **Entry points** — how the user gets here
- **States** — all possible UI states
- **Layout** — element placement and hierarchy
- **Actions** — what the user can do and what happens
- **Validation / constraints** — rules enforced in the UI
- **Edge cases** — non-happy-path scenarios

Screens follow the inventory in `01-ux-planning.md`.

---

## Surface A — Edge SPA

---
```

---

### Step 02-E1 — Write screen E1: Interest Selection

**Status:** `[x]`

**Instructions:**
Append to `ux-specs/02-detailed-ux-spec.md` the full spec for screen E1.

Key facts:
- Shown on first app open only, when `DeviceProfile.selectedInterestIds` is empty
- Interests loaded from `CachedCatalog.interests` (pulled on app load via `GET /api/catalog`)
- User must select at least 1 interest to continue
- Selection saved to `DeviceProfile.selectedInterestIds` in IndexedDB
- On "Continue" / "Start": navigate to Reels Feed (tab 1)
- On subsequent opens: skip this screen entirely
- If catalog sync fails on first open (offline): show error state with retry button (cannot proceed without interests)
- Change interests later: E10 (Should priority)

---

### Step 02-E2 — Write screens E2/E3/E4: Reels Feed + Overlay + Video Player (Reels)

**Status:** `[x]`

**Instructions:**
Append to `ux-specs/02-detailed-ux-spec.md` specs for E2, E3, and E4 together (they are tightly coupled: the feed contains the player and the overlay).

Key facts:
- E2: full-screen vertical scroll; CSS scroll-snap or Swiper; each "slide" = one video
- E3: overlay rendered on top of the playing video — title (truncated), description (truncated, expandable on tap), Like button, Save button, Download button, type badge (always VIDEO), content category chips (optional display)
- E4: HTML5 `<video>` auto-plays on scroll into view; swipe up = next; swipe down = previous; arrow fallback on screen edges; progress bar at bottom; mute button; play/pause on tap
- Interest filtering: only videos with at least one matching `interestId` in `DeviceProfile.selectedInterestIds` shown; if selectedInterestIds is empty, show all videos
- Prefetch: when video N is playing, fetch first bytes of video N+1 (`/api/content/{nextId}/file?v={version}` with Range header)
- Network status chip visible
- Bottom tab bar visible (behind overlay) but obscured; hide during full-screen when controls auto-hide
- Like: toggles `LocalAction { action: 'like', active: !current }` in IndexedDB; icon fills/unfills
- Save: toggles `LocalAction { action: 'save', active: !current }` in IndexedDB; icon fills/unfills; NO navigation, NO add to downloads
- Download: initiates full file fetch → proxy caches → writes DownloadRecord to IndexedDB; button changes to downloading state (spinner) → downloaded state (checkmark)
- Empty state: when no videos match interests
- Offline state: if cloud unreachable, feed loads from CachedCatalog (metadata OK); videos that are proxy-cached play; uncached videos show buffering/error

---

### Step 02-E5 — Write screen E5: Library View

**Status:** `[x]`

**Instructions:**
Append to `ux-specs/02-detailed-ux-spec.md` the full spec for E5.

Key facts:
- Left panel (or top section on portrait): 2-level category tree — top-level categories with expand/collapse chevron; child categories shown when parent expanded
- Right panel (or below on portrait): content list filtered by selected category; if no category selected, show all items
- Search bar: always visible at top; searches title + description client-side against CachedCatalog; clears category selection when non-empty
- Each content card: thumbnail (or type placeholder), title, type badge (VIDEO / PDF), updated badge if applicable (D60: only on downloaded items)
- Tap card → Library Detail (E6)
- "Updated" badge: compare `DownloadRecord.version` vs `CachedCatalog.items[id].version`; show badge only if item has a DownloadRecord with lower version
- Empty states: no items in category, no search results
- Network status chip visible

---

### Step 02-E6E7 — Write screens E6/E7: Library Detail + Standalone Video Player

**Status:** `[x]`

**Instructions:**
Append to `ux-specs/02-detailed-ux-spec.md` specs for E6 and E7.

Key facts:
- E6 (Library Detail): shows content item metadata — thumbnail/placeholder, title, description (full), type badge, category list, interest tags, file size, duration (if video), "Updated" badge (if downloaded and version mismatch)
- E6 actions: "Play Video" button (→ E7) OR "Open PDF" button (→ E8); Download button (same states as Reels overlay); Like/Save buttons (same behaviour as Reels overlay)
- E7 (Standalone Video Player): same HTML5 `<video>` component as Reels but WITHOUT swipe navigation (no adjacent videos); shows play/pause, progress bar, mute, back button; bottom tab bar hidden during playback (optional — UQ2 recommends hidden); no overlay with title/desc (metadata shown in E6 before opening)
- Both E6 and E7 work offline if item is in proxy cache (downloaded or previously accessed)

---

### Step 02-E8 — Write screen E8: PDF Viewer

**Status:** `[x]`

**Instructions:**
Append to `ux-specs/02-detailed-ux-spec.md` the full spec for E8.

Key facts:
- PDF fetched via `fetch("/api/content/{id}/file?v={version}")` → ArrayBuffer → PDF.js renderer
- Renders in `<canvas>` elements, page by page
- Navigation: "Previous page" / "Next page" buttons; page indicator "3 / 12"
- Download button: same states as other screens
- Back button: returns to Library Detail (E6) or Downloads (E9)
- Loading state: PDF.js loading spinner
- Error state: if fetch fails and file not in proxy cache
- Offline: works if file is in proxy cache (previously accessed or downloaded)
- No in-document text search (OOS per MVP Spec OOS-11)
- No pinch-to-zoom (OOS); PDF.js default scale only
- PDF is not accessible from Reels (D19 — PDFs library-only)

---

### Step 02-E9 — Write screen E9: Downloads Tab

**Status:** `[x]`

**Instructions:**
Append to `ux-specs/02-detailed-ux-spec.md` the full spec for E9.

Key facts:
- Lists all DownloadRecord entries from IndexedDB, sorted by `downloadedAt` descending
- Each row: thumbnail/placeholder, title, type badge, file size, download date, "Updated" badge (if `catalog.version > record.version`)
- Tap video row → Video Player (E7-style standalone)
- Tap PDF row → PDF Viewer (E8)
- Delete button (swipe-to-reveal or trash icon): confirmation dialog → removes DownloadRecord from IndexedDB (proxy cache retains file; no SPA-side file deletion)
- Works fully offline: DownloadRecord is local; files served from proxy cache; network status chip may show "Offline"
- Empty state: "No downloads yet. Download videos and PDFs from the Library or while browsing Reels."
- Orphan cleanup: after catalog sync, if a DownloadRecord.contentId is not in CachedCatalog, remove the record and show a toast "Some downloaded items were removed from the catalog"

---

### Step 02-E10 — Write screen E10: Change Interests (sheet)

**Status:** `[x]`

**Priority note:** Should priority (de-scope lever #6). Mark clearly in the spec.

**Instructions:**
Append to `ux-specs/02-detailed-ux-spec.md` the full spec for E10.

Key facts:
- Bottom sheet opening from Reels header (gear icon or "Edit interests" link)
- Reuses Interest Selection layout (same chip grid)
- Pre-selects chips from `DeviceProfile.selectedInterestIds`
- On Save: update `DeviceProfile.selectedInterestIds` in IndexedDB → sheet closes → Reels feed re-filters immediately
- Dismiss (tap outside or X): no changes saved
- At least 1 interest must remain selected to save (same rule as onboarding)

---

### Step 02-ADMIN-HEADER — Add admin section header to `02-detailed-ux-spec.md`

**Status:** `[x]`

**Instructions:**
Append to `ux-specs/02-detailed-ux-spec.md`:

```markdown
---

## Surface B — Admin Portal

---
```

---

### Step 02-A1 — Write screen A1: Admin Login

**Status:** `[x]`

**Instructions:**
Append to `ux-specs/02-detailed-ux-spec.md` the full spec for A1.

Key facts:
- Shown when no valid JWT in sessionStorage
- Single password field + "Login" button
- POST to `/api/admin/login` with `{ password }` → JWT stored in sessionStorage
- On success: navigate to Content List (A2)
- On failure (401): inline error "Incorrect password"
- No "remember me", no username field
- Tab close = sessionStorage cleared = next open shows login screen again
- Token expiry (8h): on any admin API call returning 401, redirect to login screen with toast "Session expired, please log in again"

---

### Step 02-A2 — Write screen A2: Admin Content List

**Status:** `[x]`

**Instructions:**
Append to `ux-specs/02-detailed-ux-spec.md` the full spec for A2.

Key facts:
- Table of all content items from `GET /api/admin/content`
- Columns: thumbnail, title, type badge, categories, interests, file size, duration (video only), version, last updated
- Sort: by `createdAt` descending (default); sortable by title, type, updatedAt
- Filter bar: by type (All / Video / PDF)
- Row actions: Edit (→ A4), Delete (confirmation dialog → `DELETE /api/admin/content/:id` → row removed)
- "Upload Content" button (top right) → A3
- Delete confirmation: "This will permanently remove the content item and its file. Downloads on edge devices will show an 'outdated' state after next sync."
- Empty state: "No content yet. Upload your first item."
- Loading skeleton while API response is pending

---

### Step 02-A3 — Write screen A3: Upload Content

**Status:** `[x]`

**Instructions:**
Append to `ux-specs/02-detailed-ux-spec.md` the full spec for A3.

Key facts:
- Form fields: file picker (MP4 or PDF, ≤100MB), title (required, ≤255 chars), description (optional textarea), category multi-select (from categories list), interest multi-select (from interests list)
- Content type auto-detected from file MIME; no explicit type selector (UQ6)
- File picker: drag-and-drop zone + "Browse" button; shows selected filename + size after selection
- Client-side pre-validation: wrong MIME type → inline error before upload; file > 100MB → inline error
- Upload progress bar shown during `POST /api/admin/content` (multipart)
- On success: toast "Content uploaded successfully" → navigate back to Content List (A2)
- On server validation error (400/415/413): inline error per field
- Cancel button → back to A2 with no changes
- Video duration validation: if server returns 400 for duration > 3 min, show "Video exceeds 3-minute limit"

---

### Step 02-A4 — Write screen A4: Edit Content

**Status:** `[x]`

**Instructions:**
Append to `ux-specs/02-detailed-ux-spec.md` the full spec for A4.

Key facts:
- Same form layout as A3, pre-filled from `GET /api/admin/content/:id`
- Additional section: "Replace File" — separate file picker that sends `PUT /api/admin/content/:id/file`; increments version; edge devices see "Updated" badge after next sync
- Additional section: "Replace Thumbnail" — image file picker (JPEG/PNG/WebP, ≤5MB); sends `PUT /api/admin/content/:id/thumbnail`
- Metadata changes: `PUT /api/admin/content/:id` (JSON body — does NOT replace file)
- "Save Changes" button: only sends changed fields
- Replace file and metadata can be saved independently (separate buttons/sections)
- On save success: toast "Changes saved" → stay on A4 or return to A2 (either is fine)
- Back / Cancel: return to A2

---

### Step 02-A5 — Write screen A5: Category Management

**Status:** `[ ]`

**Instructions:**
Append to `ux-specs/02-detailed-ux-spec.md` the full spec for A5.

Key facts:
- Full-page 2-level tree view
- Top-level categories: displayed as section headers with "Add child" and "Delete" and "Rename" actions
- Child categories: indented rows with "Delete" and "Rename" and up/down reorder arrows (UQ5: no drag-and-drop)
- "Add top-level category" button at top
- Create: inline name input that appears in-place; Enter to save, Escape to cancel
- Rename: click name → becomes inline input; Enter to save, Escape to cancel
- Delete: confirmation dialog warns "This will also delete all child categories and remove their associations from content items. Content items will not be deleted."
- Reorder (child only): up/down arrows change `sortOrder`; sends `PUT /api/admin/categories/:id` with new `sortOrder`
- Cannot add children to a child category (max 2 levels enforced — "Add child" button hidden on child rows)
- Empty state: "No categories yet. Add your first category."

---

### Step 02-A6 — Write screen A6: Interest Management

**Status:** `[ ]`

**Instructions:**
Append to `ux-specs/02-detailed-ux-spec.md` the full spec for A6.

Key facts:
- Flat list of all interests from `GET /api/admin/interests`
- Each row: interest name + "Rename" action + "Delete" action
- "Add Interest" button at top: inline name input in a new row; Enter to save, Escape to cancel
- Rename: click name → becomes inline input; Enter = `PUT /api/admin/interests/:id`; Escape = cancel
- Delete: confirmation dialog "This will remove the interest tag from all associated content items. Edge devices will update after next sync." → `DELETE /api/admin/interests/:id`
- 409 Conflict on duplicate name → inline error "This interest name already exists"
- Empty state: "No interests yet. Add your first interest tag."

---

### Step 03 — Write `03-component-inventory.md`

**Status:** `[ ]`

**Instructions:**
Write `ux-specs/03-component-inventory.md` from scratch.

Include all reusable components identified across both surfaces. For each component:
- **Name** and file path hint (e.g., `components/VideoPlayer`)
- **Purpose**
- **Used on** (list of screens)
- **Props / inputs**
- **States**
- **Rules / constraints**

Components to cover (at minimum):
- `BottomTabBar` (Edge)
- `NetworkStatusChip` (Edge)
- `VideoPlayer` (Edge — used in Reels and Library/Downloads; mode prop distinguishes)
- `ReelsFeed` / `ReelSlide` (Edge)
- `ContentOverlay` (Edge — overlaid on video in Reels)
- `LikeButton` / `SaveButton` (Edge)
- `DownloadButton` (Edge — 3 states: default / downloading / downloaded)
- `TypeBadge` (Edge + Admin)
- `UpdatedBadge` (Edge)
- `ContentCard` (Edge — Library + Downloads)
- `CategoryTree` (Edge Library + Admin)
- `PDFViewer` (Edge)
- `EmptyState` (Edge — parameterised)
- `ConfirmationDialog` (Admin)
- `Toast` (Admin)
- `UploadProgressBar` (Admin)
- `FormField` (Admin — wraps input with label + error)
- `ContentForm` (Admin — shared by Upload and Edit)

---

### Step FINAL — Update PLAN.md status block to ALL DONE

**Status:** `[ ]`

**Instructions:**
Update the status block at the top of this file to:
```
Total steps : 16
Done        : 16
In progress : 0
Remaining   : 0
```
And add a line: `All steps complete. UX spec is ready.`
