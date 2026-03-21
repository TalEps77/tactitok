# Component Inventory — TactiTok

> **Version:** 0.1
> **Status:** Draft
> **Created:** 2026-03-21
> **Depends on:** `01-ux-planning.md`, `02-detailed-ux-spec.md`

This document enumerates every reusable UI component across both surfaces of the TactiTok MVP. Each entry specifies the component's path hint, purpose, the screens it appears on, its key props, its visual/functional states, and any behavioural rules or constraints. The inventory is the authoritative reference for the front-end build; it must remain consistent with `02-detailed-ux-spec.md`.

Components are grouped by surface. Truly shared components (used on both surfaces) are listed last.

---

## Edge SPA Components

---

### BottomTabBar

- **Path hint:** `packages/client/src/components/BottomTabBar/BottomTabBar.tsx`
- **Purpose:** Persistent bottom navigation bar providing access to the three main tabs of the Edge SPA. Conveys the active tab through visual highlight. Hidden during full-screen video playback.
- **Used on:** E2 (Reels Feed), E3 (Reels Content Overlay, behind), E5 (Library View), E6 (Library Detail), E9 (Downloads Tab). Hidden on: E1 (onboarding gate), E4 (Reels video player — full-screen), E7 (standalone video player), E8 (PDF Viewer), E10 (handled by parent sheet).
- **Props / inputs:**
  - `activeTab: 'reels' | 'library' | 'downloads'` — which tab is currently highlighted
  - `onTabChange: (tab) => void` — callback on tab press
- **States:**
  - `reels-active` — Reels icon and label highlighted; Library and Downloads at rest
  - `library-active` — Library icon and label highlighted
  - `downloads-active` — Downloads icon and label highlighted
  - `hidden` — rendered off-screen (`display: none` or unmounted) during full-screen video; controlled by parent route
- **Rules / constraints:**
  - Height is exposed as the CSS variable `--tab-bar-height`; all slide and overlay calculations must reference this variable rather than a hardcoded value.
  - Each tab icon + label combination must meet the 44×44 CSS px minimum touch target.
  - The bar sits in normal document flow (not `position: fixed`) so the scroll container above it can use `calc(100dvh - var(--tab-bar-height))` reliably.
  - No badge counts in MVP (continuation item for unread notifications).

---

### NetworkStatusChip

- **Path hint:** `packages/client/src/components/NetworkStatusChip/NetworkStatusChip.tsx`
- **Purpose:** Indicates to the user when the device cannot reach the cloud backend. Polls `/api/health` on a configurable interval; shows an "Offline" pill when the endpoint fails. Hidden when the device is online to minimise visual clutter.
- **Used on:** E2 (Reels Feed), E5 (Library View), E6 (Library Detail), E8 (PDF Viewer), E9 (Downloads Tab). Not shown on E1 (error state handled inline on that screen).
- **Props / inputs:**
  - `pollIntervalMs?: number` — default `30000` (30 s); how often to re-check `/api/health`
- **States:**
  - `online` — component is `display: none` (no visible UI element)
  - `offline` — small pill with icon and "Offline" label visible at fixed top-right position (`position: fixed; top: 12px; right: 12px; z-index: <above video, below action buttons>`)
  - `checking` — internal only; no distinct UI in MVP (remains in previous visual state during the check)
- **Rules / constraints:**
  - Uses `fetch('/api/health', { cache: 'no-store' })` to bypass browser cache on each poll.
  - Transitions from `online` → `offline` on the first failed poll; transitions back to `online` on the first successful poll.
  - Must not overlap the right-side action button stack in the Reels overlay. Ensure `top` offset places it above the action stack's topmost button, or accept a short overlap with sufficient `z-index` ordering.
  - Polling is paused when the document is hidden (`visibilitychange` event) and resumed on focus.

---

### VideoPlayer

- **Path hint:** `packages/client/src/components/VideoPlayer/VideoPlayer.tsx`
- **Purpose:** Renders a single HTML5 `<video>` element with playback controls, mute state, and a progress bar. A `mode` prop switches between Reels mode (swipe navigation, prefetch, no standalone controls) and Standalone mode (no swipe, full controls, tab bar interaction deferred to parent).
- **Used on:** E4 (Reels mode), E7 (Standalone mode), E9 → E7 path (Standalone mode).
- **Props / inputs:**
  - `contentId: string` — used to construct the `src` URL
  - `version: number` — appended to `src` as `?v={version}` for cache-busting
  - `mode: 'reels' | 'standalone'` — controls which features are active
  - `autoPlay?: boolean` — default `true` in reels mode, `false` in standalone
  - `onEnded?: () => void` — callback when video reaches end
  - `prefetchNextSrc?: string` — (reels mode only) URL to prefetch for the next slide; triggers a Range-header fetch when `mode === 'reels'`
  - `muteState: boolean` — controlled mute; persisted at feed/session level, not inside this component
  - `onMuteToggle: () => void` — callback to lift mute changes to the parent
- **States:**
  - `idle` — slide off-screen; `<video>` paused, `src` may be unset
  - `buffering` — `<video>` `waiting` event; centered spinner shown
  - `playing` — video playing; spinner hidden; progress bar advancing
  - `paused` — user-paused; play icon briefly shown
  - `autoplay-blocked` — browser rejected autoplay; "Tap to play" prompt shown
  - `error` — `<video>` `error` event; error message shown ("This video is unavailable offline")
  - `muted` — audio silent; mute icon in active state
- **Rules / constraints:**
  - `playsinline` and `webkit-playsinline` attributes always set.
  - `preload="auto"` set to allow proxy-side range-request buffering.
  - In `reels` mode: progress bar is read-only (no seek). In `standalone` mode: seek by tapping/scrubbing the progress bar is a Should priority; de-scope if time-constrained.
  - The `<video>` element must be paused before unmount to prevent audio-continuation bugs on Chrome.
  - IntersectionObserver drives play/pause transitions in reels mode; not used in standalone mode.
  - Prefetch in reels mode: when this slide becomes current, issue `fetch(prefetchNextSrc, { headers: { Range: 'bytes=0-' } })` to warm the proxy cache. Do not store the response in the SPA.

---

### ReelsFeed

- **Path hint:** `packages/client/src/components/ReelsFeed/ReelsFeed.tsx`
- **Purpose:** Vertical snap-scroll container that drives the full-screen Reels experience. Manages slide windowing (renders at most prev / current / next slide), owns IntersectionObserver-based play/pause, and hosts one `VideoPlayer` + `ContentOverlay` pair per visible slide.
- **Used on:** E2 (Reels Feed screen — this component is the screen body).
- **Props / inputs:**
  - `videos: ContentItemDTO[]` — ordered filtered list from the `useReelsFeed` hook; filtering logic lives outside this component
  - `onEndOfFeed?: () => void` — called when user tries to advance past the last slide
- **States:**
  - `loading` — `videos` prop not yet available; full-screen spinner shown
  - `empty` — `videos.length === 0`; `EmptyState` component rendered
  - `active` — `videos.length > 0`; slides rendered; first video auto-plays
  - `end-of-feed` — user at last slide and swipes forward; an end-of-feed message slide appended
- **Rules / constraints:**
  - Windowing: only the previous, current, and next slide are mounted in the DOM at any time. Slides outside this window are unmounted (with video paused first).
  - Scroll-snap implementation: `overflow-y: scroll; scroll-snap-type: y mandatory` on the container; each slide child has `scroll-snap-align: start; height: calc(100dvh - var(--tab-bar-height))`.
  - Swiper.js is an accepted alternative if native scroll-snap proves unreliable on the target device (MR2, MR5).
  - Navigation arrows (prev/next chevrons on the right edge) are rendered inside this component and trigger programmatic scroll/slide changes.
  - On tab re-focus, scroll position resets to the first video and the first video auto-plays.

---

### ContentOverlay

- **Path hint:** `packages/client/src/components/ContentOverlay/ContentOverlay.tsx`
- **Purpose:** Renders the metadata and action buttons positioned absolutely over the currently playing video in Reels mode. Contains the title, description (with expand/collapse), `TypeBadge`, `LikeButton`, `SaveButton`, and `DownloadButton`. Auto-hides after 3 seconds of inactivity.
- **Used on:** E3 (rendered inside each slide of E2/E4; not a separate screen).
- **Props / inputs:**
  - `item: ContentItemDTO` — content metadata (title, description, type, id, version)
- **States:**
  - `visible` — all elements shown; triggered on mount and on tap-to-reveal
  - `hidden` — `opacity: 0; pointer-events: none`; triggered 3 s after last interaction
  - `description-expanded` — full description text shown; scrim behind text intensified
  - `description-collapsed` — description clamped to 2 lines
- **Rules / constraints:**
  - `position: absolute; inset: 0` within the slide. Does not affect tab bar position.
  - A bottom gradient scrim (`background: linear-gradient(transparent, rgba(0,0,0,0.6))`) ensures text legibility on bright video frames.
  - The inactivity timer must be cleared on any pointer event within the overlay boundary, and also when the slide scrolls out of view (to prevent ghost timeouts on re-used component instances).
  - `pointer-events: none` when hidden so invisible buttons do not block video tap events.
  - Contains one `TypeBadge` (always "VIDEO" — PDFs are never in the Reels feed, per D19).
  - The right-side button stack order is: Like → Save → Download (top to bottom).
  - If the download fetch fails, the `DownloadButton` reverts to its default state and briefly shows an error indicator; the overlay itself does not enter an error state.

---

### LikeButton

- **Path hint:** `packages/client/src/components/LikeButton/LikeButton.tsx`
- **Purpose:** Toggles and displays the user's "liked" state for a content item. Reads and writes `LocalAction { action: 'like' }` in IndexedDB. Provides immediate visual feedback with no network request.
- **Used on:** E3 (Reels overlay), E6 (Library Detail).
- **Props / inputs:**
  - `contentId: string` — used as the IndexedDB key for the `LocalAction` record
- **States:**
  - `inactive` — outline heart icon; no `LocalAction` record with `active: true` for this item
  - `active` — filled heart icon; `LocalAction { action: 'like', active: true }` exists in IndexedDB
  - `loading` — brief transitional state on mount while IndexedDB read resolves (use last-known value or a neutral icon to avoid flicker)
- **Rules / constraints:**
  - On tap when inactive: write `LocalAction { contentId, action: 'like', active: true, timestamp: now() }` to IndexedDB using an upsert (update if record exists, create if not).
  - On tap when active: update the record to `active: false`.
  - Debounce rapid taps; only the final state after debounce is persisted.
  - Minimum 44×44 CSS px touch target.
  - No network request in MVP; Like is local-only.

---

### SaveButton

- **Path hint:** `packages/client/src/components/SaveButton/SaveButton.tsx`
- **Purpose:** Toggles and displays the user's "saved" state for a content item. Reads and writes `LocalAction { action: 'save' }` in IndexedDB. Write-only in MVP — there is no Saved items view (D61).
- **Used on:** E3 (Reels overlay), E6 (Library Detail).
- **Props / inputs:**
  - `contentId: string` — IndexedDB key
- **States:**
  - `inactive` — outline bookmark icon
  - `active` — filled bookmark icon
  - `loading` — brief transitional state on mount during IndexedDB read
- **Rules / constraints:**
  - Identical persistence logic to `LikeButton` with `action: 'save'`.
  - The saved state has no visible downstream effect in MVP (D61). The filled bookmark is the sole feedback.
  - Minimum 44×44 CSS px touch target.
  - De-scope lever: if Like/Save are cut together (de-scope lever #2), both this component and `LikeButton` are removed from the overlay.

---

### DownloadButton

- **Path hint:** `packages/client/src/components/DownloadButton/DownloadButton.tsx`
- **Purpose:** Initiates a full-file download of a content item and persists a `DownloadRecord` to IndexedDB on completion. Shows one of three visual states: default (downloadable), downloading (in progress), downloaded (complete, disabled).
- **Used on:** E3 (Reels overlay), E6 (Library Detail), E8 (PDF Viewer).
- **Props / inputs:**
  - `contentId: string`
  - `version: number` — used to construct the fetch URL and populate `DownloadRecord.version`
  - `fileUrl: string` — full URL to fetch (`/api/content/{id}/file?v={version}`)
- **States:**
  - `default` — download icon; enabled; no `DownloadRecord` exists in IndexedDB for this item
  - `downloading` — spinner; `pointer-events: none`; fetch in flight
  - `downloaded` — checkmark icon; `disabled`; `DownloadRecord` exists in IndexedDB
  - `error` — download icon with brief red tint (3 s), then reverts to `default`; fetch failed, no record written
- **Rules / constraints:**
  - On mount: read `DownloadRecord { contentId }` from IndexedDB. If found → `downloaded` state. If not → `default` state.
  - On tap in `default` state: enter `downloading` state; issue `fetch(fileUrl)` with no Range header (full file); on resolve: write `DownloadRecord { contentId, version, downloadedAt, fileSizeBytes }` to IndexedDB; enter `downloaded` state. On reject: enter `error` state for 3 s then revert to `default`.
  - The `downloading` state disables the button to prevent duplicate concurrent fetches.
  - No progress percentage in MVP (spinner only); continuation item to add streaming progress via `ReadableStream` + `Content-Length`.
  - Minimum 44×44 CSS px touch target.

---

### TypeBadge

- **Path hint:** `packages/client/src/components/TypeBadge/TypeBadge.tsx`
- **Purpose:** Small pill badge that displays the content type ("VIDEO" or "PDF") with a colour-coded background. Provides a quick visual scan cue on cards and overlays.
- **Used on:** E3 (Reels overlay), E5 (Library content cards), E6 (Library Detail), E9 (Downloads list), A2 (Admin Content List — same component or a styled equivalent).
- **Props / inputs:**
  - `type: 'video' | 'pdf'`
- **States:**
  - `video` — "VIDEO" label; distinct colour (e.g., blue or accent colour)
  - `pdf` — "PDF" label; distinct colour (e.g., red or secondary colour)
- **Rules / constraints:**
  - Colours must provide sufficient contrast against both dark (overlay/card) and light (admin table) backgrounds, or separate colour tokens should be applied per surface.
  - Not interactive; `pointer-events: none`.
  - In the Reels overlay (E3), the badge is always "VIDEO" because PDFs are excluded from the Reels feed (D19). The component itself does not enforce this — the parent controls the `type` prop.

---

### UpdatedBadge

- **Path hint:** `packages/client/src/components/UpdatedBadge/UpdatedBadge.tsx`
- **Purpose:** Small indicator (dot or "Updated" pill) shown on content items where the locally downloaded version is older than the current catalog version. Alerts the user that a newer file is available.
- **Used on:** E5 (Library content cards — only for downloaded items), E6 (Library Detail — only if item is downloaded), E9 (Downloads list).
- **Props / inputs:**
  - `isOutdated: boolean` — parent computes `DownloadRecord.version < CachedCatalog.items[id].version`; badge renders only when `true`
- **States:**
  - `visible` — dot or "Updated" pill displayed
  - `hidden` — `isOutdated === false`; renders nothing (`null`)
- **Rules / constraints:**
  - Visibility logic lives in the parent component, not here. `UpdatedBadge` is purely presentational.
  - Per D60: the "Updated" badge is only relevant when a `DownloadRecord` exists for the item. Items that have never been downloaded should never receive this badge regardless of catalog version.
  - Not interactive.

---

### ContentCard

- **Path hint:** `packages/client/src/components/ContentCard/ContentCard.tsx`
- **Purpose:** Reusable card for displaying a content item summary in a list. Used in both the Library content list and the Downloads tab. Shows a thumbnail (or placeholder), title, `TypeBadge`, `UpdatedBadge`, and a metadata line (file size, duration for video, download date in Downloads context).
- **Used on:** E5 (Library content list), E9 (Downloads Tab).
- **Props / inputs:**
  - `item: ContentItemDTO` — content metadata
  - `downloadRecord?: DownloadRecord` — if present, enables `UpdatedBadge` check and shows download-date metadata line
  - `onPress: () => void` — tap handler; parent navigates to E6 or E8 as appropriate
- **States:**
  - `default` — thumbnail loaded; title + badges + metadata visible
  - `thumbnail-error` — thumbnail fetch failed; type-specific placeholder icon shown (e.g., film-frame for video, document for PDF)
  - `updated` — `UpdatedBadge` visible alongside `TypeBadge`
- **Rules / constraints:**
  - Thumbnail image loaded from `ContentItemDTO.thumbnailUrl`; fallback to placeholder on error.
  - Minimum touch target for the entire card: 44 CSS px tall (cards are typically taller than this by design).
  - In E9 context, a delete affordance (swipe-to-reveal trash icon or explicit trash button) is provided by the parent list, not by this component.
  - `UpdatedBadge` is shown only when `downloadRecord` prop is provided and `downloadRecord.version < item.version`.

---

### InterestPicker

- **Path hint:** `packages/client/src/components/InterestPicker/InterestPicker.tsx`
- **Purpose:** Wrapping chip grid for interest selection. Shared between the E1 onboarding screen and the E10 Change Interests sheet. Manages multi-select chip state; enforces a minimum of 1 selection.
- **Used on:** E1 (Interest Selection — full screen), E10 (Change Interests sheet).
- **Props / inputs:**
  - `interests: InterestDTO[]` — list of available interests to display as chips
  - `initialSelected: string[]` — array of interest IDs pre-selected on mount (empty for E1 first run; current selection for E10)
  - `onChange: (selectedIds: string[]) => void` — called whenever selection changes; parent owns the final write to IndexedDB
  - `minSelection?: number` — default `1`; parent CTA button should remain disabled until this threshold is met
- **States:**
  - `chip-unselected` — chip at rest; outline style
  - `chip-selected` — chip highlighted; filled background with contrasting text
  - `below-minimum` — `selectedIds.length < minSelection`; no distinct chip state, but the parent CTA ("Continue" / "Save") remains disabled
- **Rules / constraints:**
  - Chip grid uses wrapping flex layout (`flex-wrap: wrap`); chips reflow naturally between portrait and landscape — no fixed column count.
  - Each chip must be ≥ 44px tall and have ≥ 16px horizontal padding.
  - The chip grid area must be scrollable if the list overflows the viewport.
  - This component does not write to IndexedDB; it only calls `onChange`. The parent (E1 or E10) performs the write.
  - De-selecting the last chip is allowed at the component level; the CTA button (controlled by the parent) becomes disabled.

---

### CategoryTree

- **Path hint:** `packages/client/src/components/CategoryTree/CategoryTree.tsx`
- **Purpose:** Two-level expandable tree for browsing and selecting category hierarchy. Behaviour differs by surface: in the Edge SPA (E5), the tree is read-only and selection triggers content filtering. In the Admin Portal (A5), the tree is fully editable with CRUD actions on each node.
- **Used on:** E5 (Library View — read-only, filter mode), A5 (Category Management — editable CRUD mode).
- **Props / inputs:**
  - `categories: CategoryDTO[]` — flat list of categories with `parentId` field; component builds the tree internally
  - `mode: 'filter' | 'edit'`
  - `selectedCategoryId?: string` — (filter mode) currently selected category; controls highlight
  - `onSelect?: (categoryId: string | null) => void` — (filter mode) called on tap; `null` means "show all"
  - `onCreateCategory?: (name: string, parentId?: string) => void` — (edit mode)
  - `onRenameCategory?: (id: string, name: string) => void` — (edit mode)
  - `onDeleteCategory?: (id: string) => void` — (edit mode)
  - `onReorderCategory?: (id: string, direction: 'up' | 'down') => void` — (edit mode; child nodes only)
- **States:**
  - `parent-collapsed` — child list hidden; expand chevron pointing right
  - `parent-expanded` — child list visible; chevron pointing down
  - `child-selected` (filter mode) — highlighted to indicate active filter
  - `child-editing` (edit mode) — inline name input shown; Enter saves, Escape cancels
  - `parent-editing` (edit mode) — same inline input pattern for parent nodes
- **Rules / constraints:**
  - Maximum depth is 2 levels. "Add child" action is hidden on child-level rows in edit mode.
  - In edit mode, "Delete" on a parent node triggers `ConfirmationDialog` with the warning: "This will also delete all child categories and remove their associations from content items. Content items will not be deleted."
  - In edit mode, reorder arrows (up/down) are shown only on child nodes; parent node order is not adjustable in MVP (UQ5).
  - In filter mode, tapping a parent node that has no children selects it directly as a filter. Tapping an expandable parent only expands/collapses the tree; it does not set a filter.
  - In filter mode, tapping the already-selected category deselects it (shows all items).

---

### PDFViewer

- **Path hint:** `packages/client/src/components/PDFViewer/PDFViewer.tsx`
- **Purpose:** Renders a PDF document using PDF.js. Fetches the file as an `ArrayBuffer`, renders pages into `<canvas>` elements, and provides page navigation controls.
- **Used on:** E8 (PDF Viewer screen), E9 (Downloads Tab → PDF path, same component).
- **Props / inputs:**
  - `fileUrl: string` — URL to fetch (`/api/content/{id}/file?v={version}`)
  - `contentId: string` — passed through to `DownloadButton`
  - `version: number` — passed through to `DownloadButton`
- **States:**
  - `loading` — `fetch` in flight or PDF.js rendering first page; spinner shown
  - `ready` — page rendered; navigation controls visible; page indicator shows "N / Total"
  - `error` — `fetch` failed and file not in proxy cache; error message shown ("This document is unavailable offline")
- **Rules / constraints:**
  - Fetch method: `fetch(fileUrl) → response.arrayBuffer() → pdfjsLib.getDocument({ data: arrayBuffer })`.
  - Navigation: "Previous page" and "Next page" buttons; "Previous" disabled on page 1; "Next" disabled on last page.
  - Page indicator: `"{currentPage} / {totalPages}"` — always visible.
  - No in-document text search (OOS-11).
  - No pinch-to-zoom (OOS); PDF.js default scale only. Future: add zoom buttons.
  - Offline: works if the file is in the proxy cache (previously accessed or explicitly downloaded).
  - Includes a `DownloadButton` for the current document (same component and states as other surfaces).
  - Back button navigates to the originating screen (E6 or E9); the component does not own navigation — the parent screen provides a back affordance.

---

### EmptyState

- **Path hint:** `packages/client/src/components/EmptyState/EmptyState.tsx`
- **Purpose:** Parameterised placeholder displayed when a list or feed has no items to show. Accepts an icon, heading, body text, and an optional CTA button so each screen can provide contextually appropriate messaging.
- **Used on:** E2 (Reels Feed — no videos matching interests), E5 (Library — no items in selected category; no search results), E9 (Downloads — no downloads yet), any other screen with a potentially empty list.
- **Props / inputs:**
  - `icon: ReactNode` — illustration or icon to display centred at top
  - `heading: string` — primary message (e.g., "Nothing to watch yet")
  - `body: string` — secondary explanatory text
  - `cta?: { label: string; onPress: () => void }` — optional action button (e.g., "Edit Interests")
- **States:**
  - `with-cta` — icon + heading + body + enabled button
  - `without-cta` — icon + heading + body only
- **Rules / constraints:**
  - Centred vertically and horizontally within its container.
  - The `cta` button must meet the 44×44 CSS px minimum touch target.
  - This component has no loading state — callers must ensure it is only rendered after data has been fetched and confirmed empty.
  - Icon is a presentational slot; callers pass an SVG or image appropriate for the context.

---

## Admin Portal Components

---

### SideNav

- **Path hint:** `packages/admin/src/components/SideNav/SideNav.tsx`
- **Purpose:** Persistent left-side navigation panel for the Admin Portal. Links to the three main sections: Content, Categories, and Interests. Highlights the active route.
- **Used on:** A2 (Content List), A3 (Upload Content), A4 (Edit Content), A5 (Category Management), A6 (Interest Management). Not shown on A1 (Login).
- **Props / inputs:**
  - `activeSection: 'content' | 'categories' | 'interests'` — drives the active-state highlight
- **States:**
  - `content-active` — Content link highlighted; Categories and Interests at rest
  - `categories-active` — Categories link highlighted
  - `interests-active` — Interests link highlighted
- **Rules / constraints:**
  - Rendered as a fixed-width left panel on desktop. No collapsed/mobile variant in MVP (Admin Portal is desktop-only).
  - Each nav link must show an icon + label.
  - Clicking a link navigates to the corresponding route; the `activeSection` prop is derived from the current route by the parent router, not managed internally.
  - The Admin Portal has no auth guard inside `SideNav`; auth is a router-level concern.

---

### ConfirmationDialog

- **Path hint:** `packages/admin/src/components/ConfirmationDialog/ConfirmationDialog.tsx`
- **Purpose:** Modal dialog used before all destructive actions (delete content item, delete category, delete interest). Presents a title, a body describing consequences, and Cancel + Confirm buttons. The Confirm button uses a destructive colour (red) to signal danger.
- **Used on:** A2 (delete content item), A5 (delete category or parent category), A6 (delete interest).
- **Props / inputs:**
  - `isOpen: boolean`
  - `title: string`
  - `body: string` — describes the consequence of the action
  - `confirmLabel?: string` — default `"Delete"`
  - `onConfirm: () => void`
  - `onCancel: () => void`
- **States:**
  - `closed` — not rendered (or `display: none`)
  - `open` — modal overlay visible; background page inert
  - `confirming` — Confirm button in loading/disabled state while the API call is in flight (prevents double-submit)
- **Rules / constraints:**
  - Background overlay (`backdrop`) dims the page and sets `pointer-events: none` on all content behind the dialog.
  - Pressing Escape calls `onCancel`.
  - Clicking the backdrop calls `onCancel`.
  - The Confirm button must be visually distinct (red / destructive colour token) so the action is not accidentally triggered.
  - Dialog width: fixed narrow (e.g., 400–480 px) centred in the viewport. Does not stretch to full width.
  - After `onConfirm` resolves, the parent is responsible for closing the dialog (sets `isOpen: false`). The dialog does not auto-close.

---

### Toast

- **Path hint:** `packages/admin/src/components/Toast/Toast.tsx`
- **Purpose:** Non-blocking notification shown after mutations (save, upload complete, delete, session expiry). Success toasts auto-dismiss after 3 seconds. Error toasts persist until the user manually dismisses them.
- **Used on:** A2 (delete success/error), A3 (upload success/error), A4 (save success/error), A1 (session-expired message on redirect).
- **Props / inputs:**
  - `type: 'success' | 'error'`
  - `message: string`
  - `onDismiss: () => void`
- **States:**
  - `visible-success` — shown at top or bottom of viewport; auto-dismiss timer running (3 s)
  - `visible-error` — shown with a close (×) button; no auto-dismiss
  - `dismissed` — unmounted or `display: none`
- **Rules / constraints:**
  - Positioned `fixed` at top-right (or top-centre) of the viewport, above all other content.
  - Multiple toasts may stack if multiple mutations fire in quick succession; each has its own dismiss timer. A maximum of 3 simultaneous toasts is recommended; older ones are dismissed to make room.
  - `onDismiss` is called both by the auto-dismiss timer (success) and by the manual close button (error).
  - The close button must be ≥ 44×44 CSS px touch target even on desktop (future mobile admin is a continuation item).

---

### UploadProgressBar

- **Path hint:** `packages/admin/src/components/UploadProgressBar/UploadProgressBar.tsx`
- **Purpose:** Visual indicator of file upload progress during multipart `POST /api/admin/content` and `PUT /api/admin/content/:id/file` requests. Shown below the file picker zone during an active upload.
- **Used on:** A3 (Upload Content), A4 (Edit Content — Replace File section).
- **Props / inputs:**
  - `progress: number | null` — `null` for indeterminate; `0–100` for determinate percentage when `Content-Length` is available
  - `isVisible: boolean`
- **States:**
  - `hidden` — `isVisible === false`; not rendered
  - `indeterminate` — animated pulsing or striped bar; `progress === null`
  - `determinate` — filled bar at `progress%`; label shows percentage
  - `complete` — bar at 100%; typically replaced immediately by success `Toast` and navigation back to Content List
- **Rules / constraints:**
  - Bar width transitions smoothly using CSS `transition: width 0.3s ease`.
  - If the server does not return `Content-Length` in the upload response, the bar remains indeterminate for the full upload duration.
  - The parent form must disable the submit button while upload is in flight; `UploadProgressBar` does not own that logic.
  - On upload error, the bar is hidden and an error `Toast` is shown by the parent.

---

### FormField

- **Path hint:** `packages/admin/src/components/FormField/FormField.tsx`
- **Purpose:** Wraps a form input (text input, textarea, or custom control) with a label and an inline error message. Provides consistent label positioning, error styling, and accessibility attributes (`aria-describedby`, `htmlFor`).
- **Used on:** A1 (Login — password field), A3 (Upload Content — title, description fields), A4 (Edit Content — same fields), A5 (Category Management — inline rename inputs use the same pattern), A6 (Interest Management — same).
- **Props / inputs:**
  - `label: string`
  - `error?: string` — if present and non-empty, renders below the input in error colour
  - `required?: boolean` — adds asterisk to label
  - `children: ReactNode` — the actual `<input>`, `<textarea>`, or custom control
- **States:**
  - `default` — label + input; no error message visible
  - `error` — label + input with red/error border + error message below
- **Rules / constraints:**
  - Error message is shown on blur or on form submit attempt, not while the user is typing (standard UX pattern for forms).
  - The `error` prop controls visibility; the parent (form component or submit handler) passes the error string.
  - `htmlFor` on `<label>` must match `id` on the inner input for accessibility; the component should accept an `id` prop or auto-generate one.
  - Does not own validation logic — validation is performed by the parent form component or a form library (e.g., React Hook Form).

---

### ContentForm

- **Path hint:** `packages/admin/src/components/ContentForm/ContentForm.tsx`
- **Purpose:** Shared form body used by both A3 (Upload Content) and A4 (Edit Content). Contains the file picker drop zone, title field, description field, category multi-select, and interest multi-select. A4 additionally renders "Replace File" and "Replace Thumbnail" sections, controlled by props.
- **Used on:** A3 (Upload Content — creation mode), A4 (Edit Content — edit mode).
- **Props / inputs:**
  - `mode: 'create' | 'edit'`
  - `initialValues?: ContentFormValues` — pre-filled values in edit mode
  - `categories: CategoryDTO[]`
  - `interests: InterestDTO[]`
  - `onSubmit: (values: ContentFormValues) => void`
  - `onCancel: () => void`
  - `isSubmitting: boolean` — disables form and submit button while API call is in flight
- **States:**
  - `idle` — form ready for input
  - `file-selected` — file picker shows filename and size; MIME type validated client-side
  - `file-invalid` — wrong MIME type or size exceeds 100 MB; inline error on the file picker zone
  - `submitting` — `isSubmitting === true`; all fields and buttons disabled; `UploadProgressBar` visible (parent passes progress)
  - `server-error` — submit returned 400/415/413; per-field errors passed back via `errors` prop
- **Rules / constraints:**
  - File picker: drag-and-drop zone with "Browse" button fallback. Accepted MIME types: `video/mp4`, `application/pdf`.
  - Client-side pre-validation: file > 100 MB → inline error before upload; wrong MIME type → inline error; neither triggers an API call.
  - Content type is auto-detected from the selected file's MIME type; no explicit type selector (UQ6 resolution).
  - Category and interest multi-selects use checkboxes or a multi-select component; must support selecting zero or more values (no minimum enforced in the form itself).
  - In edit mode (`mode === 'edit'`), the main file picker zone is for the primary metadata save (`PUT /api/admin/content/:id`). "Replace File" and "Replace Thumbnail" are separate sub-sections with independent submit buttons, not part of the main `onSubmit` flow — the parent A4 screen manages these as separate form regions.
  - The component does not own API calls; it delegates to the `onSubmit` callback.

---

## Shared Components (used on both surfaces)

---

### InterestPicker (shared)

`InterestPicker` is documented under Edge SPA Components above. It is considered a shared component because:
- It ships in `packages/client` (Edge SPA) for E1 and E10.
- The Admin Portal (A6) does not reuse this exact component (A6 uses a flat list with inline edit, not a chip grid), but if the Admin Portal ever adds an interest-selection chip grid, this component should be extracted to a shared package.

In MVP: `InterestPicker` lives in the Edge SPA package only.

---

### TypeBadge (shared)

`TypeBadge` is documented under Edge SPA Components above. It is used on both surfaces:
- Edge SPA: E3, E5, E6, E9 (as described).
- Admin Portal: A2 (Content List table — same visual pill in the Type column).

Implementation options:
1. Extract to a shared package (`packages/shared/src/components/TypeBadge`) consumed by both `packages/client` and `packages/admin`. Preferred for long-term maintainability.
2. Duplicate the simple component in each package. Acceptable in MVP if a shared package adds build complexity.

Decision should be recorded in `notes/decisions.md`.

---

## Assumptions

- Component path hints use a `packages/client` / `packages/admin` monorepo structure consistent with `04_system-architecture.md`. Adjust paths if the repo layout differs.
- All IndexedDB interactions go through a service layer (e.g., `src/services/db.ts`); components call the service, not `idb` directly. This keeps components testable without an IndexedDB environment.
- `ContentItemDTO` and `DownloadRecord` shapes are defined in `05_data-model.md` and `06_api-contract.md`. These are the single source of truth for prop types; component interfaces must derive from them, not diverge.
- `CategoryDTO` and `InterestDTO` are simple `{ id: string; name: string; parentId?: string; sortOrder?: number }` shapes as per the data model.

## Risks

- `VideoPlayer` mode-switching via a single `mode` prop may accumulate conditional logic over time. Consider splitting into `ReelsVideoPlayer` and `StandaloneVideoPlayer` sub-variants if the divergence grows.
- `CategoryTree` rendering both `filter` and `edit` modes in a single component creates coupling between two surfaces. If admin and Edge SPA evolution diverges, splitting into `CategoryFilterTree` and `CategoryEditorTree` (sharing a common base) may be cleaner.
- `ContentForm` in `edit` mode with three independent submit paths (metadata, file replace, thumbnail replace) is complex. Ensure clear visual separation between the sections in the UI design so users do not accidentally submit the wrong action.

## Open Questions

- Should `TypeBadge` be extracted to a shared package immediately, or duplicated in MVP and extracted later? Record the decision.
- Should `VideoPlayer` expose a `seekable` prop to explicitly enable/disable seek interaction, rather than inferring it from `mode`? This would make the behaviour more explicit.
- `ConfirmationDialog` is listed under Admin Portal — should it also be used on the Edge SPA for the Downloads delete action (E9)? Currently E9 uses a simpler swipe-to-reveal pattern; a dialog could replace it for consistency.

## De-scope Levers

- Remove `LikeButton` and `SaveButton` together (de-scope lever #2 from MVP Spec §13): remove both from `ContentOverlay` and `LibraryDetail`. `LocalAction` IndexedDB store is also removed.
- Remove `InterestPicker` and `BottomTabBar.reels` interest-filtering (de-scope lever #3): `InterestPicker` is removed; E1 and E10 are removed; `ReelsFeed` shows all videos.
- Remove E10 Change Interests (de-scope lever #6): `InterestPicker` remains for E1 only; the gear icon entry point is removed from the Reels header.

## Continuation Notes

- `LikeButton` and `SaveButton` will require a sync layer when server-side like/save counts are added. Design the IndexedDB schema with a `synced: boolean` flag from the start.
- `DownloadButton` should eventually support resumable downloads (Range-request chunking) and a download queue to prevent connection saturation. The current single-fetch model is MVP-only.
- `PDFViewer` is a candidate for a zoom control (pinch or +/- buttons) as a near-term continuation feature. Leave the scale state internal to the component so it can be wired up without API changes.
- Extract `TypeBadge` to a shared package before the Admin Portal build begins to avoid divergence.
