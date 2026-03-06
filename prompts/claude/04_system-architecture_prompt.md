# 04_system-architecture_prompt.md

## Title
Claude Prompt — System Architecture for TactiTok

## Purpose
You are working on the **TactiTok** project.

Your job in this interaction is to create or update the **System Architecture** document for the repo.

This is the **fourth core document** after the Product Brief, System Boundaries, and MVP Spec.  
Assume the repo may already contain:
- a `README.md`
- the North Star
- the prompt files
- a generated Product Brief
- a generated System Boundaries document
- a generated MVP Spec
- notes/decisions/assumptions folders

You must be **repo-aware**:
1. Review the existing repo files first.
2. Use the North Star as the binding source of truth.
3. Reuse the Product Brief if it exists.
4. Reuse the System Boundaries document if it exists.
5. Reuse the MVP Spec if it exists.
6. If one or more do not exist yet, explicitly say so and proceed using the North Star plus whatever is available.
7. Update/create only what is necessary for this task.

---

## Operating mode
You must follow this exact sequence.

### Phase 0 — Repo Review
Before asking questions:
- Inspect the repository structure and identify what already exists.
- Look specifically for:
  - `product/north-star.md`
  - `product/01_product-brief.md`
  - `product/02_system-boundaries.md`
  - `product/03_mvp-spec.md`
  - `prompts/claude/`
  - `notes/`
  - any assumptions / decisions files
- Summarize current repo state in **3–7 bullets**:
  - what exists
  - what is missing
  - what is inconsistent or risky
  - whether the Product Brief is already present
  - whether the System Boundaries document is already present
  - whether the MVP Spec is already present

Do not rewrite files during this phase.

### Phase 1 — Discovery
Ask focused clarification questions first, with a hard maximum of **12**, grouped under:
- Runtime & Deployment Context
- Major Components & Responsibilities
- Offline / Sync / Delivery Behavior
- Security / Trust / Operations
- Success & Acceptance

Important rules:
- Ask only questions needed to define the **System Architecture**.
- Do not ask broad product questions already answered by the North Star.
- Do not re-open Product Brief, System Boundaries, or MVP Spec questions unless they directly affect architecture.
- If the repo already contains earlier documents, use them to avoid duplicate questions.
- Prioritize questions that help decide:
  - the minimum component set
  - the main boundaries and interfaces
  - the simplest viable deployment model
  - the main architectural risks
- If a sensible default is obvious, state it as a proposed assumption instead of blocking.

### Phase 2 — Draft / Update
After I answer, create or update the System Architecture document.

You must:
1. Define the minimum architecture needed to realize the MVP.
2. Identify the major components and their responsibilities.
3. Describe how the edge client, admin side, backend, storage, and content delivery fit together.
4. Describe the runtime/deployment model at a practical level.
5. Describe how offline/download behavior fits architecturally.
6. Identify the main interfaces and dependencies without dropping into endpoint-level API design.
7. Keep the design small enough for **3 student developers / 8–10 weeks**, but continuation-ready.

### Phase 3 — Quality Gate
Run a self-check against:
- feasible for **3 student developers / 12 weeks**
- MVP implementable in **8–10 weeks**
- supports an **end-to-end prototype**, not a disconnected slice
- consistent with the Product Brief, System Boundaries, and MVP Spec
- simple enough to build and demo
- explicit enough to guide data model and API work
- avoids premature over-engineering
- continuation-ready without major rewrites

If it fails, propose a smaller **v0.1 / v0.05** architecture.

---

## Mandatory constraints
These are binding:
- The project is a prototype but must be **continuation-ready** later, without major rewrites.
- Prefer the **simplest viable architecture** that still supports later extension.
- Be precise, engineering-ready, and low-fluff.
- Do **not** change the North Star silently.
- If you think the North Star should change:
  1. explain why
  2. propose the smallest edit
  3. ask for explicit approval
  4. only then apply it

---

## Specific goal of this document
This document should answer:

- What the main system components are
- What each component is responsible for
- What runs on the edge device, what runs on the server side, and what external infrastructure is assumed
- How content metadata, PDFs, videos, and local downloads are handled at a high level
- How the system behaves under intermittent connectivity
- What the main interfaces are between components
- What architectural choices are intentionally deferred

This document is intended to reduce ambiguity before:
- Data Model
- API Contract
- Delivery Plan

---

## Target output document path
Write or update:

`product/04_system-architecture.md`

You may also update a small supporting notes file only if necessary, such as:
- `notes/assumptions.md`
- `notes/decisions.md`

Do not create new core product documents beyond the 7-document set.

---

## Required output format after discovery answers
When you move to drafting/updating, respond in this structure:

1. **Repo state summary**
2. **Assumptions**
3. **Architecture overview**
4. **Files to create/update**
   - one subsection per file
   - include full contents
5. **System Architecture quality gate**
6. **Open questions / pending decisions**
7. **De-scope lever**
8. **Continuation notes**

---

## System Architecture document requirements
The System Architecture document must be:
- bullet-first
- concise but complete
- explicit
- written as a decision-support artifact for engineering implementation

It must include at minimum these sections:

1. **Purpose of this document**
2. **Architecture goals**
3. **Definitions / terms**
4. **Architectural drivers**
5. **High-level architecture overview**
6. **Major components**
7. **Component responsibilities**
8. **Runtime / deployment view**
9. **Data/content flow overview**
10. **Offline / sync / local persistence approach**
11. **Security / trust / operational considerations**
12. **External dependencies**
13. **Key architectural decisions**
14. **Alternatives considered or intentionally deferred**
15. **Assumptions**
16. **Risks**
17. **Open questions / pending decisions**
18. **De-scope lever**
19. **Continuation notes**

### Additional requirements
- Separate **product capability** from **architectural realization**.
- Be explicit about the architectural role of:
  - edge web client
  - admin/content-management UI
  - backend service layer
  - metadata/catalog storage
  - binary content storage/delivery
  - browser-local persistence/download management
- Include a **high-level component diagram in text form**, for example:
  - bullet hierarchy
  - ASCII block view
  - simple structured diagram notation
- Do not write endpoint-level API contracts yet.
- Do not fully design the data model yet.
- Do not lock detailed implementation choices more than necessary.
- Do not add enterprise-scale components unless clearly justified by MVP needs.

---

## Guidance for architectural framing
Unless the user answers otherwise, prefer a simple MVP architecture such as:

### Candidate architectural shape
- **Edge client**
  - browser-based app running in Chrome
  - reels/feed UI
  - library/search UI
  - PDF/video viewing
  - local device preferences and downloaded-items state
- **Admin portal**
  - browser-based content/admin UI
  - upload/edit/publish flow
  - category management
- **Backend application**
  - serves metadata/catalog APIs
  - handles admin mutations
  - exposes content references
  - mediates publish/update behavior
- **Metadata persistence**
  - stores content records, categories, tags/interests, versions, publish state
- **Binary content storage**
  - stores PDF/video files
  - supports browser access/streaming/download
- **Hybrid connectivity behavior**
  - metadata refresh when online
  - content fetched on demand
  - local access to manually downloaded items

### Candidate deferred choices
- advanced streaming/CDN sophistication
- event-driven architecture
- distributed services/microservices
- enterprise IAM/SSO integration
- analytics pipeline
- advanced observability platform
- smart push-delivery orchestration
- heavy offline packaging system

Use this only as a starting point, not as a substitute for discovery.

---

## Current known project state
Assume:
- this project is **TactiTok**
- the repo was intended to be bootstrapped by the first prompt
- the Product Brief may or may not already be generated
- the System Boundaries document may or may not already be generated
- the MVP Spec may or may not already be generated
- no tech stack should be treated as locked unless present in repo files
- the North Star is authoritative
- this document should turn the agreed product scope into a practical architectural shape without prematurely over-designing implementation

---

## Authoritative North Star (binding; include verbatim as source of truth)

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

Start now with **Phase 0 — Repo Review** and then continue to **Phase 1 — Discovery** only.