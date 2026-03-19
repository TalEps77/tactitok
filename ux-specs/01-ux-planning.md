# UX Planning — TactiTok

> **Version:** 0.1
> **Status:** Draft
> **Created:** 2026-03-19
> **Depends on:** `00-repo-ux-discovery.md`

---

## 1. Information Architecture

### 1.1 Edge SPA

```
App Root
│
├── [First-run gate: DeviceProfile.selectedInterestIds is empty]
│   └── Interest Selection Screen           ← one-time only
│
└── [Main app: tab bar always visible]
    ├── Tab 1 — Reels
    │   ├── Reels Feed                       ← default view
    │   ├── Reels Content Overlay            ← overlaid on video (not a route)
    │   └── Video Player                     ← same view, full-screen playback
    │
    ├── Tab 2 — Library
    │   ├── Library View                     ← category tree + search
    │   │   └── [tap category child]
    │   │       └── Content List             ← filtered by category
    │   └── Library Detail / Content Item
    │       ├── → Video Player               ← standalone (no swipe nav)
    │       └── → PDF Viewer
    │
    └── Tab 3 — Downloads
        └── Downloads Tab
            ├── → Video Player               ← offline playback
            └── → PDF Viewer                 ← offline render
```

**Settings entry point** (Should priority):
- A gear icon or "Edit Interests" link in the Reels tab header
- Opens: Change Interests Sheet/Screen (reuses Interest Selection layout)

---

### 1.2 Admin Portal

```
Admin Root
│
├── [Auth gate: no valid JWT in sessionStorage]
│   └── Login Screen
│
└── [Main app: side nav or top nav]
    ├── Content List                          ← default after login
    │   ├── → Upload Content
    │   └── → Edit Content
    ├── Category Management
    └── Interest Management
```

---

## 2. Navigation Model

### 2.1 Edge SPA Navigation

| Element | Type | Behaviour |
|---------|------|-----------|
| Bottom tab bar | Persistent (all main screens) | 3 tabs: Reels / Library / Downloads. Hidden during full-screen video playback in Reels. |
| Reels feed | In-tab scroll | Vertical snap scroll. No route change per item. |
| Library drill-down | Stack navigation | Category list → Content list → Detail. Back button visible. |
| Video Player (from Library) | Push navigation | Opens over Library Detail. Back closes player. |
| PDF Viewer (from Library) | Push navigation | Opens over Library Detail. Back closes viewer. |
| Video Player (from Downloads) | Push navigation | Opens over Downloads list. Back closes player. |
| PDF Viewer (from Downloads) | Push navigation | Opens over Downloads list. Back closes viewer. |
| Interest Selection | Full-screen gate | Shown before main app on first run; no back button. |
| Change Interests (settings) | Modal sheet | Opened from Reels header; dismissible. |

**Tab bar visibility rules:**
- Visible: all Library and Downloads screens
- Visible: Reels feed (with overlays)
- Hidden: full-screen Video Player launched from Reels
- Hidden: full-screen Video Player launched from Library/Downloads (depends on design choice — either persistent or hidden during playback; see UQ2)

---

### 2.2 Admin Portal Navigation

| Element | Type | Behaviour |
|---------|------|-----------|
| Side nav (desktop) | Persistent | Links to Content, Categories, Interests. Active state per section. |
| Content List | Default landing | Shown after login. |
| Upload Content | Route / page | Navigated to from Content List "Upload" button. Back returns to Content List. |
| Edit Content | Route / page | Navigated to from Content List row action. Back returns to Content List. |
| Category Management | Route / page | Full-page tree editor. |
| Interest Management | Route / page | Full-page list editor. |
| Login | Auth gate | Shown when no valid JWT. Replaced by main app on login. |

---

## 3. Screen Inventory

### 3.1 Edge SPA — Screen List

| # | Screen | Route / layer | Priority | Notes |
|---|--------|--------------|----------|-------|
| E1 | Interest Selection | `/onboarding` or gate | Must | First-run; gated by empty DeviceProfile |
| E2 | Reels Feed | `/` (tab 1) | Must | Default view after onboarding |
| E3 | Reels Content Overlay | Overlaid on E2 | Must | Not a separate route; rendered over video |
| E4 | Video Player (Reels) | Full-screen layer over E2 | Must | Auto-play, swipe nav |
| E5 | Library View | `/library` (tab 2) | Must | Category tree + search |
| E6 | Library Detail / Content Item | `/library/item/:id` | Must | Opens player or PDF viewer |
| E7 | Video Player (standalone) | `/library/item/:id/play` | Must | Same component as E4, no swipe nav |
| E8 | PDF Viewer | `/library/item/:id/pdf` | Must | PDF.js, page nav, download button |
| E9 | Downloads Tab | `/downloads` (tab 3) | Must | Offline-capable list |
| E10 | Change Interests | Sheet over E2 | Should | De-scope lever #6 |

**Total: 9 distinct screens + 1 modal sheet (E10).**

---

### 3.2 Admin Portal — Screen List

| # | Screen | Route | Priority | Notes |
|---|--------|-------|----------|-------|
| A1 | Login | `/login` | Must | Auth gate; shared password |
| A2 | Content List | `/content` | Must | Main dashboard |
| A3 | Upload Content | `/content/new` | Must | Multipart form |
| A4 | Edit Content | `/content/:id/edit` | Must | Pre-filled form |
| A5 | Category Management | `/categories` | Must | 2-level tree CRUD |
| A6 | Interest Management | `/interests` | Must | Flat list CRUD |

**Total: 6 screens.**

---

## 4. Data Flow per Screen

### 4.1 Edge SPA Data Sources

| Screen | Primary data source | Secondary |
|--------|-------------------|-----------|
| Interest Selection | `CachedCatalog.interests` (from IndexedDB after first sync) | — |
| Reels Feed | `CachedCatalog.items` filtered by type=video + `DeviceProfile.selectedInterestIds` | `LocalAction` (like/save state) |
| Video Player (Reels) | `<video src="/api/content/{id}/file?v={version}">` via proxy | `LocalAction`, `DownloadRecord` |
| Library View | `CachedCatalog.categories` + `CachedCatalog.items` | — |
| Library Detail | `CachedCatalog.items[id]` | `LocalAction`, `DownloadRecord` |
| Video Player (standalone) | Same as Reels player | Same |
| PDF Viewer | `fetch("/api/content/{id}/file?v={version}")` → PDF.js | `DownloadRecord` |
| Downloads Tab | `DownloadRecord[]` from IndexedDB | `CachedCatalog.items` (for version comparison) |
| Change Interests | `CachedCatalog.interests` | `DeviceProfile.selectedInterestIds` |

### 4.2 Admin Portal Data Sources

| Screen | Primary data source | Write targets |
|--------|-------------------|---------------|
| Content List | `GET /api/admin/content` | — |
| Upload Content | — | `POST /api/admin/content` |
| Edit Content | `GET /api/admin/content/:id` | `PUT /api/admin/content/:id`, `PUT .../file`, `PUT .../thumbnail` |
| Category Management | `GET /api/admin/categories` | `POST/PUT/DELETE /api/admin/categories` |
| Interest Management | `GET /api/admin/interests` | `POST/PUT/DELETE /api/admin/interests` |

---

## 5. Shared UI Patterns

### 5.1 Edge SPA

| Pattern | Used on | Description |
|---------|---------|-------------|
| **Network status chip** | All screens | Fixed position (top-right). Shown as "Offline" badge when cloud unreachable (`GET /api/health` fails). Hidden when online. |
| **Type badge** | Content cards, Downloads list, Library Detail | Small pill showing "VIDEO" or "PDF". |
| **Updated badge** | Downloads list items | Small dot or "Updated" pill on DownloadRecord items where `catalog.version > downloadRecord.version`. |
| **Download button states** | Reels overlay, Library Detail | Three states: default (download icon), downloading (progress spinner or bar), downloaded (checkmark / "Downloaded" label — disabled). |
| **Like/Save button states** | Reels overlay | Two states each: active (filled icon) / inactive (outline icon). No navigation on tap. |
| **Empty state** | Reels feed, Library category, Downloads, search results | Centered icon + heading + body text. Per-screen messaging. |
| **Loading state** | Any async data fetch | Skeleton screens or spinner. Reels: buffering indicator over video. |
| **Tab bar** | All main screens | 3 tabs with icons + labels: Reels / Library / Downloads. Active tab highlighted. |

### 5.2 Admin Portal

| Pattern | Used on | Description |
|---------|---------|-------------|
| **Confirmation dialog** | Delete content, delete category, delete interest | "Are you sure? This cannot be undone." — Cancel / Confirm (destructive colour). |
| **Toast notification** | After save, upload complete, delete | Non-blocking success/error message. Auto-dismiss in 3s. Errors persist until dismissed. |
| **Upload progress bar** | Upload Content, Edit Content (file replacement) | Shown during multipart upload. Indeterminate until server responds; disappears on success. |
| **Form validation inline** | All forms | Field-level error messages below inputs. Shown on blur or submit attempt. |
| **Loading skeleton** | Content List, Category Management | Placeholder rows while API response loads. |

---

## 6. Tablet Interaction Model (Edge SPA)

| Interaction | Method | Notes |
|-------------|--------|-------|
| Advance to next video | Swipe up (primary) | Touch event; Hammer.js or native touchstart/touchend |
| Return to previous video | Swipe down (primary) | Same |
| Arrow fallback | Visible arrow hit-targets on left/right edges (secondary) | Shown only on first load or hover; semi-transparent overlay |
| Tap video | Toggle play/pause | Single tap on video area |
| Tap overlay button (like/save/download) | Tap | Standard touch target ≥ 44×44pt |
| Long-press | Not used in MVP | |
| Pinch zoom | Not used in MVP | PDF viewer uses page-by-page only |
| Scroll in Library | Vertical scroll | Standard touch scroll |

---

## 7. Layout Constraints

| Constraint | Source | UX impact |
|-----------|--------|-----------|
| 10" tablet, landscape + portrait | North Star §3, CAP-1.3 | All layouts must work in both orientations. Reels feed is portrait-optimised. Library is landscape-friendly with category sidebar. |
| Chrome kiosk mode | North Star §3 | No browser chrome visible. No URL bar. App must fill the viewport. Use `100dvh` / `100dvw`. |
| Min touch target | Accessibility best practice | 44×44 CSS pixels minimum for all tappable elements. |
| No native app install | Architecture | No PWA install prompt. No splash screen beyond 2s load. |

---

## 8. Unresolved UX Questions (Carried Forward)

See `00-repo-ux-discovery.md` §4 for full list. Summary:

| # | Question | Impact | Recommended default |
|---|---------|--------|-------------------|
| UQ1 | Scroll progress indicator in Reels? | Low | No |
| UQ2 | Standalone player: tab bar visible or hidden? | Medium | Hidden (full-screen) |
| UQ3 | Tap Download on already-downloaded item? | Low | Show "Downloaded" disabled state |
| UQ4 | Change Interests: screen or sheet? | Low | Bottom sheet |
| UQ5 | Category reorder: drag-and-drop or arrows? | Medium | Up/down arrows (MVP) |
| UQ6 | Upload form: auto-detect type or explicit selector? | Low | Auto-detect |
| UQ7 | Admin: orphan warning on interest delete? | Low | No warning in MVP |
