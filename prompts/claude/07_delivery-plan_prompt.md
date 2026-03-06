# 07_delivery-plan_prompt.md

## Title
Claude Prompt — Delivery Plan for TactiTok

## Purpose
You are working on the **TactiTok** project.

Your job in this interaction is to create or update the **Delivery Plan** document for the repo.

This is the **seventh core document** after the Product Brief, System Boundaries, MVP Spec, System Architecture, Data Model, and API Contract.  
Assume the repo may already contain:
- a `README.md`
- the North Star
- the prompt files
- a generated Product Brief
- a generated System Boundaries document
- a generated MVP Spec
- a generated System Architecture document
- a generated Data Model document
- a generated API Contract document
- notes/decisions/assumptions folders

You must be **repo-aware**:
1. Review the existing repo files first.
2. Use the North Star as the binding source of truth.
3. Reuse the Product Brief if it exists.
4. Reuse the System Boundaries document if it exists.
5. Reuse the MVP Spec if it exists.
6. Reuse the System Architecture document if it exists.
7. Reuse the Data Model document if it exists.
8. Reuse the API Contract document if it exists.
9. If one or more do not exist yet, explicitly say so and proceed using the North Star plus whatever is available.
10. Update/create only what is necessary for this task.

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
  - `product/04_system-architecture.md`
  - `product/05_data-model.md`
  - `product/06_api-contract.md`
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
  - whether the System Architecture document is already present
  - whether the Data Model document is already present
  - whether the API Contract document is already present

Do not rewrite files during this phase.

### Phase 1 — Discovery
Ask focused clarification questions first, with a hard maximum of **12**, grouped under:
- Team & Capacity
- Milestones & Timeline
- Scope Priorities & Dependencies
- Demo / Testing / Stabilization Needs
- Success & Acceptance

Important rules:
- Ask only questions needed to define the **Delivery Plan**.
- Do not ask broad product questions already answered by the North Star.
- Do not re-open Product Brief, System Boundaries, MVP Spec, System Architecture, Data Model, or API Contract questions unless they directly affect sequencing, ownership, or delivery risk.
- If the repo already contains earlier documents, use them to avoid duplicate questions.
- Prioritize questions that help decide:
  - the minimum milestone plan
  - workstream sequencing
  - dependency order
  - team split for 3 student developers
  - de-scope and risk handling
  - what must be ready for demo versus what can slip
- If a sensible default is obvious, state it as a proposed assumption instead of blocking.

### Phase 2 — Draft / Update
After I answer, create or update the Delivery Plan document.

You must:
1. Define a realistic delivery plan for **3 student developers** over **~12 weeks**, with MVP target in **8–10 weeks** and stabilization/demo hardening afterward.
2. Break the work into clear milestones and workstreams.
3. Show dependencies and recommended sequencing.
4. Propose a practical team split.
5. Identify what should be built first, what can run in parallel, and what should be left late only if necessary.
6. Include explicit de-scope levers and contingency thinking.
7. Keep the plan small enough to be realistic, but concrete enough to execute.

### Phase 3 — Quality Gate
Run a self-check against:
- feasible for **3 student developers / 12 weeks**
- MVP implementable in **8–10 weeks**
- supports an **end-to-end prototype**, not a disconnected slice
- consistent with the Product Brief, System Boundaries, MVP Spec, System Architecture, Data Model, and API Contract
- explicit enough to guide backlog slicing and ownership
- minimal enough to avoid accidental scope creep
- includes stabilization/demo hardening
- continuation-ready without major rewrites

If it fails, propose a smaller **v0.1 / v0.05** delivery scope.

---

## Mandatory constraints
These are binding:
- The project is a prototype but must be **continuation-ready** later, without major rewrites.
- Prefer the **smallest realistic delivery plan** that still yields an end-to-end MVP.
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

- How the team should deliver the MVP over the semester
- What the milestone structure should be
- What the major workstreams are
- Which tasks must happen sequentially versus in parallel
- How the work should be split across 3 developers
- Where the main schedule risks are
- What should be cut first if time runs short
- How to protect the final demo and handoff quality

This document is intended to turn the previous documents into an execution plan.

---

## Target output document path
Write or update:

`product/07_delivery-plan.md`

You may also update a small supporting notes file only if necessary, such as:
- `notes/assumptions.md`
- `notes/decisions.md`

Do not create new core product documents beyond the 7-document set.

---

## Required output format after discovery answers
When you move to drafting/updating, respond in this structure:

1. **Repo state summary**
2. **Assumptions**
3. **Delivery plan overview**
4. **Files to create/update**
   - one subsection per file
   - include full contents
5. **Delivery Plan quality gate**
6. **Open questions / pending decisions**
7. **De-scope lever**
8. **Continuation notes**

---

## Delivery Plan document requirements
The Delivery Plan document must be:
- bullet-first
- concise but complete
- explicit
- written as a decision-support artifact for execution planning

It must include at minimum these sections:

1. **Purpose of this document**
2. **Planning assumptions**
3. **Delivery goals**
4. **Team model**
5. **Milestone plan**
6. **Workstream breakdown**
7. **Dependency and sequencing logic**
8. **Recommended team split**
9. **Backlog slice strategy**
10. **Demo and acceptance checkpoints**
11. **Testing and stabilization plan**
12. **Top delivery risks**
13. **De-scope plan**
14. **Open questions / pending decisions**
15. **Continuation notes**

### Additional requirements
- Be explicit about:
  - what must be finished in weeks 1–2, 3–4, 5–6, 7–8, 9–10, and 11–12
  - what should be delivered incrementally
  - what counts as “MVP complete”
  - what counts as “demo ready”
- Include a practical split for **3 developers**, for example:
  - edge/client-focused stream
  - backend/data/content-delivery stream
  - admin portal/integration/QA stream
- Show where cross-team sync points are needed.
- Include a **milestone timeline in text form**, such as:
  - week ranges
  - milestone names
  - goals
  - key outputs
- Do not expand into detailed project-management ceremony unless necessary.
- Do not invent a large agile process overhead.
- Do not assume extra people, testers, DevOps staff, or designers unless the user explicitly says so.

---

## Guidance for delivery-plan framing
Unless the user answers otherwise, prefer a simple MVP delivery shape such as:

### Candidate milestone flow
- **Milestone 0 — Setup & alignment**
  - repo, environments, core decisions, seed content examples
- **Milestone 1 — Skeleton end-to-end**
  - minimal backend, minimal admin upload path, minimal edge app shell, basic content retrieval
- **Milestone 2 — Core user flows**
  - feed browsing, library/search, content open/view, admin metadata flow
- **Milestone 3 — Hybrid/offline and polish**
  - manual download, browser-local persistence, weak-network behavior, UX hardening
- **Milestone 4 — Stabilization / demo hardening**
  - test pass, bug fixing, content/demo scenario prep, fallback paths

### Candidate workstreams
- edge client
- backend/catalog/content services
- admin portal
- storage/download/offline behavior
- integration/testing/demo prep

### Candidate de-scope order
- like/save polish
- advanced category-management UX
- richer metadata fields
- non-critical admin workflows
- extra filtering/sorting depth
- feed sophistication beyond basic interest filtering

Use this only as a starting point, not as a substitute for discovery.

---

## Current known project state
Assume:
- this project is **TactiTok**
- the repo was intended to be bootstrapped by the first prompt
- the Product Brief may or may not already be generated
- the System Boundaries document may or may not already be generated
- the MVP Spec may or may not already be generated
- the System Architecture document may or may not already be generated
- the Data Model document may or may not already be generated
- the API Contract document may or may not already be generated
- no tech stack should be treated as locked unless present in repo files
- the North Star is authoritative
- this document should turn the agreed scope and system definition into a practical semester execution plan without introducing process bloat

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