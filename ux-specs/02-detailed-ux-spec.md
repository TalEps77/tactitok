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

### E1 — Interest Selection

**Purpose:** Gate screen shown once on first app open. Forces the user to select at least one interest before entering the main app. Ensures `DeviceProfile.selectedInterestIds` is populated before the Reels feed attempts to filter content.

**Entry points:**
- App open when `DeviceProfile.selectedInterestIds` is empty (or `DeviceProfile` does not exist in IndexedDB).
- There is no navigation path into E1 after onboarding is complete. Interests are changed later via E10 (Should priority).

---

#### States

| State | Trigger | UI |
|-------|---------|----|
| **Loading** | App opens; `GET /api/catalog` is in flight | Full-screen centered spinner or skeleton chip grid; "Continue" button disabled |
| **Ready** | Catalog fetched and stored in `CachedCatalog`; interests list available | Chip grid rendered; zero chips selected; "Continue" button disabled |
| **Selection active** | User has selected ≥ 1 chip | Selected chip(s) highlighted; "Continue" button enabled |
| **Error — catalog unavailable** | `GET /api/catalog` fails (network unreachable) and `CachedCatalog` does not exist in IndexedDB | Error message shown; retry button shown; chip grid and "Continue" button hidden |

---

#### Layout

Target: 10" tablet, portrait and landscape.

```
┌─────────────────────────────────────────────────┐
│                                                 │
│            [App logo / wordmark]                │
│                                                 │
│    "Choose your interests"                      │
│    "Select the topics you want to see"          │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │  [Chip] [Chip] [Chip] [Chip]             │   │
│  │  [Chip] [Chip] [Chip]                    │   │
│  │  [Chip] [Chip] [Chip] [Chip]             │   │
│  │  ... (wrapping chip grid, scrollable)    │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│              [ Continue → ]                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

- **Header area:** App logo/wordmark centered at top. Below: primary heading ("Choose your interests") and a short subtitle.
- **Chip grid:** Wrapping flex/grid layout. Each chip displays the interest `name`. Chips reflow naturally between portrait and landscape — no fixed columns.
- **Chip size:** Each chip must meet the 44×44 CSS px minimum touch target. Chips use padding to achieve this; label text is inside. Recommended chip height: 44px; horizontal padding: 16px each side.
- **Chip grid area is scrollable** if the list of interests overflows the viewport (unlikely at MVP scale but must not clip).
- **"Continue" button:** Full-width or centered CTA, pinned near the bottom of the screen (not inside the scroll area). Disabled until ≥ 1 chip is selected.
- **No back button.** This is a gate, not a navigable destination.
- **No bottom tab bar.** Tab bar is only shown inside the main app.
- **Network status chip:** Not shown on this screen (tab bar and main chrome are absent; the error state handles connectivity problems inline).

**Landscape adjustment:** Chip grid and CTA fit side by side or stack in a narrower centred column (max-width ~640px centred). No layout change required beyond natural reflowing.

---

#### Actions

| Action | Trigger | Outcome |
|--------|---------|---------|
| **Select chip** | Tap an unselected interest chip | Chip transitions to selected state (filled background, contrasting text). `selectedCount` increments. If `selectedCount` was 0, "Continue" button becomes enabled. |
| **Deselect chip** | Tap a selected interest chip | Chip transitions to unselected state. `selectedCount` decrements. If `selectedCount` reaches 0, "Continue" button becomes disabled. |
| **Tap "Continue"** | Tap enabled "Continue" button | Write `selectedInterestIds` (array of selected interest IDs) to `DeviceProfile` in IndexedDB. Navigate to Reels Feed (Tab 1 / E2). No loading indicator needed (IndexedDB write is synchronous-equivalent). |
| **Tap "Retry"** | Tap retry button in error state | Re-attempt `GET /api/catalog` via proxy. UI returns to Loading state. On success: transition to Ready state. On failure: remain in error state. |

---

#### Validation / Constraints

- **Minimum selection:** At least 1 interest must be selected. "Continue" is `disabled` (not just visually muted) until this condition is met.
- **Maximum selection:** No limit imposed in the UI. All available interests may be selected.
- **Interest list source:** Rendered from `CachedCatalog.interests[]` stored in IndexedDB after a successful `GET /api/catalog`. The SPA must not render a partial or hardcoded list.
- **Write target:** On "Continue", write `{ selectedInterestIds: string[] }` into `DeviceProfile` in IndexedDB. The `deviceId` field in `DeviceProfile` must also be populated (generate UUID on first write if not already present).
- **Skip condition:** If `DeviceProfile` exists and `selectedInterestIds.length > 0` on app open, skip E1 entirely and navigate directly to the Reels Feed (E2). This check must happen before any UI is rendered to the user (router-level guard, not a visible redirect).

---

#### Edge cases

| Scenario | Behaviour |
|----------|-----------|
| **Catalog fetch fails, nothing cached** | Show error state: message ("Could not load interests. Check your connection and try again.") + "Retry" button. The user cannot proceed. "Continue" and chip grid are hidden. |
| **Catalog fetch fails, but `CachedCatalog` exists from a prior session** | This scenario cannot occur on genuine first open (E1 is only shown when `DeviceProfile.selectedInterestIds` is empty, which implies first open; a prior `CachedCatalog` would not exist). If it somehow exists, use the cached catalog to render chips and continue normally. |
| **`CachedCatalog.interests` is an empty array** | Show an error-style message: "No interests have been set up yet. Contact your administrator." "Continue" button remains disabled. User cannot proceed. |
| **User force-refreshes page mid-selection** | Selection state is lost (held in React state only). On reload, if `DeviceProfile.selectedInterestIds` is still empty, E1 is shown again in Ready state. Catalog re-fetched. |
| **Slow catalog fetch (>3s)** | Loading state persists. No timeout enforced in MVP. Spinner remains visible until success or explicit network error (browser `fetch` rejection). |
| **User clears browser data after onboarding** | `DeviceProfile` and `CachedCatalog` are both wiped. On next open, E1 is shown again as if first run. |
| **Interest list is very long (>30 items)** | Chip grid scrolls. "Continue" button remains pinned outside the scroll area so it is always reachable without scrolling. |

---

**Assumptions:**
- `GET /api/catalog` is the single endpoint that returns both `interests[]` and `items[]`. The SPA stores the full response as `CachedCatalog` and reads `interests` from it.
- IndexedDB writes complete before navigation is triggered (no async gap between write and route change).
- The SPA router guard runs before any screen component mounts, ensuring E1 is never shown to a returning user.

**Risks:**
- Chrome may cache a prior failed fetch response; ensure the retry bypasses any browser cache with `{ cache: 'no-store' }`.
- If `DeviceProfile` write fails (IndexedDB quota or corruption), the app will re-show E1 on next open. This is acceptable in MVP.

**Open questions:**
- Should the number of selected interests be shown as a counter in the "Continue" button label (e.g., "Continue with 3 interests")? Recommended default: no counter; keep button label static.

**De-scope lever:** If interest selection is cut (de-scope lever #3 in MVP Spec §13), this screen is removed entirely and the app navigates directly to the Reels Feed on first open. All CAP-1.4, CAP-1.5, and CAP-2.5 functionality is dropped together.

**Continuation notes:** E10 (Change Interests sheet) reuses this chip grid layout. Extract the chip grid and selection logic into a shared `InterestPicker` component from the start to avoid duplication.

---

### E2 — Reels Feed

**Purpose:** The primary content surface. Presents a vertically scrollable, full-screen video feed filtered by the user's selected interests. Each "slide" contains one video and its associated overlay (E3) and player (E4). This is Tab 1, the default view after onboarding.

**Entry points:**
- App open when `DeviceProfile.selectedInterestIds` is non-empty (standard entry after onboarding).
- User taps the Reels tab in the bottom tab bar from any other tab.
- Automatic redirect from E1 after "Continue" is tapped.

---

#### States

| State | Trigger | UI |
|-------|---------|----|
| **Loading** | Catalog not yet available (first open or mid-sync) | Full-screen spinner centered; no slides rendered; tab bar visible |
| **Ready — videos available** | `filteredVideos.length > 0` | Feed renders; first video mounts and auto-plays (or shows "Tap to play" if autoplay blocked) |
| **Empty — no matching videos** | Filtered list is empty (interests set but no video matches) | Centered empty state illustration + heading + body + "Edit Interests" link |
| **Offline — metadata only** | `GET /api/health` fails; `CachedCatalog` present | Feed still renders from cached metadata; individual videos may succeed (proxy cache hit) or fail (proxy cache miss) per E4 states; network chip shows "Offline" |
| **End of feed** | User swipes past the last video | Bottom slide shows "You've seen everything. Check back after the next sync." message instead of a video |

---

#### Layout

Target: 10" tablet, portrait and landscape. The feed must fill `100dvh` × `100dvw`.

```
┌─────────────────────────────────────────┐
│ [Network chip — top right, if offline]  │
│                                         │
│                                         │
│      [Video player — fills screen]      │
│         (E4 renders here)               │
│                                         │
│      [Content overlay — above tab bar]  │
│         (E3 renders here)               │
│                                         │
│─────────────────────────────────────────│
│  [Reels]     [Library]    [Downloads]   │  ← Tab bar (semi-transparent, always visible)
└─────────────────────────────────────────┘
```

**Scroll container:**
- A single `div` with `overflow-y: scroll` and `scroll-snap-type: y mandatory`.
- Each slide child has `scroll-snap-align: start` and `height: 100dvh`.
- Alternative: Swiper.js in `direction: 'vertical'` mode with `slidesPerView: 1`.

**Scroll-snap vs. Swiper.js tradeoff:**

| Factor | CSS scroll-snap | Swiper.js |
|--------|----------------|-----------|
| Bundle size | Zero (native CSS) | ~50 KB gzipped |
| Touch swipe reliability | Good on modern Chrome | Excellent; battle-tested on tablet |
| Programmatic control (jump to slide) | Limited (`scrollTo`) | Full API (`slideTo`, events) |
| Prefetch trigger | Must use IntersectionObserver manually | Can use `onSlideChange` callback |
| Recommendation | Preferred if swipe proves reliable in testing (MR2) | Use if CSS snap has gesture issues on target tablet |

**Bottom tab bar:** Always visible; sits in normal document flow below the scroll container. The scroll container height is `calc(100dvh - {tab bar height})` so videos fill the space above the tab bar. The overlay (E3) is positioned absolutely within each slide, above the tab bar but below the top of the viewport.

**Network status chip:** Fixed position, top-right, `z-index` above video but below overlay action buttons. Hidden when online; shows "Offline" badge when `GET /api/health` fails.

---

#### Data / Filtering Logic

```
source     : CachedCatalog.items (from IndexedDB)
filter     : item.type === 'video'
             AND (DeviceProfile.selectedInterestIds.length === 0
                  OR item.interestIds.some(id => DeviceProfile.selectedInterestIds.includes(id)))
sort       : item.updatedAt descending (newest first)
output     : filteredVideos[]  — ordered list fed to the slide renderer
```

- Re-evaluated on every catalog sync and on `DeviceProfile` change (E10 save).
- If `selectedInterestIds` is empty (not expected post-onboarding, but defensive): show all videos.

---

#### Actions

| Action | Trigger | Outcome |
|--------|---------|---------|
| **Auto-advance to next slide** | Swipe up (touch) | Scroll container snaps to next slide; current video pauses; next video plays |
| **Return to previous slide** | Swipe down (touch) | Scroll container snaps to previous slide; current video pauses; previous video resumes |
| **Arrow fallback — next** | Tap down-chevron button (right edge) | Same as swipe up |
| **Arrow fallback — previous** | Tap up-chevron button (right edge) | Same as swipe down |
| **Tap video area** | Single tap on video (when overlay visible) | Toggle play/pause |
| **Tap video area** | Single tap on video (when overlay hidden) | Show overlay; no play/pause change |
| **Navigate to Library** | Tap Library tab | Navigate to E5; Reels feed state preserved (scroll position lost) |
| **Navigate to Downloads** | Tap Downloads tab | Navigate to E9; Reels feed state preserved (scroll position lost) |
| **Tap "Edit Interests"** | Tap link in empty state | Open E10 (Change Interests sheet) |

---

#### Validation / Constraints

- The scroll container must contain at least three slides in the DOM at any time: previous, current, and next (virtual windowing). Slides outside this window may be unmounted to prevent excessive DOM nodes and `<video>` element accumulation.
- Each `<video>` element must be paused before its slide is unmounted; failing to do so causes audio continuation bugs on Chrome.
- Scroll-snap must work with the tab bar visible; `100dvh` minus tab bar height gives the available slide height. Use `calc(100dvh - var(--tab-bar-height))` consistently.
- The network status chip must not overlap the overlay action buttons (E3 right-side stack). Position chip at top-right with sufficient margin.

---

#### Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| **Only one video in filtered feed** | Single slide rendered; swipe up shows end-of-feed message; swipe down has no effect |
| **User changes interests (E10) while on feed** | `filteredVideos` is recomputed; feed re-renders from first video in new list; scroll position resets to top |
| **Catalog sync arrives while user is scrolling** | Update `CachedCatalog` in IndexedDB silently; do not re-render feed mid-scroll; re-filter on next mount or tab switch |
| **All interests deselected (should not occur post-onboarding, but defensive)** | Show all videos (same as if `selectedInterestIds` is empty) |
| **Feed has exactly zero slides after filtering** | Show empty state (see States table above) |
| **User returns to Reels tab after visiting another tab** | Feed re-mounts; scroll position resets to first video; first video auto-plays |

---

**Assumptions:**
- `CachedCatalog` is always populated before E2 mounts (the catalog sync on app open + E1 gate ensures this).
- The tab bar height is a CSS variable (`--tab-bar-height`) set globally; all slide height calculations reference it.
- Slide windowing (unmount prev/next beyond ±1) is implemented to avoid DOM / memory bloat.

**Risks:**
- CSS scroll-snap may behave inconsistently on the target tablet Chrome version. Test `scroll-snap-type: y mandatory` on the actual device in sprint 1 before committing to the implementation (MR2, MR5).
- Rapid swipes (flick gesture) may cause the scroll container to snap to non-adjacent slides. Test with Swiper.js as fallback if this occurs.

**Open questions:**
- UQ1: Should a dot/progress indicator on the right edge show position in feed? Recommended: no (see `00-repo-ux-discovery.md` UQ1).

**De-scope lever:** Reels feed cannot be de-scoped independently — it is the core MVP capability. If severely pressed for time, de-scope prefetch (CAP-2.4) first.

**Continuation notes:** The `ReelsFeed` component should accept a `videos: ContentItemDTO[]` prop so it can be driven by any filtered list. The filtering logic lives in a `useReelsFeed` hook, not in the component itself, enabling future recommendation engine integration by swapping the hook.

---

### E3 — Reels Content Overlay

**Purpose:** Displays metadata and action buttons for the currently playing video. Rendered as a React component positioned absolutely over E4 (the video player). Not a separate route. Auto-hides after 3 seconds of inactivity; reappears on tap.

**Entry points:**
- Automatically rendered as part of each reel slide when E2 mounts.
- Shown by default on initial slide load; auto-hides after 3s.
- Tap on video area (when overlay is hidden) re-shows the overlay.

---

#### States

| State | Trigger | UI |
|-------|---------|----|
| **Visible** | Initial load; tap on video when hidden; any interaction with overlay buttons | All overlay elements shown |
| **Hidden (auto-hide)** | 3 seconds elapse with no user interaction on this slide | Overlay fades out (CSS opacity transition); underlying video still visible |
| **Description expanded** | Tap description text | Description shows full text; all other overlay elements remain; background scrim behind text for readability |
| **Description collapsed** | Tap again on description, or overlay auto-hides | Description returns to 2-line truncation |
| **Download in progress** | Download button tapped; fetch in flight | Download button shows spinner; other buttons remain interactive |
| **Download complete** | Full file fetch resolves; DownloadRecord written | Download button shows checkmark; disabled |

---

#### Layout

Positioned absolutely within its slide (`position: absolute; inset: 0`). Does not affect tab bar position.

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │  ← Video fills behind
│                                         │
│                                  [♥]    │  ← Like button (right stack)
│                                  [🔖]   │  ← Save button
│                                  [⬇]    │  ← Download button
│                                         │
│  [VIDEO badge]                          │  ← Type badge (bottom-left)
│  Title text (1–2 lines, truncated)      │  ← Title (bottom-left, above desc)
│  Description (2 lines, truncated)       │  ← Description (bottom-left)
│  "...more"                              │  ← Expand affordance (if truncated)
│─────────────────────────────────────────│
│  [Tab bar — below overlay, not covered] │
└─────────────────────────────────────────┘
```

**Bottom-left text block:**
- Anchored above the tab bar with bottom padding (`padding-bottom: calc(var(--tab-bar-height) + 16px)`).
- Type badge: small pill, always "VIDEO" (PDFs never appear in Reels — GAP-3 / D19).
- Title: `font-size` large; `overflow: hidden; -webkit-line-clamp: 2; display: -webkit-box; -webkit-box-orient: vertical`.
- Description: `overflow: hidden; -webkit-line-clamp: 2; display: -webkit-box` when collapsed; no clamp when expanded.
- "...more" tap target: inline button appended after truncated text, or overlay on the description block.

**Right-side action stack:**
- Vertically stacked buttons anchored to bottom-right, above tab bar.
- Minimum touch target: 44×44 CSS px per button.
- Order top to bottom: Like → Save → Download.
- Each button: circular or square container with icon + optional label below (icon + count label is a continuation feature; MVP shows icon only).

**Scrim:** A gradient overlay (transparent at top, semi-opaque dark at bottom) sits between the video and the text content to ensure legibility on bright video frames.

---

#### Actions

| Action | Trigger | Outcome |
|--------|---------|---------|
| **Auto-hide** | 3s inactivity timer | Overlay fades to `opacity: 0`; pointer events disabled |
| **Show overlay** | Tap on video when overlay hidden | Overlay fades to `opacity: 1`; inactivity timer resets |
| **Reset inactivity timer** | Any tap within the overlay | 3s timer restarts from zero |
| **Tap Like (inactive)** | Tap unfilled heart icon | Write `LocalAction { contentId, action: 'like', active: true, timestamp: now() }` to IndexedDB; heart icon fills; no navigation |
| **Tap Like (active)** | Tap filled heart icon | Update `LocalAction { ..., active: false, timestamp: now() }`; heart icon unfills; no navigation |
| **Tap Save (inactive)** | Tap unfilled bookmark icon | Write `LocalAction { contentId, action: 'save', active: true, timestamp: now() }` to IndexedDB; bookmark fills; no navigation; does NOT add to Downloads (D61) |
| **Tap Save (active)** | Tap filled bookmark icon | Update `LocalAction { ..., active: false, timestamp: now() }`; bookmark unfills; no navigation |
| **Tap Download (default state)** | Tap download icon | Button enters "downloading" state (spinner, `pointer-events: none`); initiate `fetch("/api/content/{id}/file?v={version}")` (full file, no Range header); on resolve: write DownloadRecord to IndexedDB; button enters "downloaded" state (checkmark, disabled) |
| **Tap Download (downloaded state)** | Tap checkmark (disabled) | No effect |
| **Tap description (collapsed)** | Tap description text | Expand to full description text |
| **Tap description (expanded)** | Tap again | Collapse back to 2-line truncation |

---

#### Button State Logic

**Like button:**
- On mount: read `LocalAction { contentId, action: 'like' }` from IndexedDB.
- If record exists and `active === true` → filled heart.
- If record does not exist or `active === false` → outline heart.
- State is per-content-item; changes when slide changes.

**Save button:**
- Same pattern as Like, with `action: 'save'`.
- Note: Save is write-only in MVP (D61). There is no "Saved" tab or view. The button state change is the only feedback.

**Download button:**
- On mount: read `DownloadRecord { contentId }` from IndexedDB.
- If record exists → "downloaded" state (checkmark, disabled).
- If record does not exist → "default" state (download icon, enabled).
- During fetch: "downloading" state (spinner, disabled).
- These three states map to the shared `DownloadButton` component states documented in `01-ux-planning.md` §5.1.

---

#### Validation / Constraints

- The overlay `z-index` must sit above the `<video>` element but below browser UI and the network status chip.
- The inactivity timer must be cancelled and reset on any pointer event within the overlay boundary.
- The inactivity timer must be cancelled when the slide scrolls out of view (prevents a ghost timeout triggering on a re-used slide component).
- If the download fetch fails (network error), the button must return to "default" state and show an inline error indicator (e.g., icon changes to an error state for 3s then reverts to default).
- `pointer-events: none` on the hidden overlay is required to prevent invisible tap targets blocking the video beneath.

---

#### Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| **Download fetch fails mid-way** | Button returns to default (download icon); short error indicator shown (e.g., red tint on button for 3s); DownloadRecord is NOT written |
| **User taps Download while already downloading** | Button is `disabled` during download; tap has no effect |
| **IndexedDB read fails on mount** | Default to inactive states for Like/Save and "default" state for Download; log error; do not crash |
| **Description is shorter than 2 lines** | No "...more" affordance; tap on description does nothing |
| **Title is longer than 2 lines** | Title clamped at 2 lines; no expand affordance for title (description only) |
| **Slide changes while description is expanded** | New slide mounts a fresh overlay instance; description defaults to collapsed on the new slide |
| **User taps Save repeatedly in quick succession** | Debounce or queue IndexedDB writes; final state reflects last tap; no duplicate records (keyed by contentId + action) |

---

**Assumptions:**
- Each reel slide renders its own `ContentOverlay` instance. Overlay state (expanded description, download in-flight) does not persist between slides.
- `LocalAction` reads on mount are fast enough (IndexedDB `get` by composite key) that there is no visible flash of incorrect state. If flash is observed, a loading micro-state can be added.
- The `fetch` for download does not need progress reporting within the button in MVP (spinner only, no percentage). A future enhancement could read the `Content-Length` and `ReadableStream` to show bytes downloaded.

**Risks:**
- The full-file download `fetch` holds a connection open for the entire file duration. On weak network, this may time out or fail. The error state in the Download button covers this, but the UX is not ideal. A resumable download (using Range requests + multiple fetches) is a continuation item.
- Simultaneously downloading multiple videos (if user scrolls quickly and taps Download on each) could saturate the connection. MVP does not throttle concurrent downloads; add a download queue in continuation.

**Open questions:**
- Should the Like/Save buttons show a count label below the icon (e.g., "24 Likes")? Not in MVP — counts are local-only and would be meaningless. Add when server-side sync is available.

**De-scope lever:** If Like/Save are cut (de-scope lever #2), remove both buttons from the right stack. Download button is Must and stays. The overlay layout narrows by two slots.

**Continuation notes:** Extract `LikeButton`, `SaveButton`, and `DownloadButton` as independent, reusable components with a `contentId` prop. Each manages its own IndexedDB reads/writes internally. This allows them to be used on E6 (Library Detail) without prop-drilling.

---

### E4 — Video Player (Reels Mode)

**Purpose:** Renders a single full-screen HTML5 `<video>` element within a reel slide. Handles auto-play on scroll into view, play/pause on tap, mute state, progress display, and video prefetch for the next slide. This is not a separate route — it is a component within each slide in E2.

**Entry points:**
- Mounted as part of each reel slide by the E2 feed container.
- There is no direct navigation to E4; it always appears as part of a slide.

---

#### States

| State | Trigger | UI |
|-------|---------|----|
| **Idle (off-screen)** | Slide is not the current slide (IntersectionObserver: `intersectionRatio < threshold`) | `<video>` is paused; `src` may or may not be set (depends on windowing) |
| **Loading / Buffering** | Slide is current; video `src` set; `<video>` `waiting` event fires | Buffering spinner centered over video; E3 overlay still visible |
| **Playing** | `<video>` `playing` event fires; IntersectionObserver confirms in view | Video plays; spinner hidden; progress bar advances |
| **Paused (user action)** | User taps video area while overlay is visible | Video paused; play icon briefly shown; overlay visible |
| **Autoplay blocked** | Chrome rejects autoplay (no prior user gesture) | "Tap to play" prompt centered over video; tap = call `video.play()` → enters Playing state |
| **Error — video unavailable** | `<video>` `error` event; proxy cache miss + network offline | Error indicator centered over video ("This video is unavailable offline"); E3 overlay still shows metadata and buttons |
| **Muted** | User taps mute button; or persistent mute state from prior session | Audio silent; mute icon shows active state |
| **Unmuted** | User taps mute button when muted | Audio plays; mute icon shows inactive state |

---

#### Layout

The `<video>` element fills the slide exactly. All controls and indicators are positioned absolutely within the slide.

```
┌─────────────────────────────────────────┐
│ [🔇 Mute button — top right or top left]│
│                                         │
│                                         │
│          [<video> fills slide]          │
│                                         │
│        [Buffering spinner, centered]    │
│    (shown only when video is waiting)   │
│                                         │
│  [⌃ Up arrow — right edge, semi-trans] │  ← Previous video fallback
│  [⌄ Down arrow — right edge]           │  ← Next video fallback
│                                         │
│  [E3 overlay — rendered above video]   │
│─────────────────────────────────────────│  ← Progress bar (thin, above tab bar)
│  [████████░░░░░░░░░░░░░░░░░░░░░░░░░]   │  ← 2–4px tall progress bar
│─────────────────────────────────────────│
│  [Tab bar]                              │
└─────────────────────────────────────────┘
```

**`<video>` element attributes:**
```html
<video
  src="/api/content/{id}/file?v={version}"
  playsinline
  webkit-playsinline
  loop={false}
  muted={muteState}
  preload="auto"
/>
```
- `playsinline` is required to prevent Chrome on iOS from opening the native full-screen player (not relevant for Chrome on Windows, but included for safety).
- `preload="auto"` allows the browser to buffer the video; the proxy serves range requests transparently.
- `src` URL is constructed from `ContentItemDTO.id` and `ContentItemDTO.version` (cache-busting as per API §6.2).

**Mute button:**
- Fixed position within the slide at top-right (or top-left — choose one corner and document it).
- Persists mute state across slides within the session using React context or a module-level variable (not IndexedDB; session-only).
- Icon: speaker with wave (unmuted) / speaker with X (muted). Minimum 44×44 px touch target.

**Progress bar:**
- `position: absolute; bottom: 0; left: 0; right: 0; height: 3px`.
- Rendered below the E3 overlay content but above the tab bar.
- `width` driven by `video.currentTime / video.duration * 100%`, updated on the `<video>` `timeupdate` event.
- No seek interaction in Reels mode (tapping the bar does nothing). Seek is a continuation item.

**Arrow fallback buttons:**
- Semi-transparent chevron buttons on the right edge of the slide.
- Shown briefly (e.g., 3s) on first load of the feed, then fade out.
- Re-appear when overlay is shown (user taps screen).
- Clicking invokes the same scroll-snap / Swiper navigation as a swipe gesture.
- Minimum 44×44 px touch target; visually larger (e.g., 44×80 px) for easier reach.

**Buffering spinner:**
- Centered absolutely over the video.
- Shown when `<video>` `waiting` event fires; hidden when `playing` event fires.
- A thin loading ring or spinner; matches app design system.

---

#### Auto-play Logic

```
On slide mount:
  1. Set <video src="..."> if not already set.
  2. Register IntersectionObserver with threshold ≈ 0.8
     (video must be ≥80% in viewport to count as "current").

On IntersectionObserver callback:
  if (entry.intersectionRatio >= 0.8):
    → attempt video.play()
    → if play() rejects (DOMException: NotAllowedError):
        → show "Tap to play" prompt
  else:
    → video.pause()
```

**Chrome auto-play policy:**
- Chrome blocks `video.play()` if no user gesture has occurred in the page session.
- First video in the feed will likely require a tap on first app load.
- After the user's first gesture (tapping "Tap to play", or any button), subsequent `video.play()` calls within the session are allowed.
- The "Tap to play" prompt must be tappable; the tap event itself satisfies Chrome's gesture requirement, allowing `video.play()` to be called synchronously in the handler.

---

#### Prefetch Logic

While video N is playing, initiate a background prefetch of video N+1:

```javascript
// Triggered when video N starts playing and nextVideo is known
const prefetchNextVideo = (nextId: string, nextVersion: number) => {
  const url = `/api/content/${nextId}/file?v=${nextVersion}`;
  fetch(url, {
    method: 'GET',
    headers: { Range: 'bytes=0-{N}' },   // first ~500KB or 3s worth of video
    priority: 'low',                       // non-blocking
  }).catch(() => {
    // prefetch failure is silent; video will buffer normally when user swipes
  });
};
```

- `{N}` is a configurable constant. Recommended starting value: `bytes=0-524287` (~500 KB). Adjust based on average video bitrate (MQ1 from MVP Spec).
- The `fetch` result is not consumed by the SPA — it exists solely to warm the edge proxy cache. The proxy caches the partial response; when the `<video>` element requests the same URL, it gets a cache hit.
- Risk CR1 from API Contract: nginx may not cache responses to Range requests by default. Verify the proxy configuration caches partial responses, or use a full-file prefetch (`bytes=0-` unbounded, low priority) as a fallback.
- Prefetch is cancelled implicitly when the slide component unmounts (fetch is not abortable in this simplified form; add `AbortController` if prefetch requests accumulate).

---

#### Actions

| Action | Trigger | Outcome |
|--------|---------|---------|
| **Play** | IntersectionObserver in-view; or tap "Tap to play"; or tap video while paused (overlay visible) | `video.play()` called |
| **Pause** | IntersectionObserver out-of-view; or tap video while playing (overlay visible) | `video.pause()` called |
| **Show overlay / hide overlay** | Tap video when overlay hidden / 3s inactivity | Delegated to E3 overlay component |
| **Toggle mute** | Tap mute button | `muteState` toggled; `video.muted` updated; icon changes |
| **Tap "Tap to play"** | Tap prompt when autoplay blocked | `video.play()` called; prompt hidden |
| **Swipe up** | Touch event on slide | E2 advances to next slide; this slide's video pauses |
| **Swipe down** | Touch event on slide | E2 returns to previous slide; this slide's video pauses |
| **Arrow button — down (next)** | Tap down-chevron | Same as swipe up |
| **Arrow button — up (previous)** | Tap up-chevron | Same as swipe down |
| **Video ends (`ended` event)** | Video plays to completion | No auto-advance; video stops at last frame; overlay remains visible; user must swipe to advance |

---

#### Validation / Constraints

- `<video>` must always have `playsinline` to prevent native full-screen takeover.
- When a slide unmounts or scrolls out of view, `video.pause()` must be called before unmount. Failing to pause causes audio bleed from off-screen videos.
- Only one `<video>` element should be playing at any given time. The IntersectionObserver pause-on-out-of-view logic enforces this.
- The mute state must be reflected on the `<video>` element's `.muted` attribute; it cannot be set via CSS or DOM directly — use React controlled state (`muted={muteState}` prop, but note `muted` is not a React-controlled attribute post-mount; use a `ref` and `video.muted = value` to update after mount).
- The progress bar update rate (`timeupdate` fires ~4× per second on Chrome) is sufficient for MVP. Do not use `requestAnimationFrame` for the progress bar — unnecessary CPU usage.

---

#### Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| **Video source unavailable (network error)** | `<video>` fires `error` event; show error indicator over video ("This video is unavailable offline"); E3 overlay still renders metadata and buttons |
| **Autoplay blocked on first video** | "Tap to play" prompt shown; no spinner (video not yet loading); tap calls `video.play()` and hides prompt |
| **Video reaches end (`ended` event)** | Video stops at last frame; no auto-advance; overlay stays visible; user swipes to go to next |
| **User swipes to a new video while current is buffering** | New slide mounts; new video starts loading; old slide's video pauses; buffering spinner may appear on new slide |
| **Mute toggled mid-prefetch** | Mute state persists for next video; prefetch URL is unaffected (audio is in the video file; not separately controlled) |
| **User rapidly swipes through many slides** | Each exiting slide calls `video.pause()`; only the final landed slide attempts `video.play()`; intermediate slides do not attempt play |
| **`video.duration` is NaN (metadata not yet loaded)** | Progress bar width is 0%; no division by zero guard needed if `0 / NaN = NaN` is handled with `|| 0` fallback |
| **Device enters low-power / background tab** | Chrome pauses all `<video>` elements automatically; `visibility` change event can be used to pause explicitly if needed |

---

**Assumptions:**
- The edge proxy correctly serves HTTP 206 partial responses for Range requests, and the `<video>` element uses these for progressive playback (CAP-4.5).
- `ContentItemDTO.version` is always available from `CachedCatalog`; the `src` URL is never constructed with an unknown version.
- Session-level mute state (not persisted to IndexedDB) is acceptable. If users expect mute preference to persist across sessions, add IndexedDB persistence in continuation.

**Risks:**
- MR1: Chrome auto-play policy. The "Tap to play" prompt is the fallback. Must be tested on the target device before sprint 2.
- MR3: Video prefetch may cause stuttering if the prefetch fetch consumes too much bandwidth. Start with a small prefetch window (500 KB) and increase if tests show it is safe.
- CR1: nginx may not cache Range request responses. If so, the prefetch will not warm the proxy cache effectively. Full-file background fetch (`fetch(url)` with no Range header, low priority) is the fallback prefetch strategy.

**Open questions:**
- MQ1 (from MVP Spec): How many seconds / bytes to prefetch for next video? Recommended default: `bytes=0-524287` (~500 KB). Adjust in sprint 1 testing.

**De-scope lever:** Prefetch (CAP-2.4) is the first item to cut from this screen if time is tight. The `<video>` element still buffers via its own mechanism; removing prefetch only affects the "instant-start" experience for the next video.

**Continuation notes:** Extract the IntersectionObserver logic into a `useVideoAutoPlay` hook. This hook takes a `videoRef` and returns `{ isPlaying, isMuted, toggleMute, tapToPlayVisible }`. It can be reused by E7 (standalone video player) with a different configuration (no adjacent-slide context).

---

### E5 — Library View

**Purpose:** Browsable, searchable content catalog. Allows the user to find any video or PDF by category or keyword. Provides the entry point to Library Detail (E6), Video Player (E7), and PDF Viewer (E8). Supports hybrid offline usage — content browsing works from the `CachedCatalog` snapshot even when the cloud is unreachable.

**Entry points:**
- User taps the Library tab in the bottom tab bar from any screen.
- There is no deep-link into E5 from outside the SPA in MVP.

---

#### States

| State | Trigger | UI |
|-------|---------|----|
| **Loading** | `CachedCatalog` not yet available in IndexedDB (first app open, catalog sync still in flight) | Full-screen centered spinner; search bar disabled; category tree and content list not rendered |
| **Ready** | `CachedCatalog` available; "All" pseudo-category selected by default | Category tree rendered; content list shows all items sorted by `updatedAt` descending |
| **Category selected** | User taps a category or child category | Content list filtered to matching items; selected category highlighted in tree |
| **Search active** | Search bar contains non-empty text | Content list filtered by search query against all items regardless of category; category tree selection visually cleared/disabled |
| **Empty category** | Selected category has no matching content items | Empty state shown in content list area: "No items in this category." |
| **No search results** | Search query returns zero matches | Empty state shown in content list area: "No results for '[query]'." |
| **Offline** | `GET /api/health` fails; cloud unreachable | Library works normally from `CachedCatalog`; network status chip shows "Offline"; no functional degradation unless catalog was never synced (falls back to Loading state with error) |

---

#### Layout

Target: 10" tablet, landscape and portrait.

**Landscape (two-panel):**

```
┌──────────────────────────────────────────────────────────────────┐
│ [Network chip — top right]                                       │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │  🔍  Search...                                               │ │  ← Full-width search bar
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────┐  ┌───────────────────────────────────────┐│
│  │  All              │  │  [Card] Title            [VIDEO] [↑]  ││
│  │                   │  │  Thumbnail  Description snippet       ││
│  │  ▶ Category A     │  │                                       ││
│  │    └ Child A1     │  │  [Card] Title            [PDF]  [↑]  ││
│  │    └ Child A2 ●   │  │  Thumbnail  Description snippet       ││
│  │                   │  │                                       ││
│  │  ▶ Category B     │  │  [Card] Title            [VIDEO]      ││
│  │    └ Child B1     │  │  ...                                  ││
│  │                   │  │                                       ││
│  │  ▶ Category C     │  │  (scrollable)                        ││
│  │  (collapsed)      │  │                                       ││
│  │                   │  └───────────────────────────────────────┘│
│  │  (scrollable)     │                                           │
│  └───────────────────┘                                           │
│  ~280px wide                                                     │
│──────────────────────────────────────────────────────────────────│
│  [Reels]          [Library ●]         [Downloads]                │  ← Tab bar
└──────────────────────────────────────────────────────────────────┘
```

- Left panel is approximately 280px wide; right panel takes the remaining width.
- `[↑]` denotes the "Updated" badge — shown only on items with a `DownloadRecord` and a version mismatch.
- `●` on a child category label indicates the currently active/selected category.

**Portrait (stacked):**

```
┌─────────────────────────────────────────┐
│ [Network chip — top right]              │
│ ┌─────────────────────────────────────┐ │
│ │  🔍  Search...                      │ │  ← Full-width search bar
│ └─────────────────────────────────────┘ │
│                                         │
│  [All] [Cat A ▸] [Cat B ▸] [Cat C ▸]  │  ← Horizontally scrollable category chips
│         [Child A1] [Child A2 ●]        │  ← Child chips revealed when parent tapped
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ [Card] Title         [PDF] [↑]  │    │
│  │ Thumbnail  Description snippet  │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ [Card] Title         [VIDEO]    │    │
│  │ Thumbnail  Description snippet  │    │
│  └─────────────────────────────────┘    │
│  (content list scrolls vertically)      │
│─────────────────────────────────────────│
│  [Reels]   [Library ●]   [Downloads]   │  ← Tab bar
└─────────────────────────────────────────┘
```

Portrait category navigation options (choose one implementation):
- **Option A — horizontal chip row (recommended):** Top-level categories as a horizontally scrollable row of chips. Tapping a top-level chip expands to show child chips in a second row below. "All" chip always first. Active selection highlighted.
- **Option B — accordion:** Top-level categories as accordion headers; tap to expand/collapse children. Content list below the accordion. More vertical space consumed but more familiar on narrow screens.

Recommended default: Option A (chip row). If the number of categories exceeds what fits in two rows without scrolling, fall back to Option B.

---

#### Category Tree Behaviour

- Build the tree client-side from `CachedCatalog.categories[]` using the `parentId` field.
- Top-level categories: `parentId === null`. Display as section headers (landscape) or chips (portrait).
- Child categories: `parentId` references a top-level category `id`.
- **"All" pseudo-category:** Not a real entity; always first. Selecting "All" shows every item in `CachedCatalog.items[]` regardless of `categoryIds`.
- **Clicking a top-level category:** Shows all items where `item.categoryIds` includes the top-level category's `id` OR includes any of its child category `id`s (union of parent + children).
- **Clicking a child category:** Shows items where `item.categoryIds` includes that child's `id` only.
- **Expand/collapse (landscape):** Top-level categories have a chevron icon; tapping the label or chevron toggles expansion to reveal children. Expanded state is session-local (React state); not persisted.
- Sort categories within each level by `CategoryDTO.sortOrder` ascending.

---

#### Search Behaviour

- Search bar is always visible at the top, full-width, above both panels/sections.
- Input fires client-side filtering on every keystroke (no debounce required for ~15 items; add debounce for 100+ items).
- **Search scope:** `CachedCatalog.items[]` — case-insensitive substring match against `item.title` and `item.description`.
- **While search query is non-empty:** category tree selection is ignored; content list shows all matching items across all categories; category tree is visually de-emphasised (greyed chips or collapsed panel) but remains interactive (user may clear search to return to it).
- **Clearing the search bar:** reverts the content list to the previously active category view (the category selection state is preserved in React state while search is active, not reset).
- Search is entirely client-side; no API call is made.

---

#### Content Card Layout

Each item in the content list is rendered as a card:

```
┌──────────────────────────────────────────────────────┐
│  [Thumbnail or type placeholder]  Title               │
│  (64×48px or similar)             [VIDEO] or [PDF]    │
│                                   File size (optional) │
│                                   [Updated ↑] (if set) │
└──────────────────────────────────────────────────────┘
```

- **Thumbnail:** If `ContentItemDTO.thumbnailUrl` is non-null, render as `<img>`. Otherwise, show a type-based placeholder icon (video camera icon for `type === 'video'`; document icon for `type === 'pdf'`).
- **Type badge:** Small pill labelled "VIDEO" or "PDF" based on `ContentItemDTO.type`.
- **File size:** Optional display (`ContentItemDTO.fileSize` formatted as KB/MB). Low priority; omit if layout is tight.
- **"Updated" badge:** Shown only when `DownloadRecord` exists for this `contentId` in IndexedDB AND `CachedCatalog.items[id].version > DownloadRecord.version`. See Updated Badge Logic section.
- **Touch target:** Full card is tappable (min height 60px); tap navigates to Library Detail (E6).

---

#### Updated Badge Logic

For each content card rendered in E5:

```
1. Read DownloadRecord from IndexedDB by contentId.
2. If DownloadRecord does not exist → do NOT show badge.
3. If DownloadRecord exists AND CachedCatalog.items[contentId].version > DownloadRecord.version → show "Updated" badge.
4. If DownloadRecord exists AND versions are equal → do NOT show badge.
```

- Badge is only meaningful on downloaded items (D60). Non-downloaded items have no version baseline to compare against.
- Badge label: "Updated" or a small coloured dot with "Updated" tooltip.
- Minimum badge size: meets 44×44 px if interactive; if purely informational (no tap action), a small visual indicator is sufficient.

---

#### Actions

| Action | Trigger | Outcome |
|--------|---------|---------|
| **Tap category (landscape — top-level)** | Tap category label in left panel | Toggle expand/collapse in tree; filter content list to items in that category and its children |
| **Tap category (landscape — child)** | Tap child label in left panel | Highlight child as active; filter content list to items with this child's `id` in `categoryIds` |
| **Tap "All" (any orientation)** | Tap "All" item/chip | Clear category selection; show all items |
| **Tap category chip (portrait — top-level)** | Tap chip in horizontal row | Show child chips in row below; filter to top-level + children items |
| **Tap category chip (portrait — child)** | Tap child chip | Highlight as active; filter content list to items with this child's `id` in `categoryIds` |
| **Type in search bar** | Keyboard input | Filter content list client-side; category selection cleared/ignored |
| **Clear search bar** | Tap × button or clear input | Remove search filter; restore previously active category view |
| **Tap content card** | Tap any card in content list | Navigate to Library Detail (E6) for that content item |
| **Tap Library tab (while on Library)** | Tap active tab | Scroll content list back to top; reset to "All" (or keep current state — implementation choice; reset recommended) |

---

#### Validation / Constraints

- Category tree must be built from `CachedCatalog.categories[]` using `parentId` — not hardcoded. If the catalog has no categories, the tree shows only the "All" pseudo-category.
- Search must search both `title` and `description` fields. Case-insensitive substring only (no regex, no fuzzy). Consistent with CAP-3.2 and Journey 3 Step 4.
- While search is active, category filtering is not applied (search result set is always uncategorised — all items that match the query). These two filter modes are mutually exclusive.
- The content list must be sorted by `updatedAt` descending at all times (both in category view and search results).
- The "Updated" badge check reads IndexedDB on every render of the content list (or on mount / catalog sync); it must not produce stale badge states after a catalog sync completes.
- Minimum touch target for all category labels/chips: 44×44 CSS px.
- Tab bar must remain visible on all Library screens (E5, E6). Hidden only in E7 (Video Player) per UQ2.
- Network status chip must be visible and positioned without overlapping interactive elements.

---

#### Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| **`CachedCatalog` not yet synced on first open** | Show Loading state (spinner). If sync completes: transition to Ready. If sync fails and no catalog exists: show error message "Library unavailable. Check your connection and try again." with a Retry button (triggers re-sync attempt). |
| **Catalog has no categories** | Category tree shows only the "All" pseudo-category. Content list shows all items when "All" is selected. |
| **Selected category is empty** | Content list shows empty state: "No items in this category." Category tree remains interactive. |
| **Search returns zero results** | Content list shows empty state: "No results for '[query]'." Search bar remains active; user can modify or clear query. |
| **`CachedCatalog.items` is empty** | "All" selected: empty state shown. "Your library is empty. Content will appear here after the next sync." |
| **Content item has no `categoryIds`** | Item does not appear in any category filter except "All". This is valid per data model (DQ3: zero categories allowed). |
| **Content item has `thumbnailUrl` that fails to load** | `<img>` `onerror` fallback: render the type-based placeholder icon instead. No visible error. |
| **DownloadRecord exists but contentId not in `CachedCatalog`** | Orphaned record. Badge logic reads `CachedCatalog.items[contentId]` → returns `undefined` → treat as no match → no badge shown. Orphan cleanup is handled by catalog sync (DR1 from Data Model). |
| **User navigates to Library while a catalog sync is in progress** | Show current (possibly stale) `CachedCatalog` data immediately; update silently when sync completes. Do not show loading spinner if a prior cached catalog exists. |
| **Orientation change mid-session** | Layout switches between two-panel (landscape) and stacked (portrait). Category selection state and search query are preserved (React state). Content list reflows. |
| **Offline on first open (no catalog ever synced)** | Loading state → sync fails → error state with Retry button. User cannot browse library. |

---

**Assumptions:**
- `CachedCatalog` is always replaced in full on sync (D34 — full catalog pull). The category tree is rebuilt from scratch on each mount or re-render after sync.
- Category tree depth is exactly 2 levels (D23). No grandchild categories exist in the data. The tree-build logic does not need to handle arbitrary depth.
- The "All" pseudo-category is a UI construct only — it has no `id` and is not stored in the data model. Its filter condition is `item.categoryIds` may contain anything (no filter applied).
- File size display is optional (Should priority per CAP-3.3). If omitted, the card is still compliant.
- The category selection state and search query are held in React component state only — not persisted to IndexedDB or the URL. Navigating away and back resets to the default "All" view.

**Risks:**
- On a low-bandwidth connection, the initial catalog sync may take several seconds; the user sees a loading spinner before any library content appears. Mitigate: show a cached catalog immediately if one exists from a prior session, and update silently.
- If the category tree has many top-level categories (>8), the portrait chip row may be hard to navigate. The accordion fallback (Option B) should be implemented as a conditional or user setting in continuation.
- The "Updated" badge requires IndexedDB reads for every content card; with ~15 items this is negligible. For 100+ items, batch-read all DownloadRecords once on mount and store in component state.

**Open questions:**
- Should the Library tab remember the user's last selected category and search query across tab switches? Recommended default: no — reset to "All" on each tab switch to keep implementation simple.
- Should items with `type === 'video'` and `type === 'pdf'` be visually separable (e.g., a type filter toggle above the content list)? CAP-3.8 ("Interest-based filtering in library") is Could priority; a type filter could be added alongside it without architecture changes. Not in scope for this spec step.

**De-scope lever:** If the category tree is cut (de-scope lever #4 — "Category tree management in admin, use seed data"), the tree is still displayed in E5 using seed data. No functional change to E5. If categories themselves are removed entirely (not a named de-scope lever), the Library becomes a flat search-only list — remove the tree panel/chips and expand the content list to full width.

**Continuation notes:** Extract `CategoryTree` as a standalone component accepting `categories: CategoryDTO[]`, `selectedId: string | null`, and `onSelect: (id: string | null) => void`. This component can be reused in the Admin Category Management screen (A5) with a different set of actions wired to the nodes. Extract `ContentCard` as a standalone component accepting `item: ContentItemDTO`, `downloadRecord: DownloadRecord | null`, and `onTap: () => void`.

---

### E6 — Library Detail / Content Item

**Purpose:** Full metadata view for a single content item. Gives the user enough context to decide whether to watch/read, download, or interact with the item before committing to full-screen playback. Primary action launches the appropriate viewer (E7 for video, E8 for PDF).

**Entry points:**
- Tap a content card in E5 (Library View) — any category or search result.
- Tap a row in E9 (Downloads Tab).
- The back button destination is determined by the entry point (E5 or E9).

---

#### States

| State | Trigger | UI |
|-------|---------|----|
| **Loading** | Item `id` is resolved from route but `CachedCatalog` is not yet ready (edge case on very first load) | Full-screen centered spinner; no metadata shown; action buttons disabled |
| **Ready** | `CachedCatalog.items[id]` is available | Full metadata displayed; all action buttons in their correct initial state |
| **Downloaded** | `DownloadRecord` exists in IndexedDB for this `contentId` | Download button shows "Downloaded" (disabled / checkmark) |
| **Downloading** | Download in progress (fetch + proxy warm-up) | Download button shows spinner / progress; other buttons remain active |
| **Updated** | `DownloadRecord` exists AND `CachedCatalog.items[id].version > DownloadRecord.version` | "Updated" badge visible alongside the version number or title area |
| **Item not found** | `contentId` not in `CachedCatalog` (deleted on server, not yet synced) | Error state: "This item is no longer available. It may have been removed." with a Back button |

---

#### Layout (Portrait)

```
┌──────────────────────────────────────────┐
│ [←] Back           [Network chip]        │  ← Header bar
├──────────────────────────────────────────┤
│                                          │
│   ┌──────────────────────────────────┐   │
│   │  Thumbnail (16:9) or placeholder │   │  ← 16:9 image, full-width
│   └──────────────────────────────────┘   │
│                                          │
│   [VIDEO] or [PDF]   [Updated ↑]         │  ← Type badge + Updated badge (if set)
│                                          │
│   Title (full, not truncated)            │  ← Body text, wraps
│                                          │
│   Description (full)                     │  ← Body text, scrollable
│                                          │
│   ─────────────────────────────────────  │
│   Categories: [Tag] [Tag]                │  ← Category name chips
│   Interests:  [Tag] [Tag]                │  ← Interest name chips
│   Size: 14.2 MB    Duration: 2:34        │  ← Metadata line (duration if video)
│   Version: 3   Updated: 12 Mar 2026      │  ← Version + updatedAt
│   ─────────────────────────────────────  │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │       ▶  Play Video              │   │  ← Primary CTA (video only)
│   └──────────────────────────────────┘   │
│    OR                                    │
│   ┌──────────────────────────────────┐   │
│   │       📄  Open PDF               │   │  ← Primary CTA (PDF only)
│   └──────────────────────────────────┘   │
│                                          │
│   [⬇ Download]   [♡ Like]   [🔖 Save]   │  ← Secondary action row
│                                          │
├──────────────────────────────────────────┤
│  [Reels]   [Library ●]   [Downloads]    │  ← Tab bar
└──────────────────────────────────────────┘
```

**Landscape adaptation:** Thumbnail on the left half (~50% width); metadata + actions in a right-side scrollable column. Tab bar at bottom (same as portrait). Primary CTA and secondary actions at the bottom of the right column.

---

#### Metadata Displayed

| Field | Source | Display rule |
|-------|--------|-------------|
| Thumbnail | `ContentItemDTO.thumbnailUrl` | Render as `<img>` at 16:9; on load error or `null` → type-based placeholder (video camera icon / document icon) |
| Title | `ContentItemDTO.title` | Full text, not truncated; wraps |
| Description | `ContentItemDTO.description` | Full text, not truncated; scrollable if long; empty string → omit the section |
| Type badge | `ContentItemDTO.type` | "VIDEO" pill or "PDF" pill |
| "Updated" badge | Derived: `DownloadRecord.version < CachedCatalog.items[id].version` | Only shown when a `DownloadRecord` exists AND version mismatch (D60) |
| Category names | `ContentItemDTO.categoryIds` → look up in `CachedCatalog.categories[]` | Rendered as small chips; empty → omit section |
| Interest names | `ContentItemDTO.interestIds` → look up in `CachedCatalog.interests[]` | Rendered as small chips; empty → omit section |
| File size | `ContentItemDTO.fileSize` | Formatted as KB or MB (e.g., "14.2 MB") |
| Duration | `ContentItemDTO.duration` | Seconds → "M:SS" format (e.g., "2:34"); only shown when `type === 'video'` AND `duration !== null`; omit for PDF |
| Version | `ContentItemDTO.version` | Displayed as "Version N" |
| Last updated | `ContentItemDTO.updatedAt` | Formatted as readable date ("12 Mar 2026") |

---

#### Actions

| Action | Trigger | Outcome |
|--------|---------|---------|
| **Play Video** | Tap "Play Video" CTA (visible when `type === 'video'`) | Navigate to E7 (Video Player — Standalone), passing `contentId` |
| **Open PDF** | Tap "Open PDF" CTA (visible when `type === 'pdf'`) | Navigate to E8 (PDF Viewer), passing `contentId` |
| **Download (default state)** | Tap Download button | Start full file fetch: `GET /api/content/{id}/file?v={version}` (triggers proxy to cache the file); write `DownloadRecord` to IndexedDB on completion; button transitions default → downloading → downloaded |
| **Download (downloading state)** | Button is in spinner/progress state | No tap action; button is disabled during active download |
| **Download (downloaded state)** | Button shows "Downloaded" | Button is disabled; tap does nothing (UQ3 resolved: show disabled "Downloaded") |
| **Like** | Tap Like button | Toggle `LocalAction { action: 'like' }` in IndexedDB; icon fills/unfills; no navigation (D61) |
| **Save** | Tap Save button | Toggle `LocalAction { action: 'save' }` in IndexedDB; icon fills/unfills; no navigation; no bookmark view (D61 — write-only in MVP) |
| **Back** | Tap ← Back button (top-left) | Navigate back to the entry screen: E5 if entered from Library; E9 if entered from Downloads |

---

#### Validation / Constraints

- "Play Video" CTA must only appear when `ContentItemDTO.type === 'video'`. Mutually exclusive with "Open PDF".
- "Open PDF" CTA must only appear when `ContentItemDTO.type === 'pdf'`. Mutually exclusive with "Play Video".
- Download button must read `DownloadRecord` from IndexedDB on mount to determine initial state. Do not rely on in-memory state alone (user may have downloaded while on another screen).
- Like/Save button initial state must be read from `LocalAction` IndexedDB store on mount.
- Duration field must only render when `type === 'video'` AND `ContentItemDTO.duration !== null`.
- The "Updated" badge requires both conditions to be true: (1) `DownloadRecord` exists AND (2) `CachedCatalog.items[id].version > DownloadRecord.version`. If the `DownloadRecord` does not exist, badge must NOT be shown even if the item has a high version number.
- All touch targets (buttons, back button): minimum 44×44 CSS px.
- Tab bar must remain visible throughout E6. It is only hidden in E7 (full-screen video).
- Network status chip must be visible and not overlap interactive elements.

---

#### Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| **Item deleted from server between catalog syncs** | `contentId` is in route but not in `CachedCatalog.items`. Show "Item not found" error state with Back button. |
| **Thumbnail URL returns 404 or network error** | `<img>` `onerror` fires; fallback to type-based placeholder icon. No visible error message. |
| **Download fails mid-fetch** | Button returns to default state; show a non-blocking toast "Download failed. Please try again." Do not write a partial DownloadRecord. |
| **User taps "Play Video" while offline** | Navigate to E7. If the file is in the proxy cache (downloaded or previously accessed), playback works. If not in cache, E7 shows a buffering error (see E7 edge cases). E6 does not pre-check availability before navigating. |
| **User taps "Open PDF" while offline** | Same behaviour as above: navigate to E8; E8 handles the cache-miss error state. |
| **`ContentItemDTO.description` is an empty string** | Omit the description section entirely (do not render an empty block). |
| **`ContentItemDTO.categoryIds` is empty** | Omit the "Categories" row. The item is uncategorised (valid per DQ3). |
| **`ContentItemDTO.interestIds` is empty** | Omit the "Interests" row. |
| **User initiates a second download for the same item** | Not possible: once `DownloadRecord` exists, the button is in "Downloaded" (disabled) state. The button never reverts to "default" while a `DownloadRecord` is present. |
| **Category or interest name not found in `CachedCatalog`** | Orphaned ID (e.g., interest deleted post-download). Silently skip rendering that chip rather than showing a broken ID. |
| **`CachedCatalog` not ready (first load, slow sync)** | Show Loading state. Once catalog is available, transition to Ready. |
| **Orientation change while on E6** | Layout switches between portrait (stacked) and landscape (two-column). Scroll position resets to top. No data re-fetch. |

---

**Assumptions:**
- The content item's full metadata (including `categoryIds`, `interestIds`, `thumbnailUrl`) is available in `CachedCatalog`. No additional API call is needed to render E6 for a single item.
- `ContentItemDTO.description` may be an empty string (not null). The UI handles both gracefully.
- The route `/library/item/:id` encodes the `contentId` UUID. The SPA resolves the item by looking up `CachedCatalog.items.find(i => i.id === id)`.
- Category and interest names are resolved by the SPA from `CachedCatalog.categories[]` and `CachedCatalog.interests[]` respectively. No separate API calls.

**Risks:**
- If the catalog is large and `CachedCatalog` is a single JSON blob, resolving category/interest names by ID on mount could be slow for many items. For MVP (~15 items), this is negligible. Precompute a lookup map in the calling component for continuation.
- The download flow (fetch full file, proxy caches, write DownloadRecord) is the same as in E3 (Reels overlay). Ensure this logic is implemented in a shared hook (e.g., `useDownload`) to avoid duplication.

**Open questions:**
- Should the metadata section (categories, interests, size, version, date) be collapsed by default under an expandable "Details" section, to keep the primary CTAs visible without scrolling? Recommended default: show all metadata visible without collapse, since description may already push CTAs below the fold on small portrait screens — consider pinning the CTA buttons to the bottom of the screen above the tab bar.
- Should Like/Save button state be shown in E6 even though there is no recall surface? (D61: write-only in MVP.) Recommendation: yes — show the buttons to reinforce the interaction and because they are present in the Reels overlay (E3) for the same item.

**De-scope lever:** If Like/Save buttons are cut (de-scope lever #2 from MVP Spec §13), remove those buttons from E6 and E3 simultaneously. The Download button and primary CTA remain.

**Continuation notes:** When a "Saved items" view is added (post-MVP continuation per MVP Spec §14), the Save button in E6 (and E3) begins navigating the user to a filtered view. The `LocalAction` records are already persisted. The only change is adding a route and rendering the saved items list. E6 itself requires no structural change.

---

### E7 — Video Player (Standalone Mode)

**Purpose:** Full-screen video playback for a content item opened from E6 (Library Detail) or E9 (Downloads Tab). Provides standard video controls without the swipe-to-advance mechanics of the Reels feed. The content metadata was already shown in E6; this screen is playback-only.

**Entry points:**
- Tap "Play Video" CTA in E6 (Library Detail).
- Tap a video row in E9 (Downloads Tab).
- Route: `/library/item/:id/play` (from E6) or `/downloads/item/:id/play` (from E9).

---

#### States

| State | Trigger | UI |
|-------|---------|----|
| **Buffering / Loading** | `<video>` fires `waiting` event OR `src` is set and video has not yet loaded | Full-screen spinner centered on the video area; controls hidden |
| **Playing** | `<video>` fires `playing` event | Video frame visible; controls auto-hidden after 3s |
| **Paused** | User taps video area OR taps pause button | Large play icon centered; controls visible |
| **Controls visible** | User taps video area while playing OR controls have not yet auto-hidden | Progress bar, play/pause button, mute button visible; back button always visible regardless of controls state |
| **Controls hidden** | 3s elapsed since last tap while video is playing | Progress bar and playback controls fade out; back button remains visible |
| **Error** | `<video>` fires `error` event (src unreachable and not in proxy cache) | Error message centered: "This video could not be loaded. Check your connection or ensure the item is downloaded." Back button visible |
| **Playback complete** | `<video>` fires `ended` event | Video pauses on last frame; controls re-appear; no auto-advance (standalone mode) |

---

#### Layout

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  [←]                              [🔇 Mute]         │  ← Back (top-left) + Mute (top-right); always visible
│                                                      │
│                                                      │
│                                                      │
│                      ▶ / ⏸                          │  ← Play/Pause: visible only when controls are shown
│                   (large, centered)                  │
│                                                      │
│                                                      │
│                                                      │
│                                                      │
│  ────────────────────────────────────────────────── │
│  [Progress bar: ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━] │  ← Visible only when controls are shown
│  0:00                                        2:34    │  ← Current time / total duration
└──────────────────────────────────────────────────────┘
  (Tab bar is HIDDEN — full-screen experience)
```

**Notes on layout:**
- The entire viewport is the video element (`100dvw × 100dvh`). No margins or padding outside the video area.
- The tab bar is hidden for the duration of E7. It reappears when the user taps Back and returns to E6 or E9.
- There is no content overlay (title/description). Metadata was shown in E6 before the user navigated here.
- The back button (`[←]`) is always visible regardless of controls auto-hide state, to ensure the user can always exit.
- Mute button is always visible (alongside the back button).
- Controls (play/pause button, progress bar) auto-hide after 3 seconds of playback without user interaction. A single tap anywhere on the video area shows them again and resets the 3s timer.

---

#### Video Source

- `src` attribute: `/api/content/{id}/file?v={version}` (D62 — version param in URL for proxy cache-busting).
- `ContentItemDTO.version` is read from `CachedCatalog` when E7 mounts.
- The edge proxy caches the response under the full URL (including `?v={version}`). If the user downloaded the item, the proxy already has the file; playback is instant and offline-capable.
- HTTP range requests are supported by the server (D28); the `<video>` element handles range negotiation natively.
- No HLS/DASH; plain MP4 with range requests (D28).

---

#### Component Behaviour

- **Same `VideoPlayer` React component as E4** (Reels), rendered with `mode="standalone"` prop.
- The `mode` prop disables the following features active in Reels mode (`mode="reels"`):
  - Swipe-to-advance (no swipe gesture handler in standalone mode).
  - Adjacent video prefetch (no `nextId` prop; no background fetch of adjacent items).
  - Content overlay (E3 — title, description, like/save/download buttons overlaid on video).
- Auto-play: the video begins playing immediately on mount (consistent with Reels auto-play behaviour, CAP-2.2). If Chrome's auto-play policy blocks playback without a user gesture, show the paused state with the play button visible.
- Controls auto-hide: 3 seconds after playback starts or resumes (or after the last user tap), controls fade out. A tap anywhere on the video area restores them and resets the timer.
- Mute toggle: toggles `<video>.muted`; icon reflects current state (muted / unmuted). State is not persisted; defaults to unmuted on mount.
- Progress bar: reflects `<video>.currentTime / <video>.duration`. Tapping or dragging the progress bar seeks the video (`<video>.currentTime = newPosition`).

---

#### Actions

| Action | Trigger | Outcome |
|--------|---------|---------|
| **Back** | Tap ← (top-left, always visible) | Navigate back to E6 (if entered from Library) or E9 (if entered from Downloads); tab bar reappears |
| **Play / Pause** | Tap play/pause button (when controls visible) OR tap anywhere on video area | Toggle `<video>.paused`; update icon state; reset 3s auto-hide timer |
| **Mute / Unmute** | Tap mute button (always visible) | Toggle `<video>.muted`; update icon |
| **Seek** | Tap or drag progress bar (when controls visible) | Set `<video>.currentTime` to tapped/dragged position; update progress bar thumb |
| **Show controls** | Tap video area while controls are hidden | Make controls visible; reset 3s auto-hide timer |
| **Auto-hide controls** | 3 seconds elapse after last interaction while video is playing | Controls fade out; back button and mute button remain visible |

---

#### Validation / Constraints

- The tab bar must be hidden for the entire duration of E7 (UQ2 resolution: hidden during standalone playback). It reappears on Back navigation.
- The back button must always be visible and tappable regardless of controls auto-hide state. Minimum touch target: 44×44 CSS px.
- The mute button must always be visible (alongside back button). Minimum touch target: 44×44 CSS px.
- The component must NOT load, prefetch, or fetch adjacent video items. `mode="standalone"` means no `nextId` / `prevId` context.
- The `<video>` `src` must use the versioned URL pattern `/api/content/{id}/file?v={version}` to ensure correct proxy cache-busting (D62).
- The buffering spinner must appear whenever `<video>` fires `waiting` (including mid-playback rebuffering), not only on initial load.
- Controls auto-hide timer must reset on any user tap. Timer must not run while video is paused (controls remain visible when paused).
- Progress bar must update in real time during playback (`timeupdate` event listener).
- Seek via progress bar must work by setting `<video>.currentTime` directly; no page reload or re-fetch.

---

#### Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| **File not in proxy cache and device is offline** | `<video>` fires `error`; show error state: "This video could not be loaded. Check your connection or ensure the item is downloaded." Back button visible. No automatic retry. |
| **File not in proxy cache but device is online** | `<video>` buffers normally via proxy → cloud. If connection is slow, buffering spinner appears. Playback starts when enough data is buffered. |
| **Network drops mid-playback** | `<video>` fires `waiting`; buffering spinner appears. If the proxy has cached the remaining portion, playback resumes automatically. If not cached and network is lost, `error` event fires after timeout; show error state. |
| **Video reaches the end** | `<video>` fires `ended`; video pauses on the last frame; controls re-appear and stay visible (no auto-hide on ended state). No automatic navigation to the next video (standalone mode). |
| **Chrome auto-play policy blocks immediate playback** | Video is in Paused state on mount; large play button is visible. User taps play; video begins. Subsequent auto-play within the same session should work after first gesture. |
| **User rotates device mid-playback** | Video continues playing; layout reflows to fill the new viewport dimensions (`100dvw × 100dvh`). `<video>` `currentTime` is preserved. Controls visibility state is preserved. |
| **User taps Back while video is playing** | Video is paused (or stops playing) as the component unmounts. Navigation proceeds to E6 or E9. |
| **`ContentItemDTO` not found in CachedCatalog** | Cannot construct the `src` URL. Show error state immediately on mount: "This video is no longer available." Back button visible. |
| **`ContentItemDTO.duration` is null** | Progress bar shows elapsed time only (no total duration label). Progress bar scrubbing still works via `<video>.duration` (set by the browser after metadata loads). |
| **`<video>` metadata loads but `duration` differs from `ContentItemDTO.duration`** | Use the browser-reported `<video>.duration` for the progress bar. The DTO duration is display-only (shown in E6). |
| **User taps video area rapidly** | Each tap resets the 3s auto-hide timer and toggles play/pause. Debounce double-tap if needed to avoid unintended rapid pause/play cycles. |

---

**Assumptions:**
- The `VideoPlayer` component is shared between E4 (Reels) and E7 (Standalone). The `mode` prop controls which features are active. This is an implementation decision (not purely UX), but it constrains how E7 is specified: any feature listed as disabled in standalone mode must be controlled via `mode`, not by omitting it from the E7 route.
- The video file is always MP4 with range-request support. No other formats are handled in MVP (D14).
- The back navigation destination is determined when E7 mounts, based on the route it was navigated from. This is tracked either via route state or by the calling screen pushing to a named history stack.
- Auto-play on mount is the intended behaviour. The first-gesture requirement for Chrome auto-play is mitigated at the application level (the user has already tapped "Play Video" in E6 to arrive at E7, which counts as a user gesture).

**Risks:**
- Controls auto-hide implementation requires careful state management: the timer must be cleared on pause and reset on any tap. A subtle bug (timer still running when paused) would cause controls to disappear while the video is paused, making it hard to restart playback.
- If the `<video>` element is reused across route transitions (e.g., by the React router keeping the component mounted), previous playback state may leak into E7. Ensure the component fully unmounts and remounts on each navigation to E7.

**Open questions:**
- Should the progress bar support seeking by drag as well as tap? Recommended yes — drag is more natural on a tablet. Implement via `touchmove` on the progress bar track.
- Should there be a visible "fullscreen" button in E7? Not needed — E7 is already full-screen by design (`100dvw × 100dvh`, tab bar hidden). Adding a redundant fullscreen button would be confusing.

**De-scope lever:** E7 has no named de-scope lever of its own. If video support is cut entirely (de-scope lever #7 from MVP Spec §13 — "PDF support only"), E7 is removed. If it remains, E7 is a Must-priority screen with no optional sub-features beyond the auto-hide controls (which may be simplified to always-visible if implementation is constrained).

**Continuation notes:** In a post-MVP version, E7 could surface a "Related content" panel after playback ends (tapping a button reveals a slide-up list of items from the same categories/interests). The `VideoPlayer` component should expose an `onEnded` callback prop so the calling screen can render post-playback UI without modifying the player itself. The `mode` prop pattern also allows a future `mode="pip"` (picture-in-picture) without restructuring the component.

---

### E8 — PDF Viewer

**Purpose:** Renders a single PDF document page-by-page using PDF.js. Allows coaches to read library PDFs on-device. Provides page navigation, a download button, and a back button. Full-screen experience — tab bar is hidden.

**Entry points:**
- E6 (Library Detail) — tap "Open PDF" button on a content item of type PDF.
- E9 (Downloads Tab) — tap a PDF row.
- NOT reachable from the Reels feed (D19: PDFs are library-only; Reels surfaces video content only).

---

#### States

| State | Trigger | UI |
|-------|---------|----|
| **Loading** | Component mounts; `fetch("/api/content/{id}/file?v={version}")` is in flight | Full-screen PDF.js loading spinner centred in the canvas area; header bar visible (back button + empty page indicator); bottom bar visible but Previous/Next buttons disabled; Download button in default state |
| **Loaded — page N** | ArrayBuffer received; PDF.js has rendered page N | Page rendered on `<canvas>`; header shows "Page N of M"; Previous and Next buttons enabled/disabled per boundary conditions |
| **Error** | Fetch fails (network error or non-2xx) AND file is not in the proxy cache | Error message: "Could not load this document. Check your connection and try again." + Retry button centred in canvas area; header back button remains visible |
| **Download — downloading** | User taps Download button while in Loaded state | Download button switches to spinner + "Downloading…" label; page display unaffected; Previous/Next remain usable |
| **Download — downloaded** | `DownloadRecord` written to IndexedDB successfully | Download button switches to checkmark + "Downloaded" label; state persists for session |

---

#### Layout

```
┌──────────────────────────────────────────────────────┐
│  ← Back          Page 3 of 12                        │  ← Header bar (always visible, ~48px)
├──────────────────────────────────────────────────────┤
│                                                      │
│                                                      │
│                                                      │
│              <canvas> — current page                 │  ← Page canvas fills remaining height
│              (PDF.js renders one page;               │     width = 100%; page scaled to fit width
│               scale = viewer width / page width)     │
│                                                      │
│                                                      │
│                                                      │
├──────────────────────────────────────────────────────┤
│  [← Previous]        [↓ Download]        [Next →]   │  ← Bottom bar (~56px)
└──────────────────────────────────────────────────────┘
   (Tab bar hidden — full-screen experience)
```

- Header bar: always visible, never auto-hides.
  - Left: "← Back" button (44×44 CSS px minimum touch target).
  - Centre: page indicator — "Page N of M" — updates on every page change.
  - Right: empty (no mute, no overflow menu).
- Canvas area: fills all remaining vertical space between header and bottom bar. Page is scaled so its width fills the viewer width; height scales proportionally. If the page is taller than the available area, the canvas area scrolls vertically.
- Bottom bar: always visible.
  - Left: "← Previous" button — disabled and visually muted on page 1.
  - Centre: Download button — three-state (default / downloading / downloaded), matching the pattern used in E3 and E6.
  - Right: "Next →" button — disabled and visually muted on the last page.
- Tab bar: hidden for the full duration of E8. Returns on back navigation.

---

#### Actions

| Action | Trigger | Result |
|--------|---------|--------|
| **Back** | Tap "← Back" (header, always visible) | Navigate back to E6 (Library Detail) or E9 (Downloads Tab) depending on entry point; tab bar reappears |
| **Next page** | Tap "Next →" (bottom bar) | PDF.js renders page N+1 on the canvas; page indicator updates to "Page N+1 of M"; Previous button becomes enabled; Next button disabled on last page |
| **Previous page** | Tap "← Previous" (bottom bar) | PDF.js renders page N−1 on the canvas; page indicator updates; Previous button disabled on page 1 |
| **Download** | Tap Download button while in default state | Initiates fetch of full file ArrayBuffer (if not already cached) → proxy caches → writes `DownloadRecord` to IndexedDB; button transitions to downloading → downloaded |
| **Retry** | Tap Retry button in Error state | Re-executes `fetch("/api/content/{id}/file?v={version}")`; component transitions back to Loading state |

---

#### Validation / Constraints

- The back button must always be visible and tappable (never hidden by loading or error state). Minimum touch target: 44×44 CSS px.
- Previous and Next buttons must be disabled (not hidden) at page boundaries: Previous disabled on page 1; Next disabled on page M.
- Page indicator must always reflect the current page: "Page 1 of M" on initial load, updating synchronously on every page change.
- No in-document text search (OOS — MVP Spec OOS-11).
- No pinch-to-zoom (OOS). PDF.js default scale only: page width fills viewer width.
- The PDF is fetched as a full ArrayBuffer before any page is rendered. Partial/streaming render is not required for MVP.
- PDF.js must handle PDFs of any page count (D2: no page count limit). The viewer must not truncate or refuse documents based on length.
- The `fetch` URL must use the versioned pattern `/api/content/{id}/file?v={version}` to ensure correct proxy cache behaviour (D62 pattern, consistent with video).
- The Download button follows the same three-state pattern used across the app (E3 overlay, E6 Library Detail): default → downloading (spinner) → downloaded (checkmark). Once in "downloaded" state, tapping again has no effect for the current session.
- Writing the `DownloadRecord` to IndexedDB: `{ contentId, version, downloadedAt, fileSize }` — same shape as used by other download flows.
- The canvas area may scroll vertically if a page is taller than the available viewport height. This is standard browser scroll behaviour; no custom scroll implementation required.

---

#### Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| **Device offline; file in proxy cache** | `fetch` is served from proxy cache; ArrayBuffer returned normally; document renders. Viewer works fully offline. |
| **Device offline; file NOT in proxy cache** | `fetch` fails; Error state shown: "Could not load this document. Check your connection and try again." + Retry button. |
| **Fetch returns non-2xx (e.g., 404, 500)** | Treated identically to network failure: Error state shown. |
| **PDF has only 1 page** | Page indicator shows "Page 1 of 1"; both Previous and Next buttons are disabled on load. |
| **PDF has a very large page count (D2)** | Viewer works normally. PDF.js renders one page at a time; memory usage is bounded to the current page canvas. No cap on page count. |
| **User taps Back during Loading state** | Fetch is abandoned (AbortController signal sent); component unmounts cleanly; navigation proceeds to E6 or E9. |
| **User taps Back during Download — downloading state** | Download continues in the background if architecturally feasible; if not, download is cancelled. Either way, navigation to E6/E9 proceeds immediately. (Implementation decision — flag as open question.) |
| **Download fails (network error while writing DownloadRecord)** | Button returns to default state; toast shown: "Download failed. Try again." |
| **`ContentItemDTO` not found in CachedCatalog** | Cannot construct the fetch URL. Show Error state immediately on mount: "This document is no longer available." Back button visible. |
| **PDF.js fails to parse the ArrayBuffer** | Show Error state: "Could not load this document. The file may be corrupted." Retry button visible. |
| **User navigates to E8, then to E9, then back to E8 (same item)** | Component remounts; fetch runs again (or is served from proxy cache). No stale canvas state from the previous visit. Start on page 1. |

---

**Assumptions:**
- PDF.js is bundled with the Edge SPA (not loaded from a CDN) to ensure offline availability.
- The full ArrayBuffer is fetched before rendering begins. If this proves too slow for very large PDFs, a streaming approach (PDF.js supports it) can be adopted post-MVP without changing this UX spec.
- The proxy cache layer handles `fetch` interception transparently; the SPA does not need to detect whether the response came from cache or network.
- Entry-point tracking (E6 vs E9) is passed via route state so the back button can navigate to the correct screen.
- PDF files do not require authentication headers; the `/api/content/:id/file` endpoint is accessible to the Edge SPA without a token (consistent with the API contract).

**Risks:**
- Large PDFs may cause slow initial load (full ArrayBuffer required before render). For MVP this is acceptable; post-MVP, streaming render should be evaluated.
- PDF.js bundle size adds to the SPA's initial load weight. Should be code-split so it loads only when E8 is first accessed.
- Canvas rendering memory: PDF.js creates a new canvas bitmap for each page render. Ensure the previous page canvas is cleared before rendering the next to avoid memory accumulation on long documents.

**Open questions:**
- Should the Download button be visible (and functional) during Loading state? Recommended: visible but disabled until the document is loaded (the ArrayBuffer is already in memory at that point, so download can proceed without a second fetch).
- If the user navigates back mid-download, should the download continue in the background or be cancelled? Needs an architecture-level decision on whether background fetch is supported.
- Should the viewer remember the last-viewed page if the user exits and re-enters E8 for the same document? Not required for MVP; could be stored in session state or `LocalAction` in a future version.

**De-scope lever:** If PDF support is cut entirely (de-scope lever — "video-only MVP"), E8 is removed. There is no partial de-scope within E8 itself; the screen is already minimal.

**Continuation notes:** Post-MVP improvements could include: page-jump input (tap the page indicator to enter a page number directly), pinch-to-zoom (requires replacing the fixed-scale PDF.js render with a dynamic scale tied to touch events), last-read-page memory (store current page in `LocalAction` or session), and text search (MVP Spec OOS-11).

---

### E9 — Downloads Tab

**Purpose:** Provides access to all content items the user has explicitly downloaded for offline use. Lists every `DownloadRecord` stored in IndexedDB, allows playback or viewing without a network connection, and supports deletion of individual items. This is Tab 3 in the bottom tab bar and is always accessible from any main screen.

**Entry points:**
- Tapping the "Downloads" tab in the bottom tab bar (from any screen where the tab bar is visible).
- There is no deep-link navigation into E9 from another screen (e.g., a "View in Downloads" action). Users arrive by tapping the tab.

---

#### States

| State | Trigger | UI |
|-------|---------|----|
| **Populated** | One or more `DownloadRecord` entries exist in IndexedDB | Scrollable list of download rows, sorted by `downloadedAt` descending (most recent first) |
| **Empty** | `DownloadRecord` store has zero entries | Centered empty-state illustration + heading "No downloads yet" + body text |
| **Offline** | `GET /api/health` is unreachable (network status chip shows "Offline") | List renders normally (all data is local); network status chip visible at top-right; no functional degradation |
| **Orphan cleanup toast** | Catalog sync completed and one or more `DownloadRecord` entries had `contentId` not present in the updated `CachedCatalog` | Toast: "Some downloaded items were removed from the catalog"; orphaned records are deleted silently before the list renders |
| **Delete confirmation** | User taps the trash icon (or swipe-to-reveal delete) on a row | Modal confirmation dialog overlaying the list |

---

#### Layout

Portrait orientation (primary):

```
┌─────────────────────────────────────────────────────┐
│  [Offline chip — top right, if offline]              │
│                                                      │
│  Downloads                               [heading]   │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ [thumb] Title of content item         [VIDEO] [🗑]│ │
│ │         24 MB  •  15 Mar 2026         [Updated]  │ │
│ └──────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────┐ │
│ │ [thumb] Another title here             [PDF]  [🗑]│ │
│ │         8 MB   •  14 Mar 2026                    │ │
│ └──────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────┐ │
│ │ [thumb] Third item                    [VIDEO] [🗑]│ │
│ │         31 MB  •  12 Mar 2026         [Updated]  │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│  (scrollable list continues…)                        │
│                                                      │
├──────────────────────────────────────────────────────┤
│  [ Reels ]        [ Library ]       [ Downloads ✓ ]  │
└──────────────────────────────────────────────────────┘
```

Empty state:

```
┌─────────────────────────────────────────────────────┐
│  [Offline chip — top right, if offline]              │
│                                                      │
│                                                      │
│              [download illustration]                 │
│                                                      │
│              No downloads yet.                       │
│                                                      │
│    Download videos and PDFs from the Library         │
│    or while browsing Reels.                          │
│                                                      │
│                                                      │
├──────────────────────────────────────────────────────┤
│  [ Reels ]        [ Library ]       [ Downloads ✓ ]  │
└──────────────────────────────────────────────────────┘
```

**Row anatomy:**

| Zone | Content |
|------|---------|
| Left (thumbnail) | Admin-uploaded thumbnail if `DownloadRecord` has a corresponding `CachedCatalog` entry with `thumbnailUrl`; otherwise a type-based placeholder icon (video icon for VIDEO, document icon for PDF). Thumbnail is 56×56 CSS px, rounded corners. |
| Center (metadata) | Line 1: title (single line, truncated with ellipsis). Line 2: formatted file size (e.g., "24 MB") + bullet separator + formatted download date (e.g., "15 Mar 2026"). Line 3 (conditional): "Updated" badge pill — shown only when `CachedCatalog.items[contentId].version > DownloadRecord.version` (D60). |
| Right (type + action) | Type badge ("VIDEO" or "PDF") stacked above a trash icon button. |

**Landscape orientation:** Same layout; rows expand to fill wider viewport. Thumbnail size and touch targets remain unchanged.

---

#### Actions

| Action | Trigger | Outcome |
|--------|---------|---------|
| **Open video** | Tap anywhere on a row where `DownloadRecord.type === 'video'` (excluding the trash icon) | Navigate to Video Player (E7-style standalone, with back button returning to E9). File is served from edge proxy cache; no network required. |
| **Open PDF** | Tap anywhere on a row where `DownloadRecord.type === 'pdf'` (excluding the trash icon) | Navigate to PDF Viewer (E8), back button returns to E9. File is served from edge proxy cache; no network required. |
| **Delete — initiate** | Tap trash icon button on a row, OR swipe-to-reveal delete action on tablet (swipe left on row to expose a red "Delete" button) | Show confirmation dialog: "Remove this download? The file will no longer be available offline." with "Cancel" and "Remove" buttons (Remove styled in destructive colour). |
| **Delete — confirm** | Tap "Remove" in confirmation dialog | Remove the `DownloadRecord` from IndexedDB (`downloads` store, key = `contentId`). Row disappears from list. No SPA-side deletion of the cached file — the edge proxy (nginx) retains the file until its own cache eviction (30-day TTL). If this was the last record, transition list to Empty state. |
| **Delete — cancel** | Tap "Cancel" or tap outside the confirmation dialog | Dialog closes; no changes made; list state unchanged. |

---

#### Validation / Constraints

- The list must be loaded entirely from IndexedDB; no network call is required or made to render this screen.
- Sort order is strictly `downloadedAt` descending. No user-controlled sort or filter in MVP.
- Each row is tappable (for open) and has a trash icon. Minimum touch target for trash icon: 44×44 CSS px.
- The "Updated" badge is computed at render time: for each `DownloadRecord`, look up `CachedCatalog.items[contentId]`. If the catalog entry exists and `catalogItem.version > record.version`, show the badge. If the catalog entry does not exist (orphan, pre-cleanup), the row will be removed by the orphan cleanup step before it reaches the list render.
- D5 applies: no storage quota is displayed or enforced. The screen shows file sizes for user information only; there is no total storage usage indicator.
- The network status chip follows the global rule: visible when offline (`GET /api/health` unreachable), hidden when online. Its presence does not alter the list state.
- The type badge displays "VIDEO" for `type === 'video'` and "PDF" for `type === 'pdf'`. No other types exist in MVP.
- File size is displayed in human-readable form (KB / MB), rounded to the nearest integer. The raw `fileSize` bytes value from `DownloadRecord` is used; no re-measurement from the proxy cache.
- Download date is formatted as "DD MMM YYYY" (e.g., "15 Mar 2026"), using the device's local timezone.

---

#### Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| **Device fully offline** | E9 renders normally. All `DownloadRecord` data is in IndexedDB (local). Tapping a row navigates to E7 or E8; the file is served from the edge proxy cache (localhost). If the proxy cache has been cleared externally (Docker restart, cache eviction), the player/viewer will show an error — this is acceptable and out of scope for E9 to handle. |
| **Orphan DownloadRecord (contentId absent from CachedCatalog)** | Detected after catalog sync completes (sync trigger is outside E9). Before the Downloads list renders (or on next render after sync), the SPA reads all `DownloadRecord` entries, cross-references against `CachedCatalog.items`, and deletes any orphans from IndexedDB. If any were deleted, a toast is shown: "Some downloaded items were removed from the catalog." The list then renders without the orphaned rows. |
| **CachedCatalog is absent (first open, offline, sync never completed)** | No "Updated" badge comparison is possible; all badges are suppressed. The list still renders from `DownloadRecord` data alone. Orphan cleanup is skipped (nothing to compare against). |
| **Thumbnail URL present in CachedCatalog but image fails to load** | Fall back to type-based placeholder icon. No error shown to the user. |
| **DownloadRecord exists but CachedCatalog entry is missing the item** | Same as orphan scenario. Treated as an orphan pending next sync; badge computation is skipped for that row. |
| **Very long title** | Title truncated to a single line with ellipsis (`text-overflow: ellipsis`). Full title accessible in E7 or E8 (shown in the player/viewer header or E6 detail). |
| **User deletes all items** | After the last row is removed, the list transitions to Empty state without a page reload. |
| **User taps a video row and the proxy cache has evicted the file** | Navigation proceeds to E7. The HTML5 `<video>` element will fail to load; E7 is responsible for showing an error state. E9 itself does not pre-check proxy cache availability. |
| **User taps a PDF row and the proxy cache has evicted the file** | Navigation proceeds to E8. E8's fetch will fail and show its own error state. E9 itself does not pre-check proxy cache availability. |
| **Multiple rapid taps on a row** | Navigation is triggered once on the first tap; subsequent taps before navigation completes are ignored (debounce or navigation guard). |
| **Swipe-to-reveal and trash icon both available** | On tablet, both gestures lead to the same confirmation dialog. The swipe-to-reveal delete button and the trash icon are treated as equivalent triggers for the confirmation flow. |

---

**Assumptions:**
- `DownloadRecord` entries in IndexedDB are authoritative for what is displayed. The screen does not query the server.
- Thumbnail resolution for the 56×56 thumbnail zone is acceptable at whatever resolution was stored via `CachedCatalog.items[].thumbnailUrl`; no server-side resize is performed for the Downloads list.
- Orphan cleanup is triggered by the sync process (which runs on app open and manual refresh), not by E9 itself. E9 re-renders after cleanup if it is the active screen when cleanup completes.
- Entry-point tracking passed to E7/E8 via route state (`from: 'downloads'`) so the back button navigates correctly back to E9 instead of E6.
- The edge proxy's `proxy_cache` persists file availability independently of the `DownloadRecord`. Removing a `DownloadRecord` does not cause the proxy to evict the file sooner. This is by design (D5, Data Model §6.8).

**Risks:**
- If the proxy cache is cleared (e.g., Docker container restart, storage eviction), downloaded items appear in the list but will fail to play/render. The user has no in-app way to tell which items are still playable without attempting to open them. Post-MVP: a "verify" or "re-download" action could address this.
- Orphan cleanup fires after sync; if the user is on E9 at the moment sync completes, the list must update reactively (without a manual refresh). Requires a reactive state mechanism (React state/context or event listener) connected to the sync completion event.

**Open questions:**
- Should E9 show a total storage usage summary (e.g., "3 items — 63 MB total")? Not required for MVP (D5: no quota); could be added as a low-effort enhancement.
- Should tapping the thumbnail specifically open the player/viewer, or should only the text area be tappable? Recommended: the entire row (minus the trash icon) is tappable as a single touch target.

**De-scope lever:** If the full download/offline capability is cut (de-scope lever #8 — last resort), E9 is removed entirely along with the rest of CAP-5.x. There is no partial de-scope within E9 itself; the screen is already the minimum viable implementation of the Downloads tab.

**Continuation notes:** Post-MVP enhancements could include: total storage usage summary, per-item "re-download" action (for when proxy cache has been evicted), batch delete ("Clear all downloads"), sorting/filtering by type or date, and a "syncing" indicator when orphan cleanup is in progress.

---

### E10 — Change Interests (Bottom Sheet)

> **Priority:** Should — de-scope lever #6 in MVP Spec §13. If cut, users set interests once on first open and can only reset by clearing browser data.

---

#### Purpose

Allow a returning user to update their interest selections without clearing browser data. The sheet overlays the Reels Feed and reuses the same `InterestPicker` chip grid from E1. No server call is required; all data is local.

---

#### Entry Points

| Trigger | Where |
|---------|-------|
| Tap gear icon in Reels tab header | E2 (Reels Feed) — always visible when on Tab 1 |
| Tap "Edit interests" text link in Reels tab header | E2 (Reels Feed) — always visible when on Tab 1 |

The sheet is only accessible from the Reels tab. It is not reachable from Library, Downloads, or any other screen.

---

#### States

| State | Description |
|-------|-------------|
| **Default (open)** | Sheet slides up to ~60% viewport height. Chips pre-selected from `DeviceProfile.selectedInterestIds`. At least 1 chip is always selected on open (invariant: profile cannot be empty). |
| **Modified (unsaved)** | User has toggled one or more chips. "Save" button becomes active (if at least 1 chip selected). |
| **Invalid — zero selected** | User has deselected all chips. "Save" button is disabled. Inline validation message shown: "Select at least one interest to continue." |
| **Saving** | User taps "Save". Brief transition: sheet closes and Reels feed re-filters. No loading spinner required (write is synchronous IndexedDB). |
| **Dismissed** | User taps backdrop, swipes down, or taps "Cancel". Sheet closes with no changes written. |

---

#### Layout (ASCII wireframe)

```
┌─────────────────────────────────────────┐
│           [E2 Reels Feed — dimmed]      │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │          ══ (drag handle)        │   │  ← draggable handle
│  │                                  │   │
│  │   Your Interests                 │   │  ← sheet title
│  │   Select at least 1             │   │  ← subtitle / validation msg
│  │                                  │   │
│  │  ┌────────┐ ┌────────┐ ┌──────┐ │   │
│  │  │[chip ●]│ │[chip ●]│ │[chip]│ │   │  ← selected chips (filled)
│  │  └────────┘ └────────┘ └──────┘ │   │
│  │  ┌────────┐ ┌────────┐ ┌──────┐ │   │
│  │  │[chip]  │ │[chip ●]│ │[chip]│ │   │  ← mixed selection
│  │  └────────┘ └────────┘ └──────┘ │   │
│  │  (chip grid scrolls if overflow) │   │
│  │                                  │   │
│  │  [ Cancel ]        [ Save ●]     │   │  ← action buttons
│  └──────────────────────────────────┘   │
│                                         │
│  [Reels]   [Library]   [Downloads]     │  ← Tab bar (visible behind sheet)
└─────────────────────────────────────────┘
```

- Sheet height: ~60% of viewport (`60dvh`). Not adjustable by user beyond the drag-to-dismiss gesture.
- Sheet sits above the tab bar; tab bar remains visible but is not interactive while the sheet is open (backdrop intercepts taps).
- Drag handle at top centre: decorative affordance; dragging sheet down past a threshold dismisses it (same as tapping backdrop).
- Chip grid: same component as E1 (`InterestPicker`). Scrollable vertically if interest count overflows the available height.
- "Cancel" button: left-aligned or secondary. "Save" button: right-aligned or primary colour; disabled when zero chips selected.

---

#### Actions

| Action | Trigger | Outcome |
|--------|---------|---------|
| **Toggle chip** | Tap any interest chip | Chip toggles selected / deselected. UI updates immediately (local state only). |
| **Save** | Tap "Save" button (enabled state) | Writes updated `selectedInterestIds` to `DeviceProfile` in IndexedDB → sheet closes (slides down) → Reels feed re-queries `CachedCatalog` filtered by new interests → feed re-renders from the first item. |
| **Cancel** | Tap "Cancel" button | No changes written. Sheet closes (slides down). Feed unchanged. |
| **Dismiss via backdrop** | Tap dimmed area behind sheet | Same as Cancel. No changes written. Sheet closes. |
| **Dismiss via swipe** | Swipe sheet downward past threshold (~30% of sheet height) | Same as Cancel. Sheet animates closed. |

---

#### Validation / Constraints

| Rule | Enforcement |
|------|-------------|
| At least 1 interest must be selected to save | "Save" button disabled when `selectedCount === 0`. Inline message: "Select at least one interest to continue." |
| Interests list sourced from `CachedCatalog.interests` | No network call; catalog already in memory from app load. |
| Write target is `DeviceProfile.selectedInterestIds` in IndexedDB | Synchronous-style write (IndexedDB async but fast); no loading state needed. |
| Sheet does not affect the admin surface | Interests cannot be renamed or deleted from E10; it is a selection-only UI. |

---

#### Edge Cases

| Scenario | Handling |
|----------|----------|
| **User deselects all chips** | "Save" disabled; inline message shown. User must re-select at least 1 before saving or dismiss to cancel. |
| **User saves the same interests as before** | Save proceeds normally. No diff check; IndexedDB write is idempotent. Reels feed re-filters (result visually identical). |
| **Catalog has only 1 interest** | Single chip rendered. It is pre-selected (since the DeviceProfile must have at least 1). User cannot deselect it (doing so disables Save). |
| **Catalog has 0 interests (edge case)** | This state should not occur post-onboarding (E1 requires at least 1 to exist). If it does occur, the sheet opens with an empty chip grid and "Save" permanently disabled. An inline message reads: "No interests available. Contact your administrator." |
| **User opens sheet and immediately taps Cancel** | No state mutation. Sheet closes. Indistinguishable from a dismissed open. |
| **Sheet opened from a non-Reels tab** | Not possible; the gear icon / "Edit interests" link is only rendered when Tab 1 (Reels) is active. |
| **Rotation while sheet is open** | Sheet re-renders at 60% of new viewport height. Chip grid re-flows. Selected state preserved. |
| **IndexedDB write fails (storage full or error)** | Catch the error; show a toast: "Could not save interests. Try again." Sheet remains open so the user can retry or cancel. |

---

**Assumptions:**
- `CachedCatalog.interests` is already loaded in memory when the Reels Feed is active; no additional fetch is needed to open the sheet.
- The `InterestPicker` component from E1 accepts a `preSelected` prop (array of interest IDs) and exposes an `onChange` callback. No redesign is needed to reuse it in E10.
- The "Save" write to IndexedDB is fast enough that no optimistic spinner is required; the sheet can close immediately on tap.
- The Reels feed is reactive to `DeviceProfile.selectedInterestIds` changes (e.g., via a React context or state signal); it re-filters without a full page reload when the sheet closes.

**Risks:**
- If the Reels feed does not reactively observe `selectedInterestIds`, the filter change will not be visible until the user navigates away and back. This would require a page-level state signal or context update to be wired in during implementation.
- If E10 is cut (de-scope lever #6), the gear icon / "Edit interests" link must also be removed or hidden from the Reels header. Leaving the entry point without the sheet would be a dead end.

**Open questions:**
- Should the sheet show a "Select all" / "Deselect all" shortcut? Not required for MVP; could be added if the interest list is long.
- Should "Save" also trigger a catalog re-sync (to pull in any new content published since last sync)? Recommendation: no — keep save as a local-only operation; sync runs on its own schedule.

**De-scope lever:** This entire screen (E10) is de-scope lever #6. If cut: the gear icon and "Edit interests" link are removed from the Reels header. Users set interests once during onboarding (E1) and can only change them by clearing browser data (which resets `DeviceProfile` and triggers E1 again on next open). The rest of the app is unaffected.

**Continuation notes:** Post-MVP, E10 could be extended into a full Settings sheet covering notification preferences, language selection, or display options. The bottom-sheet pattern is already established and reusable. A "Reset all data" option (clearing IndexedDB) could also be surfaced here as a user-controlled alternative to browser-level data clearing.

---

## Surface B — Admin Portal

---

### A1 — Admin Login

**Purpose:** Authenticate an admin user before granting access to the Admin Portal. Acts as the auth gate for the entire admin surface — no other admin screen is reachable without a valid JWT in `sessionStorage`.

**Entry points:**
- App start with no JWT in `sessionStorage` (including first-ever open and after tab close/re-open).
- Any admin API call returns HTTP 401 after a successful login (token expired after 8 h) → redirect to A1 with a toast "Session expired, please log in again".
- There is no manual "Logout" flow in MVP; token discard happens automatically on tab close (D48).

---

#### States

| State | Trigger | UI |
|-------|---------|----|
| **Idle** | Page loads; no submission in flight | Password field empty and enabled; "Login" button enabled; no error message visible |
| **Loading** | "Login" button tapped / form submitted; POST in flight | "Login" button disabled; spinner replaces button label; password field remains enabled (user can see what they typed) |
| **Error — wrong password** | POST returns HTTP 401 | Loading state clears; inline error below password field: "Incorrect password"; password field value cleared and refocused; button re-enabled |
| **Error — network / server** | POST returns 5xx or network error | Loading state clears; inline error below password field: "Something went wrong. Please try again."; password field retains value; button re-enabled |
| **Session expired redirect** | Any admin page triggers 401 after login | A1 rendered; toast notification displayed: "Session expired, please log in again" (persists until dismissed or 5 s auto-dismiss) |

---

#### Layout

Target: desktop browser (HQ machine, D10). Standard centred card layout. Not tablet-optimised.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│              ┌─────────────────────────┐               │
│              │       TactiTok Admin    │               │
│              │─────────────────────────│               │
│              │                         │               │
│              │  Password               │               │
│              │  ┌─────────────────┐    │               │
│              │  │ ••••••••••      │    │               │
│              │  └─────────────────┘    │               │
│              │  [inline error here]    │               │
│              │                         │               │
│              │  ┌─────────────────┐    │               │
│              │  │     Login       │    │               │
│              │  └─────────────────┘    │               │
│              │                         │               │
│              └─────────────────────────┘               │
│                                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- Card is centred horizontally and vertically in the viewport (`margin: auto`; `min-height: 100vh` flex container).
- Card width: `400px` fixed; padding `32px`.
- "TactiTok Admin" heading: `h1`, top of card, centred or left-aligned.
- Password label above field.
- Password `<input type="password">` — full card width.
- Inline error: `<p role="alert">` rendered immediately below the input field; coloured red; empty (not rendered) when no error.
- "Login" `<button type="submit">` — full card width; height `44px`; loading state replaces label with a spinner icon (SVG or CSS).
- No username field. No "Remember me" checkbox. No "Forgot password" link.

---

#### Actions

| Action | Trigger | Outcome |
|--------|---------|---------|
| **Submit** | Click "Login" button or press Enter in password field | Form validation runs (empty check); if valid, POST `/api/admin/login` with `{ password }` fires; state → Loading |
| **POST 200 success** | Server returns `{ token, expiresAt }` | JWT written to `sessionStorage` under key `adminToken`; navigate to Content List (A2); A1 unmounts |
| **POST 401** | Server returns 401 | State → Error (wrong password); inline error shown; field cleared and refocused |
| **POST 5xx / network error** | Request fails or server error | State → Error (generic); inline error shown; field retains value |
| **Type in password field** | Any keystroke while in error state | Inline error is cleared immediately (live feedback; user should not see stale error while retyping) |

---

#### Validation / Constraints

| Rule | Enforcement |
|------|-------------|
| Password field must not be empty on submit | Client-side: if field is empty on submit, show inline error "Password is required" without sending the POST |
| No username field | The admin portal uses a single shared password (D48); no username is collected or sent |
| No "remember me" | JWT is stored in `sessionStorage` only; persisting to `localStorage` is explicitly out of scope (D48) |
| Token storage key | `sessionStorage.setItem('adminToken', token)` — consistent key used across all admin API calls |
| Button disabled during in-flight POST | Prevents duplicate submissions |
| No client-side rate limiting | The UI makes no attempt to throttle or lock out after repeated failures; the server may enforce rate limiting independently |

---

#### Edge Cases

| Scenario | Handling |
|----------|----------|
| **User opens Admin Portal with a still-valid token in sessionStorage** | Auth guard reads `sessionStorage.getItem('adminToken')`; if present and not expired (check `expiresAt` locally), skip A1 and navigate directly to A2 |
| **Token is present in sessionStorage but malformed / unreadable** | Treat as absent; show A1; previous token discarded |
| **Tab closed and re-opened** | `sessionStorage` is cleared by the browser on tab close; A1 is shown on next open |
| **User navigates directly to an admin URL (e.g. `/content`) without a token** | Auth guard intercepts; redirects to A1; after successful login, redirect back to the originally requested URL |
| **Token expiry during active session (8 h)** | First admin API call after expiry returns 401; any admin page receiving this response clears `sessionStorage` and redirects to A1 with the "Session expired" toast |
| **POST request times out (slow network)** | Treat as network error; state → Error (generic); inline error: "Something went wrong. Please try again." |
| **Browser autofill populates the password field** | Standard `<input type="password">` with `autocomplete="current-password"` allows autofill; no special handling needed |
| **JavaScript disabled** | Admin Portal requires JS; no fallback. Out of scope. |

---

**Assumptions:**
- The admin portal is accessed only on HQ desktop machines with a stable internet connection (D10). No offline handling is required for A1.
- A single shared admin password is acceptable for the MVP (D48). Multi-user auth is a continuation item.
- The JWT payload includes an `expiresAt` field readable client-side to enable local expiry pre-check; alternatively, the SPA always attempts the API call and handles the 401.
- `sessionStorage` is available and not blocked by browser policy on the target HQ machine.

**Risks:**
- If the JWT expiry check is done purely client-side from `expiresAt`, clock skew between client and server could cause premature or delayed re-authentication. Prefer handling server-returned 401 as the authoritative expiry signal.
- Shared password with no lockout means brute force is theoretically possible. Acceptable for MVP in a controlled HQ environment; add rate limiting in production.

**Open questions:**
- Should successful login redirect back to the URL the user originally tried to access (e.g. if they bookmarked `/content/new`)? Recommendation: yes — store the attempted URL before redirecting to A1, then restore after login. Simple to implement with a `returnTo` query param or in-memory variable.
- Is a "Logout" button required anywhere in the admin surface for MVP? Current answer: no (D48 — token clears on tab close). If HQ staff share a machine, a logout button may be needed. Deferring to post-MVP.

**De-scope lever:** None — A1 is the auth gate and cannot be cut. If the admin portal itself is cut, A1 disappears with it.

**Continuation notes:** Post-MVP, replace shared password with individual user accounts (username + hashed password, or SSO). The A1 form layout already accommodates a username field; adding it requires only a schema and API change. The JWT-in-sessionStorage pattern (D48) remains valid for named users.

---

### A2 — Content List

**Purpose:** Main dashboard of the admin portal. Displays all uploaded content items in a sortable, filterable table. Primary entry point for managing the content catalog — uploading new items, editing existing items, and deleting items. Serves as the default landing screen after login (A1).

**Entry points:**
- Automatic redirect from A1 on successful login.
- Side nav "Content" link — available from any admin screen at any time.
- Browser navigation to `/content` (if a valid JWT is present in `sessionStorage`; otherwise redirected to A1 first, then returned here).

---

#### States

| State | Trigger | UI |
|-------|---------|----|
| **Loading** | `GET /api/admin/content` is in flight | Skeleton rows rendered in table body; table headers visible; filter bar and "Upload Content" button visible but filter controls disabled |
| **Loaded** | API response received; items array non-empty | Full table rendered with all items sorted by `createdAt` descending |
| **Empty** | API response received; items array is empty | Table headers hidden; empty state message shown: "No content yet. Upload your first item." with "Upload Content" button |
| **Filtered — results** | User selects Video or PDF filter; matching items exist | Table shows filtered subset; active filter button highlighted |
| **Filtered — no results** | User selects Video or PDF filter; no matching items | Inline empty state within table area: "No [Video/PDF] items found." |
| **Delete confirm dialog open** | User clicks "Delete" on a row | Modal confirmation dialog overlays the page; page behind is non-interactive |
| **Delete in progress** | User confirms deletion; `DELETE /api/admin/content/:id` in flight | Delete button in dialog shows spinner; Cancel button disabled; background table non-interactive |
| **Delete success** | 204 response received | Dialog closes; row removed from table; success toast "Item deleted" shown |
| **Delete error** | Non-204 response or network failure | Dialog closes; row remains in table; error toast "Failed to delete item. Try again." shown |
| **API error (load)** | `GET /api/admin/content` returns 4xx/5xx or network failure | Error state shown in table area: "Failed to load content. Try again." with a retry button |
| **Session expired** | Any admin API call returns 401 | Redirect to A1 with toast "Session expired, please log in again" (shared pattern — see A1 edge cases) |

---

#### Layout

Target: desktop browser, wide viewport (≥1024px). Side nav always visible.

```
┌─────────────────────────────────────────────────────────────────────┐
│  ┌──────────────┐  ┌──────────────────────────────────────────────┐ │
│  │              │  │  Content                  [Upload Content ↑] │ │  ← Page header
│  │  TactiTok    │  ├──────────────────────────────────────────────┤ │
│  │  Admin       │  │  [All]  [Video]  [PDF]                       │ │  ← Filter bar
│  │              │  ├────────┬──────────────┬──────┬───────────────┤ │
│  │  > Content   │  │ Thumb  │ Title      ↕ │ Type │ Categories  … │ │  ← Table header row
│  │    (active)  │  ├────────┼──────────────┼──────┼───────────────┤ │
│  │              │  │ [img]  │ Item title   │VIDEO │ Cat A, Cat B  │ │
│  │  Categories  │  │        │              │      │ 52 MB  2:04   │ │
│  │              │  ├────────┼──────────────┼──────┼───────────────┤ │
│  │  Interests   │  │ [img]  │ Item title   │ PDF  │ Cat C         │ │
│  │              │  │        │              │      │ 1.2 MB  —     │ │
│  │              │  ├────────┼──────────────┼──────┼───────────────┤ │
│  │              │  │ [img]  │ Item title   │VIDEO │ —             │ │
│  │              │  │        │              │      │ 8.4 MB  1:47  │ │
│  │              │  │        │              │      │  [Edit] [Del] │ │  ← Row actions (hover)
│  │              │  ├────────┼──────────────┼──────┼───────────────┤ │
│  │              │  │  ...                                         │ │
│  └──────────────┘  └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Side nav (left panel, always visible, ~220px wide):**
- App name / wordmark at top.
- Navigation links: Content (active, highlighted), Categories, Interests.
- Active item is visually distinguished (bold text or left-border accent).
- No collapse/hide toggle in MVP.

**Page header (top of right content area):**
- Left: page title "Content".
- Right: primary action button "Upload Content" (filled / accent colour). Navigates to A3.

**Filter bar (below page header):**
- Three toggle buttons: "All" / "Video" / "PDF".
- Only one can be active at a time. "All" is active by default.
- Filtering is client-side — no API call on filter change.
- Active button is visually distinguished (filled background or underline).

**Table (main content area):**

| Column | Source field | Width hint | Notes |
|--------|-------------|------------|-------|
| Thumbnail | `thumbnailUrl` → `<img>` or type placeholder | 48px fixed | 48×48px image or icon; no upscaling |
| Title | `title` | Flexible (fills remaining space) | Truncate with ellipsis if overflow |
| Type | `type` | ~80px | Rendered as badge: "VIDEO" (blue) or "PDF" (green) pill |
| Categories | `categoryIds` resolved to names | ~200px | Comma-separated category names; truncate if overflow |
| File size | `fileSize` (bytes → human-readable) | ~90px | Display as "52 MB" or "1.2 MB" |
| Duration | `duration` (seconds → mm:ss) | ~70px | Video only; blank cell ("—") for PDF |
| Version | `version` | ~70px | Integer; e.g. "v3" |
| Last updated | `updatedAt` | ~130px | Formatted date; e.g. "Mar 15, 2026" |
| Actions | — | ~120px fixed | "Edit" button + "Delete" button; see Row Actions |

**Sortable columns:** Title, Type, Last updated. Clicking a sortable header toggles ascending/descending. Default sort is `createdAt` descending (not a visible column — implicit on load). A sort indicator arrow is shown on the active sort column header.

**Row actions:**
- On desktop, "Edit" and "Delete" buttons are shown persistently on the right side of each row (no hover-only hiding; this is a desktop admin tool — always-visible is simpler and more accessible).
- "Edit" button: outlined/secondary style. Label: "Edit".
- "Delete" button: outlined/destructive style (red border + red text). Label: "Delete".
- Minimum button touch/click target: 32px height acceptable on desktop (not a touch surface).

**Loading skeleton:**
- While `GET /api/admin/content` is in flight, render 5 skeleton rows.
- Each skeleton row has a grey animated placeholder in the thumbnail cell, a longer placeholder bar in the Title cell, and shorter bars in other cells.
- Table headers and filter bar are rendered normally above the skeleton.

---

#### Delete Confirmation Dialog

Triggered when the user clicks "Delete" on any row.

```
┌──────────────────────────────────────────────────────┐
│  Delete content item?                                │
│                                                      │
│  Permanently delete "[item title]"?                  │
│  This cannot be undone. Edge devices will no longer  │
│  see this item after their next sync.                │
│                                                      │
│                        [ Cancel ]  [ Delete ]        │
└──────────────────────────────────────────────────────┘
```

- Dialog title: "Delete content item?"
- Body: "Permanently delete "[item title]"? This cannot be undone. Edge devices will no longer see this item after their next sync."
- `[item title]` is the actual `title` value of the row the user clicked.
- Cancel button: closes dialog; no API call; table unchanged.
- Delete button: destructive red filled button. Clicking sends `DELETE /api/admin/content/:id`.
- Dialog is modal (page behind is non-interactive while dialog is open).
- Pressing Escape or clicking outside the dialog is equivalent to Cancel.

---

#### Actions

| Action | Trigger | Outcome |
|--------|---------|---------|
| **Click "Upload Content"** | Click button in page header | Navigate to A3 (Upload Content) |
| **Click "All" filter** | Click "All" toggle button | Show all items; clear type filter |
| **Click "Video" filter** | Click "Video" toggle button | Show only items where `type === 'video'`; filtering is client-side |
| **Click "PDF" filter** | Click "PDF" toggle button | Show only items where `type === 'pdf'`; filtering is client-side |
| **Click sortable column header** | Click Title, Type, or Last updated header | Toggle sort direction for that column; re-sort table client-side; show sort arrow on header |
| **Click "Edit" on a row** | Click Edit button | Navigate to A4 (Edit Content) for that item's `id` |
| **Click "Delete" on a row** | Click Delete button | Open delete confirmation dialog |
| **Click "Cancel" in dialog** | Click Cancel or press Escape or click backdrop | Close dialog; no state change |
| **Click "Delete" in dialog** | Click destructive Delete button | Send `DELETE /api/admin/content/:id`; on 204: remove row, show success toast; on error: close dialog, show error toast |
| **Click "Content" in side nav** | Click nav link | Navigate to `/content` (A2); if already on A2, reload the page (or re-fetch the content list) |
| **Click "Categories" in side nav** | Click nav link | Navigate to A5 (Category Management) |
| **Click "Interests" in side nav** | Click nav link | Navigate to A6 (Interest Management) |
| **Click retry (error state)** | Click retry button in API error state | Re-issue `GET /api/admin/content`; show loading skeleton |

---

#### Validation / Constraints

| Rule | Enforcement |
|------|-------------|
| Category names in the table | `categoryIds` in `ContentItemDTO` are UUIDs; the SPA must resolve them to display names. Resolution source: a separate `GET /api/admin/categories` call on page load, cached in component state. If categories cannot be loaded, display the raw UUID (truncated) as a fallback. |
| Sort state | Only one column sort is active at a time. Switching columns resets direction to ascending. |
| Filter state | Filter state is held in local component state only; it resets to "All" when the user navigates away and returns. No URL persistence of filter state in MVP. |
| Delete is hard delete | The UI must make clear the deletion is permanent (dialog copy). No undo or soft-delete. |
| Duration display | `duration` is in seconds (integer). Format as `mm:ss` in the table cell (e.g. 124 → "2:04"). Blank cell ("—") for PDF items (`type === 'pdf'`). |
| File size display | `fileSize` is in bytes. Display as human-readable: < 1 MB → "X KB"; ≥ 1 MB → "X.X MB". Round to 1 decimal place. |
| Thumbnail fallback | If `thumbnailUrl` is null or the image fails to load, render a type-based placeholder icon (video camera for video; document for PDF). No broken image indicator. |

---

#### Edge Cases

| Scenario | Handling |
|----------|----------|
| **Item deleted by another admin session concurrently** | If `DELETE /api/admin/content/:id` returns 404, treat as success (item is already gone). Remove the row and show success toast "Item deleted." |
| **Content list is very long (50+ items)** | MVP has no pagination. The table scrolls vertically within the page. If performance degrades, add `?page=` pagination in continuation (noted in API contract §17). |
| **Categories API fails on load** | Display table without resolved category names. Cells show "—" or truncated UUID. Show a non-blocking warning toast "Could not load category names." |
| **Category name is very long** | Truncate with CSS ellipsis in the Categories column. Full name visible on hover via `title` attribute on the cell. |
| **Item has no categories** | Categories cell shows "—". |
| **Item has no thumbnail** | Type-based placeholder icon rendered at 48×48px. See Thumbnail fallback rule above. |
| **Rapid filter switching** | Filtering is synchronous and client-side; no debounce needed. No loading state triggered. |
| **User tries to navigate away mid-delete** | If the DELETE is in flight and the user clicks a nav link, the navigation proceeds (no blocking prompt in MVP). The delete completes in the background; the toast may appear on the next screen. Acceptable for MVP. |
| **Empty filter result after delete** | If deleting the last "Video" item while the "Video" filter is active, the table transitions to the "Filtered — no results" empty state after the row is removed. |

---

**Assumptions:**
- The admin portal is used only on desktop with a stable connection (D10). No offline handling is required for A2.
- Category names are resolved client-side by joining `ContentItemDTO.categoryIds` against results from `GET /api/admin/categories`. A dedicated endpoint returning category names alongside content items does not exist.
- `GET /api/admin/content` returns all items with no pagination in MVP (API contract §7.2). The full list is held in memory.
- Sorting and filtering are performed entirely client-side against the in-memory items array.
- "Upload Content" is the only creation path; there is no inline row creation in the table.

**Risks:**
- If the content catalog grows large (hundreds of items) before pagination is added, in-memory sorting/filtering may cause noticeable lag. Monitor item count; add server-side pagination (API contract continuation note §17) before the table reaches ~200 rows.
- Concurrent admin sessions could cause stale data (e.g. one admin deletes an item while another is viewing the same list). The 404-as-success pattern mitigates the delete case. A manual page refresh is the workaround for other staleness.

**Open questions:**
- Should the filter state ("All / Video / PDF") persist in the URL query string (e.g. `?type=video`) to support bookmark/share? Recommendation: no in MVP. Simple to add as a continuation item.
- Should `createdAt` be a visible column? It is the default sort key but is currently hidden. Adding it as a visible column (with sort) would make the default sort order more transparent. Deferred — omit in MVP unless feedback indicates confusion.

**De-scope lever:** If the admin portal is deprioritised under time pressure, A2 is the minimum viable admin screen — it must exist if any admin functionality ships. Per API contract §16 de-scope lever 5: dropping `GET /api/admin/content` removes A2 entirely; admins must then rely on upload-only + direct database access to manage content. Only cut if the full admin surface is cut.

**Continuation notes:** When pagination is added, replace the in-memory items array with a paginated server response (`?page=n&limit=n`). Sorting and filtering will move to query params (`?sortBy=title&order=asc&type=video`). The table component can remain largely unchanged if pagination controls are added below it. Consider adding a "Refresh" button (or auto-poll) for multi-admin environments.

---

### A3 — Upload Content

**Purpose:** Create a new content item by uploading a file (MP4 video or PDF) and providing metadata (title, description, categories, interests). Sends a single multipart `POST /api/admin/content` request. The content type (video vs PDF) is derived from the file MIME type; there is no explicit type selector (UQ6).

**Entry points:**
- "Upload Content" button (top-right) on A2 — Content List.

---

#### States

| State | Trigger | UI |
|-------|---------|----|
| **Idle — empty** | Screen first loads | All fields empty; file drop zone blank; "Upload" button disabled |
| **File selected** | User drags a file onto the drop zone or uses "Browse files" | Filename and formatted file size shown inside drop zone; file type auto-detected; inline errors cleared |
| **Categories loading** | `GET /api/admin/categories` in flight | Category multi-select shows a loading skeleton or spinner in place of checkboxes |
| **Interests loading** | `GET /api/admin/interests` in flight | Interest multi-select shows a loading skeleton or spinner |
| **Ready to submit** | Valid file selected + title non-empty | "Upload" button enabled |
| **Uploading** | "Upload" button pressed; multipart POST in flight | Progress bar visible; "Upload" button disabled and shows "Uploading…"; Cancel hidden or replaced by "Uploading" label |
| **Success** | Server returns 201 | Toast "Content uploaded successfully" shown; screen navigates back to A2 |
| **Field error** | Client-side pre-validation fails, or server returns 400/415/413 | Inline error message beneath the relevant field; upload does not start (for client-side) or aborts (for server-side errors) |

---

#### Layout (Desktop)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Back                     Upload Content                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │           Drag and drop your file here                        │  │
│  │                   — or —                                      │  │
│  │              [ Browse files ]                                 │  │
│  │                                                                │  │
│  │  Accepted: MP4 video, PDF  •  Max size: 100 MB               │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  (After selection:)                                                   │
│  ✓ filename.mp4  •  24.3 MB                                          │
│  [inline error if invalid]                                           │
│                                                                      │
│  Title *                                                             │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ ...                                                            │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  [inline error if empty]                                             │
│                                                                      │
│  Description                                                         │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ (optional)                                                     │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Categories                              Interests                   │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐  │
│  │ [ ] Category A               │  │ [ ] Interest 1               │  │
│  │   [ ] Child A1               │  │ [ ] Interest 2               │  │
│  │   [ ] Child A2               │  │ [ ] Interest 3               │  │
│  │ [ ] Category B               │  │ (scrollable)                 │  │
│  │ (scrollable)                 │  └──────────────────────────────┘  │
│  └──────────────────────────────┘                                    │
│                                                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ (progress bar)  │
│  (hidden until upload starts; shows % when Content-Length known)     │
│                                                                      │
│                    [ Cancel ]   [ Upload ]                           │
└──────────────────────────────────────────────────────────────────────┘
```

Notes:
- The drop zone has a dashed border at rest; border changes to solid blue on active drag-over.
- After file selection, the drop zone collapses to a one-line "file chip" (filename + size + ✕ to clear).
- Categories and Interests panels are side-by-side on desktop; stacked on narrower viewports.
- The progress bar row is hidden (height 0, no reflow) until the upload starts. It disappears on success; stays visible (at 100%) on error until the user dismisses or retries.
- "Upload" button is the primary action (filled). "Cancel" is secondary (outlined or text).

---

#### Actions

| Action | Trigger | Outcome |
|--------|---------|---------|
| **Drag file onto drop zone** | Drag-over + drop | File stored in component state; filename and size displayed; MIME checked client-side |
| **Click "Browse files"** | Button click | Native file input dialog opens; single file selection only |
| **Clear file (✕ on file chip)** | Click ✕ | File cleared; drop zone restored to empty state |
| **Type in Title** | Keystroke | Character count shown (e.g. "42 / 255") |
| **Select / deselect category checkbox** | Click | `selectedCategoryIds` set updated |
| **Select / deselect interest checkbox** | Click | `selectedInterestIds` set updated |
| **Click "Upload"** | Button click | Client-side pre-validation runs; if clean, multipart `POST /api/admin/content` fires; progress bar appears |
| **Click "Cancel"** | Button click | Navigate back to A2; form state discarded; no API call made |
| **Click "← Back"** | Link/button click | Same as Cancel |

---

#### Validation / Constraints

| Rule | Enforcement |
|------|-------------|
| **File type** | Client-side: check `file.type` against `['video/mp4', 'application/pdf']` before submit. If mismatch: inline error beneath drop zone — "Only MP4 video or PDF files are accepted." Server-side: 415 Unsupported Media Type maps to the same inline error. |
| **File size ≤ 100 MB** | Client-side: check `file.size > 104857600` before submit. If exceeded: inline error — "File exceeds the 100 MB limit." Server-side: 413 Payload Too Large maps to the same error. |
| **Video duration ≤ 180 s** | Client-side: cannot pre-validate without loading the video. Server-side: 400 with a duration error message. Inline error — "Video exceeds the 3-minute limit." |
| **Title required** | Client-side: if `title.trim().length === 0` on submit: inline error — "Title is required." |
| **Title max length** | `maxLength={255}` on the input. Character counter shown ("X / 255") below the field. |
| **Categories / Interests** | 0 or more selections allowed; no minimum enforced. |
| **Single file only** | The file input uses `multiple={false}`. Drop zone ignores multi-file drops (show toast "Please drop one file at a time"). |
| **Content type** | Detected from MIME; not user-selectable. The detected type ("Video" / "PDF") may be shown as a read-only badge after file selection. |

---

#### Edge Cases

| Scenario | Handling |
|----------|----------|
| **Categories API fails to load** | Show error state in the Categories panel: "Could not load categories. You can still upload without selecting a category." Upload is not blocked. |
| **Interests API fails to load** | Same pattern as categories failure above. |
| **Upload interrupted (network drop)** | `fetch` rejects or times out. Show page-level error banner: "Upload failed. Check your connection and try again." Progress bar stays visible (partial). "Upload" button re-enables; user can retry. |
| **User navigates away mid-upload** | No blocking prompt in MVP. Navigation proceeds; the in-flight `fetch` is abandoned. The server may or may not complete the write. A retry from scratch is the recovery path. |
| **Server returns 400 for unknown reason** | Show page-level error banner: "Upload failed: [server error message]." Do not navigate away. |
| **File name contains special characters** | Display as-is in the file chip. The server receives the raw bytes; filename is not stored or used by the API. |
| **Drop zone receives a non-file drag (e.g. text or link)** | `dragover` and `drop` handlers check `event.dataTransfer.types`; if no `Files` type, reject and do not update state. |
| **User attempts to submit while categories/interests are still loading** | The "Upload" button checks for loading state and shows "Loading options…" or disables until both lists resolve. Alternatively, allow submit without waiting (empty arrays are valid). Recommended: allow submit if title + file are valid — the multi-selects show a loading state but do not block upload. |

---

**Assumptions:**
- Categories and interests are low-cardinality lists (≤ 50 items each). Rendering all as checkboxes in a scrollable panel is sufficient for MVP. A search-within-select is out of scope.
- The server returns a `Content-Length` header on the `POST /api/admin/content` response stream, enabling percentage progress. If `Content-Length` is absent (chunked transfer), the progress bar shows an indeterminate animation until the upload completes.
- The admin portal is always used on a stable desktop connection (D10); upload interruptions are edge cases, not the common path.
- Content type is reliably detectable from the file MIME type (`video/mp4` vs `application/pdf`). If the browser reports an unexpected MIME for a valid file, the server's 415 response surfaces the error.

**Risks:**
- If `POST /api/admin/content` does not return `Content-Length` for the upload progress (common with streaming/chunked encoding), the progress bar must fall back to indeterminate. Confirm server streaming behaviour in sprint 1.
- Large file uploads (near 100 MB) over an unstable connection will fail. No resume/chunked upload is in scope for MVP. If this is a real operational concern, add multipart chunked upload in continuation.

**Open questions:**
- UQ6 (from discovery): Is auto-detecting content type from MIME sufficient, or should the admin be able to override the detected type? Recommendation: auto-detect is sufficient for MVP. Override can be added if mislabelling occurs in practice.
- Should a duplicate title be warned about (not blocked)? Currently no uniqueness constraint on title in the data model. No action for MVP.

**De-scope lever:** If the upload form needs to be cut, the minimum viable fallback is direct database + S3/storage insertion by the developer. The API endpoint exists; the form is the only UI surface for it.

**Continuation notes:** If the content library grows and categories/interests become high-cardinality, replace the checkbox lists with a searchable tag-selector component. The `ContentForm` component (shared with A4) should accept a `mode` prop (`'create' | 'edit'`) to conditionally render the file picker section.

---

### A4 — Edit Content

**Purpose:** Edit the metadata of an existing content item, and optionally replace its file or thumbnail independently. Metadata changes are saved via `PUT /api/admin/content/:id` (JSON body). File replacement and thumbnail replacement are separate operations with separate endpoints. All three sections save independently.

**Entry points:**
- "Edit" action on a row in A2 — Content List.

---

#### States

| State | Trigger | UI |
|-------|---------|----|
| **Loading** | Screen mounts; `GET /api/admin/content/:id` in flight | Full-form skeleton (greyed fields); Save / Replace buttons disabled |
| **Ready** | `GET /api/admin/content/:id` succeeds; form pre-filled | All fields populated; version badge visible; Save Changes button enabled |
| **Metadata dirty** | User edits any metadata field | "Save Changes" button visually enabled (it is always enabled once loaded; dirtiness is cosmetic) |
| **Saving metadata** | "Save Changes" clicked; `PUT /api/admin/content/:id` in flight | "Save Changes" button shows "Saving…" and is disabled; fields remain editable |
| **Metadata saved** | PUT returns 200 | Toast "Changes saved"; button re-enables; no navigation |
| **Replace file — file selected** | User selects a replacement file | Filename + size shown in Replace File section; inline errors cleared |
| **Replacing file** | "Replace File" button clicked; `PUT /api/admin/content/:id/file` in flight | Progress bar in Replace File section; button shows "Uploading…"; disabled |
| **File replaced** | PUT /file returns 200 | Toast "File replaced. Version updated to [n]."; version badge increments in UI |
| **Replace thumbnail — file selected** | User selects an image file | Image preview shown in Replace Thumbnail section |
| **Replacing thumbnail** | "Replace Thumbnail" button clicked; `PUT /api/admin/content/:id/thumbnail` in flight | Spinner or progress in Replace Thumbnail section; button disabled |
| **Thumbnail replaced** | PUT /thumbnail returns 200 | Thumbnail preview updates; toast "Thumbnail updated" |
| **Field error** | Client-side validation fails or server returns 4xx | Inline error under relevant field |
| **Load error** | `GET /api/admin/content/:id` returns 404 or network error | Error banner "Could not load this content item." with a "Back to list" link |

---

#### Layout (Desktop)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Back to Content List              Edit Content                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────── Section ────────┐ │
│  │  Metadata                                                       │ │
│  │                                                                 │ │
│  │  Title *                                                        │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │ Existing title text                                     │   │ │
│  │  └─────────────────────────────────────────────────────────┘   │ │
│  │                                                                 │ │
│  │  Description                                                    │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │ Existing description text                               │   │ │
│  │  │                                                         │   │ │
│  │  └─────────────────────────────────────────────────────────┘   │ │
│  │                                                                 │ │
│  │  Categories                    Interests                        │ │
│  │  ┌────────────────────────┐  ┌──────────────────────────────┐  │ │
│  │  │ [x] Category A         │  │ [x] Interest 1               │  │ │
│  │  │   [ ] Child A1         │  │ [ ] Interest 2               │  │ │
│  │  │   [x] Child A2         │  │ [x] Interest 3               │  │ │
│  │  │ [ ] Category B         │  │ (scrollable)                 │  │ │
│  │  └────────────────────────┘  └──────────────────────────────┘  │ │
│  │                                                                 │ │
│  │                                    [ Save Changes ]             │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────── Section ────────┐ │
│  │  Replace File                        Type: VIDEO  Version: 3    │ │
│  │                                                                 │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  Drag and drop replacement file here — or —              │  │ │
│  │  │               [ Browse files ]                           │  │ │
│  │  │  Accepted: MP4 video, PDF  •  Max size: 100 MB          │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │  (After selection: filename chip + size)                        │ │
│  │  [inline error if invalid]                                      │ │
│  │                                                                 │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  (section progress bar) │ │
│  │                                   [ Replace File ]              │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────── Section ────────┐ │
│  │  Replace Thumbnail                                              │ │
│  │                                                                 │ │
│  │  Current thumbnail:  [ 120×68px preview image ]                │ │
│  │                                                                 │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  Drag and drop image here — or — [ Browse files ]        │  │ │
│  │  │  Accepted: JPEG, PNG, WebP  •  Max size: 5 MB           │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │  (After selection: image preview 120×68px)                      │ │
│  │  [inline error if invalid]                                      │ │
│  │                                                                 │ │
│  │                               [ Replace Thumbnail ]             │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  [ Cancel ]                                                          │
└──────────────────────────────────────────────────────────────────────┘
```

Notes:
- The screen is divided into three visually distinct sections with section headers. Each section has its own save/replace button.
- The file picker in A4 is NOT pre-populated with the existing file. It is always empty on load; the admin must explicitly select a replacement file to trigger a file update.
- "Version: N" in the Replace File section header reflects the current version from `ContentItemDTO.version`. It increments after a successful `PUT /api/admin/content/:id/file`.
- "Cancel" at the bottom navigates back to A2. It does not undo already-saved metadata or file changes (those were saved independently on button click).

---

#### Actions

| Action | Trigger | Outcome |
|--------|---------|---------|
| **Edit metadata field** | Keystroke / checkbox click | Local component state updated; no API call |
| **Click "Save Changes" (metadata)** | Button click | Client-side validation; if clean, `PUT /api/admin/content/:id` with JSON body `{ title, description, categoryIds, interestIds }` |
| **Select replacement file** | Drag or Browse | File stored in Replace File section state; filename + size shown; MIME and size checked |
| **Click "Replace File"** | Button click | `PUT /api/admin/content/:id/file` with multipart body; progress bar shown in section |
| **Select replacement thumbnail** | Drag or Browse | Image stored in Replace Thumbnail section state; preview shown; MIME and size checked |
| **Click "Replace Thumbnail"** | Button click | `PUT /api/admin/content/:id/thumbnail` with multipart body |
| **Click "Cancel" or "← Back"** | Link/button click | Navigate to A2; unsaved metadata edits discarded |

---

#### Validation / Constraints

| Rule | Enforcement |
|------|-------------|
| **Title required** | Same as A3: client-side empty check before `PUT /api/admin/content/:id`. Inline error "Title is required." |
| **Title max 255 chars** | `maxLength={255}` on input; character counter below field. |
| **Replacement file type** | Same as A3: client-side MIME check; inline error "Only MP4 video or PDF files are accepted." |
| **Replacement file size ≤ 100 MB** | Same as A3: client-side size check; inline error "File exceeds the 100 MB limit." |
| **Replacement video duration ≤ 180 s** | Server-side only (400 response); inline error "Video exceeds the 3-minute limit." |
| **Thumbnail file type** | Client-side MIME check against `['image/jpeg', 'image/png', 'image/webp']`. Inline error "Only JPEG, PNG, or WebP images are accepted." |
| **Thumbnail file size ≤ 5 MB** | Client-side: `file.size > 5242880`; inline error "Image exceeds the 5 MB limit." |
| **Independent saves** | Each section sends its own request. Submitting "Save Changes" does not affect the Replace File or Replace Thumbnail sections, and vice versa. |
| **Version display** | `ContentItemDTO.version` is shown as a read-only badge in the Replace File section. After a successful file replace, increment the displayed version number in UI state without re-fetching the full item. |

---

#### Edge Cases

| Scenario | Handling |
|----------|----------|
| **Item deleted by another session before the admin saves** | `PUT /api/admin/content/:id` returns 404. Show page-level error banner "This item no longer exists." with a "Back to list" link. Do not navigate automatically. |
| **Metadata save succeeds but categories/interests failed to load** | Categories and interests multi-selects show their error state. The admin may save title and description without touching categories/interests; the PUT body sends the original `categoryIds` and `interestIds` unchanged. |
| **Admin saves metadata, then replaces file without refreshing** | Allowed and expected. The two operations are independent. The version number shown in the Replace File section updates after file replace; metadata fields remain as last saved. |
| **Admin selects a new replacement file then immediately navigates away** | No blocking prompt in MVP. The file selection is discarded. No API call is made (the Replace File button was not clicked). |
| **Replace file upload fails mid-transfer** | Same handling as A3: error banner in the Replace File section; progress bar stays; "Replace File" button re-enables for retry. The existing file on the server is unchanged. |
| **Thumbnail preview fails to load (current thumbnail URL 404)** | Show type-based placeholder in the preview area. The Replace Thumbnail section is still functional. |
| **Admin replaces thumbnail with an identical image** | Allowed; no duplicate detection. The server creates a new thumbnail entry; version of the thumbnail is not tracked separately in MVP. |
| **Version number shown in UI diverges from server after concurrent edit** | Acceptable for MVP. A manual page refresh restores consistency. |

---

**Assumptions:**
- `GET /api/admin/content/:id` returns the full `ContentItemDTO` including `categoryIds`, `interestIds`, `version`, `thumbnailUrl`, `fileSize`, `duration`, and `type`. The form can pre-fill all fields from this single response.
- Categories and interests are fetched separately (`GET /api/admin/categories`, `GET /api/admin/interests`) to resolve IDs to display names and to populate the multi-select options. These are the same calls made on A3.
- `PUT /api/admin/content/:id` accepts a partial JSON body — only the fields to update need be included. If the admin has not changed categories, the original `categoryIds` array is re-sent unchanged (the form state is pre-filled on load; any PUT sends the current form state).
- The "Replace File" operation increments `ContentItemDTO.version` on the server. Edge devices will detect the version change on next catalog sync and show the "Updated" badge.
- There is no autosave. All changes are explicit user actions (button clicks).

**Risks:**
- An admin who edits metadata and replaces the file in the same session must click two separate buttons. If they forget to click "Save Changes" after editing metadata but do click "Replace File", the metadata edits are lost. Consider adding a warning ("You have unsaved metadata changes") if the admin tries to navigate away — low priority for MVP but a real UX risk.
- Same file-replace risks as A3: large uploads near 100 MB, no resume/chunked upload, connection-sensitive.

**Open questions:**
- Should "Save Changes" stay on A4 on success, or navigate back to A2? The task description allows either. Recommendation: stay on A4 (the admin may want to continue editing or replace the file after saving metadata). This matches the independent-save model.
- Should unsaved metadata changes trigger a "You have unsaved changes — leave?" browser `beforeunload` prompt? Recommended for continuation; skip in MVP.

**De-scope lever:** The "Replace Thumbnail" section is the lowest-value sub-feature of A4. If time is tight, cut it and require admins to delete and re-upload content to change the thumbnail. The `PUT /api/admin/content/:id/thumbnail` endpoint is still implemented (it is shared with the upload flow); only the UI section is removed.

**Continuation notes:** Extract the shared metadata form (title, description, categories, interests) into a `ContentForm` component with a `mode` prop (`'create' | 'edit'`). In `'create'` mode, the file picker section is rendered; in `'edit'` mode, the three independent sections (Metadata, Replace File, Replace Thumbnail) are rendered. This reduces duplication between A3 and A4.

---

### A5 — Category Management

**Purpose:** Allow HQ staff to build and maintain the 2-level category tree used to organize content in the edge Library. Supports create, rename, reorder, and delete operations on both top-level and child categories.

**Entry points:**
- Side navigation link "Categories" from any admin screen.
- Route: `/categories`.

---

#### States

| State | Trigger | UI |
|-------|---------|----|
| **Loading** | Page mounts; `GET /api/admin/categories` in flight | Full-page loading skeleton — placeholder rows for ~3 top-level categories each with 2 child rows |
| **Populated** | API response received with ≥ 1 category | 2-level tree rendered; "Add top-level category" button active |
| **Empty** | API response received with 0 categories | Empty state message; "Add top-level category" button active |
| **Inline create — top-level** | Admin clicks "Add top-level category" | A new input row appears at the bottom of the tree (before any existing categories, or as the first row if empty); cursor focused |
| **Inline create — child** | Admin clicks "Add child" on a top-level row | A new indented input row appears as the last child under that parent; cursor focused |
| **Inline rename** | Admin clicks the Rename icon on any row | The row's name text is replaced by a pre-filled input; cursor focused at end of text |
| **Delete confirmation** | Admin clicks the Delete icon on any row | Confirmation dialog appears; tree is not modified until confirmed |
| **Saving** | Enter pressed on inline input | Input disabled; spinner shown inline; row name updates or error appears |
| **API error** | Server returns non-2xx on any mutation | Inline error message shown near the affected row; input re-enabled for retry |

---

#### Layout (desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  [Side nav]  │  Categories                                  │
│              │                                              │
│              │  [ + Add top-level category ]                │
│              │                                              │
│              │  ──────────────────────────────────────────  │
│              │  Weapons                  [+Add child][✏][🗑] │
│              │      Rifles              [↑][↓]      [✏][🗑] │
│              │      Pistols             [↑][↓]      [✏][🗑] │
│              │      Blades (last child) [↑][ ]      [✏][🗑] │
│              │  ──────────────────────────────────────────  │
│              │  Tactics                  [+Add child][✏][🗑] │
│              │      Urban Combat         [↑][↓]      [✏][🗑] │
│              │  ──────────────────────────────────────────  │
│              │  Medical (no children)    [+Add child][✏][🗑] │
│              │  ──────────────────────────────────────────  │
└─────────────────────────────────────────────────────────────┘
```

Layout notes:
- The left side nav is persistent and shows "Categories" as the active link.
- Top-level category rows are full-width section rows with a bottom divider.
- Child rows are indented (24–32 px left indent) beneath their parent.
- Action buttons are right-aligned within each row. On child rows: `[↑][↓]` reorder arrows, then `[✏]` rename icon, then `[🗑]` delete icon. On top-level rows: `[+ Add child]` text button, then `[✏]`, then `[🗑]`.
- "Add child" button is absent from child rows (max 2 levels, D23).
- All interactive elements meet the 44×44 CSS px minimum touch/click target.
- Inline input rows use the same row height and indentation as the row they replace or follow.

---

#### Actions

| Action | Trigger | API call | Outcome |
|--------|---------|----------|---------|
| **Add top-level category** | Click "Add top-level category" button | — (no call yet) | A new blank input row appears at the bottom of the list with cursor focused |
| **Confirm create (top-level)** | Press Enter with non-empty input | `POST /api/admin/categories` `{ name, parentId: null, sortOrder: <next> }` | Input row replaced by saved row; server-assigned `sortOrder` used |
| **Add child** | Click "+ Add child" on a top-level row | — | A new blank indented input row appears as the last child of that parent |
| **Confirm create (child)** | Press Enter with non-empty input | `POST /api/admin/categories` `{ name, parentId: <parentId>, sortOrder: <next> }` | Input row replaced by saved child row |
| **Cancel create** | Press Escape on inline input | — | Input row removed; tree unchanged |
| **Rename** | Click `[✏]` on any row | — | Row name text replaced by pre-filled input |
| **Confirm rename** | Press Enter with non-empty input | `PUT /api/admin/categories/:id` `{ name }` | Row name updated to new value |
| **Cancel rename** | Press Escape | — | Row reverts to original name |
| **Reorder up** | Click `[↑]` on a child row | `PUT /api/admin/categories/:id` `{ sortOrder: currentSortOrder - 1 }` | Row moves up one position; sibling below takes the previous position |
| **Reorder down** | Click `[↓]` on a child row | `PUT /api/admin/categories/:id` `{ sortOrder: currentSortOrder + 1 }` | Row moves down one position; sibling above takes the previous position |
| **Delete** | Click `[🗑]` on any row | — | Confirmation dialog shown |
| **Confirm delete** | Click "Delete" in dialog | `DELETE /api/admin/categories/:id` | Row (and all its children) removed; toast "Category deleted" |
| **Cancel delete** | Click "Cancel" in dialog | — | Dialog dismissed; tree unchanged |

**Reorder button disabled states:**
- `[↑]` is disabled on the first (top) child of a parent.
- `[↓]` is disabled on the last (bottom) child of a parent.
- Reorder buttons are not present on top-level categories (top-level order is not adjustable in MVP).

---

#### Validation / Constraints

| Rule | Enforcement | Error message |
|------|-------------|---------------|
| Name is required | Client: Enter on empty input is a no-op; server: 400 if empty string | — (client prevents submission) |
| Name must be unique within siblings (same `parentId`) | Server returns 409 | Inline error below the input: "A category with this name already exists here" |
| Max depth = 2 levels (D23) | Client: "Add child" button is hidden on child rows; server enforces via 400 if `parentId` references a child | "Add child" button not visible on child rows |
| Rename: name must not be empty | Client: Enter on empty input is a no-op | — |
| Rename: name must be unique within siblings | Server returns 409 | Inline error below the input: "A category with this name already exists here" |

---

#### Edge Cases

| Scenario | Handling |
|----------|----------|
| **Admin opens inline input then navigates away (clicks side nav)** | Input row is discarded; no API call is made; the navigation proceeds. No "unsaved changes" prompt (low priority for MVP). |
| **Two admins create a category with the same name concurrently** | Second save returns 409; inline error shown; admin must change the name or cancel. |
| **Admin deletes a top-level category that has children** | Confirmation dialog text includes the cascade warning (see Actions table). Server cascade-deletes all child categories (D51). Content items are not deleted — they become uncategorized. |
| **Admin deletes a category that is assigned to content items** | `content_categories` junction rows are removed by the server on cascade delete. Content items remain in the catalog but are no longer associated with that category. Edge devices see the change on next catalog sync. |
| **API call fails during rename or create** | Inline error shown near the row ("Something went wrong — please try again"). Input re-enabled. The row retains the previously saved name (rename) or remains as an unsaved input (create). |
| **Reorder beyond bounds** | Prevented client-side by disabling the `[↑]` / `[↓]` button at the list boundary. |
| **Category list grows very long** | Page is scrollable. No pagination in MVP. |
| **Loading state then API returns 401** | Redirect to login screen with toast "Session expired, please log in again." Shared admin auth error handling. |

---

**Assumptions:**
- `GET /api/admin/categories` returns a flat list; the client builds the tree by grouping on `parentId`. All top-level categories have `parentId: null`; children reference their parent's `id`.
- `sortOrder` values are integers starting at 0. When a new child is created, the client sends `sortOrder: <count of existing siblings>` as a starting value. The server does not enforce contiguous values; gaps are acceptable.
- Reorder operations send only `{ sortOrder }` in the PUT body. The server updates the target row; the client swaps the two adjacent siblings visually (optimistic update on success response).
- The rename and create inline inputs are mutually exclusive: opening one input closes any other open input (or the other input must be confirmed/cancelled first). Only one inline edit is active at a time.

**Risks:**
- If two children have the same `sortOrder` due to a race condition or migration seed, the sort order displayed is undefined. Recommend the server assigns unique `sortOrder` on create and enforces uniqueness within siblings — or that the client handles ties gracefully (stable sort).
- The optimistic reorder swap may briefly show the wrong order if the PUT fails. Recommended: refresh the category list on any reorder failure rather than rolling back manually.

**Open questions:**
- Should top-level category order be adjustable? Current spec: no (reorder arrows are children-only). If needed, the same arrow mechanism applies; this is a minor addition.
- Is there a maximum number of categories in MVP? Not specified. The page should remain usable up to ~50 categories without pagination.

**De-scope lever:** If category management is too complex to implement fully, seed categories via a DB migration and make this page read-only (display-only tree, no edit controls). The `GET /api/admin/categories` endpoint is still needed by the upload and edit forms, so the read path is required regardless.

**Continuation notes:** Drag-and-drop reordering (replacing the `[↑][↓]` arrows) is the natural continuation enhancement. Use a library such as `dnd-kit` or `react-beautiful-dnd`. The `sortOrder` data model already supports arbitrary integer ordering, so no schema change is needed.

---

### A6 — Interest Management

**Purpose:** Allow HQ staff to manage the flat list of interest tags. Interests are used to filter the Reels feed on edge devices and to tag content items. Supports create, rename, and delete.

**Entry points:**
- Side navigation link "Interests" from any admin screen.
- Route: `/interests`.

---

#### States

| State | Trigger | UI |
|-------|---------|----|
| **Loading** | Page mounts; `GET /api/admin/interests` in flight | Full-page loading skeleton — placeholder rows for ~4 interest items |
| **Populated** | API response received with ≥ 1 interest | Flat list of interest rows; "Add Interest" button active |
| **Empty** | API response received with 0 interests | Empty state message; "Add Interest" button active |
| **Inline create** | Admin clicks "Add Interest" | A new blank input row appears at the top of the list; cursor focused |
| **Inline rename** | Admin clicks the Rename icon on a row | Row name replaced by pre-filled input; cursor focused at end |
| **Delete confirmation** | Admin clicks the Delete icon on a row | Confirmation dialog appears |
| **Saving** | Enter pressed on inline input | Input disabled; spinner shown inline; row updates or error appears |
| **API error** | Server returns non-2xx on any mutation | Inline error shown near the affected row; input re-enabled for retry |

---

#### Layout (desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  [Side nav]  │  Interests                                   │
│              │                                              │
│              │  [ + Add Interest ]                          │
│              │                                              │
│              │  ──────────────────────────────────────────  │
│              │  Urban Combat                        [✏][🗑] │
│              │  ──────────────────────────────────────────  │
│              │  Vehicle Operations                  [✏][🗑] │
│              │  ──────────────────────────────────────────  │
│              │  First Aid                           [✏][🗑] │
│              │  ──────────────────────────────────────────  │
│              │  Weapons Handling                    [✏][🗑] │
│              │  ──────────────────────────────────────────  │
└─────────────────────────────────────────────────────────────┘
```

Layout notes:
- The left side nav shows "Interests" as the active link.
- Each interest occupies a full-width row with a bottom divider.
- Interest name is left-aligned. Action icons (`[✏]` rename, `[🗑]` delete) are right-aligned.
- There is no indentation or hierarchy — the list is flat.
- All interactive elements meet the 44×44 CSS px minimum touch/click target.
- Inline input rows use the same height as regular rows.
- New interest input row appears at the top of the list (below the "Add Interest" button), not at the bottom, so it is immediately visible without scrolling.

---

#### Actions

| Action | Trigger | API call | Outcome |
|--------|---------|----------|---------|
| **Add Interest** | Click "+ Add Interest" button | — | A new blank input row appears at the top of the list |
| **Confirm create** | Press Enter with non-empty input | `POST /api/admin/interests` `{ name }` | Input row replaced by saved interest row |
| **Cancel create** | Press Escape | — | Input row removed; list unchanged |
| **Rename** | Click `[✏]` on a row | — | Row name replaced by pre-filled input |
| **Confirm rename** | Press Enter with non-empty input | `PUT /api/admin/interests/:id` `{ name }` | Row name updated |
| **Cancel rename** | Press Escape | — | Row reverts to original name |
| **Delete** | Click `[🗑]` on a row | — | Confirmation dialog shown |
| **Confirm delete** | Click "Delete" in dialog | `DELETE /api/admin/interests/:id` | Row removed; toast "Interest deleted" |
| **Cancel delete** | Click "Cancel" in dialog | — | Dialog dismissed; list unchanged |

---

#### Validation / Constraints

| Rule | Enforcement | Error message |
|------|-------------|---------------|
| Name is required | Client: Enter on empty input is a no-op | — (client prevents submission) |
| Name must be globally unique | Server returns 409 | Inline error below the input: "This interest name already exists" |
| Rename: name must not be empty | Client: Enter on empty input is a no-op | — |
| Rename: new name must be unique | Server returns 409 | Inline error below the input: "This interest name already exists" |

---

#### Edge Cases

| Scenario | Handling |
|----------|----------|
| **Admin deletes an interest that is assigned to content items** | Server removes all `content_interests` junction rows for the deleted interest. Content items are not deleted. Edge devices: on the next catalog sync, the deleted interest ID is absent from the catalog; the SPA removes it from `DeviceProfile.selectedInterestIds` if present (orphan cleanup per API contract §10.4). |
| **Admin deletes an interest currently selected by edge devices** | As above — edge orphan cleanup handles this on next sync. No real-time push. Devices that are offline at the time of deletion will clean up the stale ID when they next sync (D17). |
| **Duplicate name collision on create** | Server returns 409; inline error "This interest name already exists" shown below the input. Input remains active for correction. |
| **Duplicate name collision on rename** | Same as create — 409 → inline error. Row retains original name until the admin confirms a valid new name or cancels. |
| **API call fails during create or rename** | Inline error shown near the row ("Something went wrong — please try again"). Input re-enabled. |
| **Admin has inline input open and clicks side nav** | Input row discarded; navigation proceeds. No confirmation prompt. |
| **Interest list grows very long** | Page is scrollable. No pagination in MVP. |
| **Loading state then API returns 401** | Redirect to login screen with toast "Session expired, please log in again." |

---

**Assumptions:**
- Interest names are globally unique (unlike category names which are sibling-scoped). The `POST` and `PUT` endpoints enforce this via 409 Conflict.
- The interests list on this page is for management only. The multi-select on A3 / A4 fetches the same data from the same endpoint — changes here are reflected immediately on the next load of A3 / A4.
- There is no `sortOrder` field on interests. The list is displayed in creation order (`createdAt` ascending) on this page. The `GET /api/admin/interests` response order is not specified in the API contract; the client should sort by name alphabetically for consistent display.
- Only one inline edit (create or rename) is active at a time. Opening a second input closes any previously open input.

**Risks:**
- Deleting an interest that is heavily used across content items removes all associations silently. The confirmation dialog warns about edge device sync, but there is no count of affected items shown. Recommend displaying "This interest is used by N content items" in the dialog — low effort, high value. Deferred to continuation.
- Edge devices with the deleted interest in `DeviceProfile.selectedInterestIds` will see an empty feed until they sync (if all their interests were deleted). No in-app warning. Acceptable for MVP.

**Open questions:**
- Should the list be sorted alphabetically or by creation date? Recommendation: alphabetical (easier for admins to scan). The `GET /api/admin/interests` endpoint does not specify a sort order; the client applies client-side sort.
- Should the admin see how many content items use each interest (a usage count column)? Not in MVP; would require a join query or a separate API. Addition candidate.

**De-scope lever:** If interest management is too complex, seed interests via a DB migration and make this page read-only (display-only list, no edit controls). The `GET /api/admin/interests` endpoint is still required by the upload and edit forms regardless.

**Continuation notes:** Add a usage count column ("Used by N items") to each row — requires either a join in the `GET /api/admin/interests` response or a separate count endpoint. Add confirmation enhancement: show the count of affected content items in the delete dialog. Interest search/filter on this page (for large interest lists) is a further continuation item.

---
