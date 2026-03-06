# North Star v0.1 — TactiTok

## 1) One-liner Vision (one sentence)
- Turn “doom-scrolling” during wartime into short, accessible, up-to-date operational learning—even under non-ideal connectivity conditions.

## 2) Problem Statement (2–4 bullets)
- There is currently no centralized, convenient way to deliver up-to-date training content to fighters at the edge during combat.
- Training today depends on face-to-face / ad-hoc delivery (PDFs in unsuitable channels), so updates don’t arrive in time or aren’t consumed.
- Under limited bandwidth and a kiosk-like experience, consuming video/documents becomes cumbersome and inconsistent.
- It’s hard to “pull” learning naturally during short rest breaks—without an experience that feels like normal, habitual usage.

## 3) Target Users & Context (who, where, when)
- **Primary:** Fighters at the edge (usually single-user) who need to learn/refresh knowledge during operations.
- **Secondary:** Training/content staff who create and upload content and manage categories.
- **Context:** ~10" tablet in the field; sometimes projected for a team.
- **Runtime:** Windows running a Linux VM; the client is Chrome on Windows; everything is in the browser (including PDF).
- **Connectivity:** Unstable / limited bandwidth; a local download/offline component is required.

## 4) Value Proposition (3–5 bullets)
- Immediate availability of up-to-date content (short video + PDF) instead of face-to-face / ad-hoc training.
- A “TikTok-like” consumption experience that builds a learning habit during rest breaks—without repeated effort to search each time.
- An organized library with search and a category tree to find material “when there’s a question.”
- Reasonable experience even under weak connectivity: smart streaming + local download by choice / basic recommendation.
- Clean infrastructure for continued development after the students (without major rework).

## 5) Core Flows (1–3 flows; Trigger → Steps → Outcome)

### Flow A — Browse “Reels” Learning
- **Trigger:** Rest time / desire to “scroll” short content.
- **Steps:**
  - Open the app → select interests (or default).
  - Scroll a feed of short videos.
  - Playback: prefetch the start of the video → stream the rest; option “Download for offline viewing.”
  - Basic Like/Save (no advanced recommendation algorithm).
- **Outcome:** Smooth viewing of short, relevant videos + ability to save for later/offline.

### Flow B — Find Content in Library
- **Trigger:** A specific question / need guidance on a feature/weapon system.
- **Steps:**
  - Enter the library → navigate the category tree or search.
  - Open a content item (PDF or video).
  - View/read inside Chrome; optional local download (PDF/video).
- **Outcome:** Quickly find focused material and consume it reliably at the edge.

### Flow C — Content Upload & Catalog Admin (Web)
- **Trigger:** Training staff want to add/update content.
- **Steps:**
  - Enter the admin interface.
  - Upload video/PDF + metadata (title, description, categories, tags/interests, version/date).
  - Manage basic category tree (CRUD).
  - Publish → content appears in the catalog; the edge receives metadata quickly, and content is fetched on demand.
- **Outcome:** Content is organized and published quickly, available at the edge via an up-to-date catalog.

## 6) MVP Boundary

### In Scope (5–12 bullets)
- Web application in Chrome (edge) + content management portal (server).
- Content catalog with metadata: categories, tags/interests, type (video/PDF), date/version.
- Library with category tree + basic search.
- “Reels” feed with scrolling and short-video playback.
- Minimal “smooth” video experience: prefetch start-of-video + adaptive/graded streaming for the rest (MVP).
- Manual local download for items (video/PDF) + basic “Downloaded” management.
- Hybrid mode: metadata updates when connectivity exists; content itself is fetched on demand based on need.
- No permissions/identities at this stage (userless kiosk), but with a local “device profile” (interest selection) that is persisted.
- UI optimized for a 10" tablet, kiosk mode, and network constraints.
- A base for expansion: clear layers (content, catalog, delivery/offline, UI).

### Out of Scope (5–12 bullets)
- Advanced recommendations/personalization (more of what I liked).
- Detailed analytics/usage monitoring/dashboards.
- Full permissions/user management/roles (RBAC).
- Chat, comments, sharing, social features.
- Advanced DRM/complex rights management.
- Smart “push” scheduling and automatic prioritization of content packages (beyond basics).
- Integrations with existing military systems / organizational SSO.
- Translation/auto-subtitles / AI summarization.
- Complex version management (rollback, diff, multi-step approvals).

## 7) Success Metrics (measurable for demo + usage)
- End-to-end demo works: upload → publish → appears in catalog → consumed at the edge (video+PDF) → local download → view even without network.
- “Found what I needed” time in the library: ≤ 30–60 seconds in a demo scenario.
- Reels experience: playback starts within ≤ 1–2 seconds under reasonable network; under weak conditions—fast start via prefetch.
- 100% of display and consumption inside Chrome (including PDF) in a kiosk environment.
- At least 2–3 selectable “interests” consistently filter the feed/library.

## 8) Hard Constraints
- **Time:** MVP development in 8–10 weeks + stabilization time through the end of 12 weeks.
- **Tech constraints:**
  - Runs on Linux (in a VM) with a Chrome client on Windows.
  - Everything in the browser (including PDF viewer).
  - Kiosk / ruggedized computing environment.
- **Offline/Online:** Hybrid—metadata updates when network exists; content is fetched on demand + local download as needed.
- **Security/Privacy:**
  - Assume sensitive content → minimum exposure: store locally only what was downloaded; avoid unnecessary telemetry in MVP.
  - No user auth currently—need a clear boundary for how access is protected in the demo environment (e.g., internal network / lab environment).

## 9) Key Assumptions (3–8)
- Chrome capabilities can be used for download and local persistence (e.g., local storage/cache/IndexedDB) sufficiently for an MVP in kiosk mode.
- A video format/distribution setup can be defined that supports minimal prefetch + continued streaming.
- Training staff can upload content via a simple portal without complex approval processes.
- Basic categories/interests are sufficient to create “relevance” without a recommendation algorithm.
- The demo environment will allow a server reachable by the edge at least intermittently for metadata sync.

## 10) Top Risks (3–6)
- A “TikTok” experience is hard to achieve under weak bandwidth without good streaming/prefetch design—risk to the demo “WOW.”
- Offline caching in the browser in kiosk mode may be limited/inconsistent (browser policy, cache clearing, OS permissions).
- Without user authentication, security/access considerations may become an organizational blocker—even for an MVP.
- Category and metadata management may become complex if a simple taxonomy isn’t defined.
- A gap between “library” and “feed” if a clear interests↔categories mapping isn’t defined.

## 11) Open Decisions (must be closed before PRD)
- What the MVP offline mechanism is in practice: what is stored locally, how much space, and how “Downloaded” is managed.
- What video protocol/format to use for MVP to support prefetch + continued streaming (minimal).
- Whether metadata arrives via push or pull (MVP recommendation: periodic pull / on app open; push only if an existing channel exists).
- Minimum security level for the demo (network allowlist / admin password for portal / environmental isolation).
- How “interests” are defined: fixed list? hierarchical? who manages it and in what UI.