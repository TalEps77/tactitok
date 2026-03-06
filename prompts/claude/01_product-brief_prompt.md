# 01_product-brief_prompt.md

## Title
Claude Prompt — Product Brief + Repo Bootstrap for TactiTok

## Purpose
You are working on the **TactiTok** project.

Your job in this interaction is to create or update the **Product Brief** document for the repo.

Because this is the **first task** and the repo may still be empty, you must also **bootstrap the repository structure and initialize git** as part of the same interaction.

You must be **repo-aware**:
1. Inspect the repository state first.
2. Use the North Star as the binding source of truth.
3. If the repo is empty, bootstrap only the minimum clean structure needed.
4. Create placeholders for the full 7-document set, but fully write only the **Product Brief** in this interaction unless a tiny supporting file is necessary.
5. Keep the repo simple, student-friendly, and continuation-ready.

---

## Operating mode
You must follow this exact sequence.

### Phase 0 — Repo Review
Before asking questions:
- Inspect the repository structure and identify what already exists.
- Look specifically for:
  - `product/north-star.md`
  - `prompts/claude/`
  - `product/`
  - `notes/`
  - `README.md`
  - `.git/`
- Summarize current repo state in **3–7 bullets**:
  - what exists
  - what is missing
  - whether git is already initialized
  - what is risky or inconsistent for a clean first setup

If the repo is empty, say so explicitly and proceed with bootstrap assumptions.

Do not rewrite files during this phase.

### Phase 1 — Discovery
Ask focused clarification questions first, with a hard maximum of **12**, grouped under:
- Users & Context
- Scope & Boundaries
- Workflows & Edge Cases
- Constraints
- Success & Acceptance

Important rules:
- Ask only questions needed for the **Product Brief** and the **repo bootstrap**.
- Do not ask broad generic product questions already answered by the North Star.
- Because this is the first task and much is still undecided, keep questions lean.
- You may ask **up to 4 repo/bootstrap questions** only if truly needed.
- If a sensible default is obvious, state it as a proposed assumption instead of blocking.

### Phase 2 — Draft / Repo Bootstrap
After I answer, do all of the following:

1. Propose a clean repo/document structure suitable for this project.
2. Initialize git.
3. Create the file layout for the full 7-document set.
4. Create or update the first document: **Product Brief**.
5. Output:
   - the proposed file tree
   - the exact file paths
   - full file contents for each file to create/update
   - git/bootstrap commands to run from the base folder

### Phase 3 — Quality Gate
Run a self-check on the Product Brief and repo structure against:
- feasible for **3 student developers in 12 weeks**
- MVP implementable in **8–10 weeks**
- supports an **end-to-end prototype**, not a disconnected feature slice
- continuation-ready after the academic project
- explicit scope boundaries
- testable / demo-oriented success criteria
- minimalism, with no roadmap bloat inside the MVP

If it fails, propose a smaller **v0.1 / v0.05**.

---

## Mandatory constraints
These are binding:
- The project is a prototype but must be **continuation-ready** later, without major rewrites.
- Prefer the **simplest architecture and repo structure** that still supports later extension.
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

- What problem TactiTok solves
- For whom it solves it
- In what operational context it is used
- What value it delivers in MVP form
- What the core user flows are
- What is in scope and out of scope for MVP
- How success will be judged in demo and early usage terms

This document is intended to anchor the rest of the document set:
- System Boundaries
- MVP Spec
- System Architecture
- Data Model
- API Contract
- Delivery Plan

---

## Repo/bootstrap requirements for this first task
Assume:
- I may run your commands from an **empty base folder**
- nothing may have been created yet
- this is the **first project task**

For the bootstrap:
- initialize a git repository if one does not already exist
- create a sensible top-level structure for project documents, prompts, and notes
- include a location for:
  - North Star
  - Claude prompts
  - generated product documents
  - notes / assumptions / decisions
- create placeholders for the full 7-document set
- include a `README.md` that explains repo purpose and how Claude prompts are used
- keep the structure minimal, clean, and easy for 3 students to maintain

Do not introduce extra core product documents beyond the required 7 unless necessary for repo hygiene.

---

## Target output document path
Write or update:

`product/01_product-brief.md`

You may also create/update small supporting files needed for bootstrap, such as:
- `README.md`
- `product/north-star.md`
- `notes/assumptions.md`
- `notes/decisions.md`

You should also create placeholder paths for:
- `product/02_system-boundaries.md`
- `product/03_mvp-spec.md`
- `product/04_system-architecture.md`
- `product/05_data-model.md`
- `product/06_api-contract.md`
- `product/07_delivery-plan.md`

And this prompt should live at:
- `prompts/claude/01_product-brief_prompt.md`

---

## Required output format after discovery answers
When you move to drafting/bootstrap, respond in this structure:

1. **Repo state summary**
2. **Assumptions**
3. **Proposed repo structure**
4. **Git/bootstrap commands**
5. **Files to create/update**
   - one subsection per file
   - include full contents
6. **Product Brief quality gate**
7. **Open questions / pending decisions**
8. **De-scope lever**
9. **Continuation notes**

---

## Product Brief document requirements
The Product Brief must be:
- bullet-first
- concise but complete
- explicit
- written as a decision-support artifact for engineering and product scoping

It must include at minimum these sections:

1. **Purpose of this document**
2. **Product summary**
3. **Problem statement**
4. **Target users**
5. **Operational context**
6. **Value proposition**
7. **Core flows**
8. **In scope**
9. **Out of scope**
10. **Success metrics**
11. **Assumptions**
12. **Risks**
13. **Open questions / pending decisions**
14. **De-scope lever**
15. **Continuation notes**

### Additional requirements
- Define important terms if they may be ambiguous.
- Keep the document at MVP level; do not drift into detailed architecture, API design, or data-model design.
- Ensure the scope is small enough for a 3-student team but still end-to-end and demoable.
- Do not expand into future roadmap material beyond what is needed for continuation notes.

---

## Guidance for repo structure
Unless the repo already contains a better structure, prefer a simple layout such as:

- `README.md`
- `product/`
- `prompts/claude/`
- `notes/`

Within `product/`, prefer:
- `north-star.md`
- `01_product-brief.md`
- `02_system-boundaries.md`
- `03_mvp-spec.md`
- `04_system-architecture.md`
- `05_data-model.md`
- `06_api-contract.md`
- `07_delivery-plan.md`

Within `notes/`, prefer lightweight files such as:
- `assumptions.md`
- `decisions.md`

Use this as a default only if the repo is empty.

---

## Current known project state
Assume:
- this project is **TactiTok**
- this is the **first core document**
- the repo may still be empty
- no tech stack should be treated as locked unless explicitly present in repo files
- the North Star is authoritative
- this document should establish a strong baseline without prematurely over-designing the solution

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