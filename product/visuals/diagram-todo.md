# Diagram Backlog — TactiTok

> **Version:** 0.1
> **Status:** Draft
> **Date:** 2026-03-07
> **Source:** Cross-doc review pass (`product/reviews/01_cross-doc-review.md`)
> **Binding source of truth:** `product/north-star.md`

This file is the working backlog for all planned diagram artifacts. It tracks status, priority, blockers, and source basis. Update status as diagrams are generated.

---

## Blocker Summary

The following issues must be resolved **before** specific diagrams can be finalized. See cross-doc review for details.

| Blocker | Affects diagrams | Resolution |
|---------|-----------------|-----------|
| **B1** — Doc 06 (API Contract) not generated | DG-05, DG-06, DG-07, DG-08, DG-11 | Generate doc 06 first |
| **B2** — Doc 07 (Delivery Plan) not generated | DG-12 | Generate doc 07 first |
| **B3** — "Updated" badge scope unresolved (Q23) | DG-07, DG-08 | Close Q23 before those diagrams |
| **B4** — Cache invalidation strategy unresolved | DG-09, DG-10 | Decide cache-busting strategy |
| **B5** — "Saved" items UI surface unresolved (Q17) | DG-07 | Close Q17 before that diagram |

---

## Required Diagrams

These diagrams are **mandatory** for the project to be comprehensible to both evaluators and developers. They cover all major architectural surfaces and core user flows.

---

### DG-01 — System Context Diagram

| Field | Value |
|-------|-------|
| **Purpose** | Show all actors, systems, and primary relationships at the highest level |
| **Audience** | Evaluators, stakeholders, new developers |
| **Source basis** | `02_system-boundaries.md` §3–4, `01_product-brief.md` §4–5 |
| **Priority** | Required |
| **Status** | 🔴 Not started |
| **Blockers** | None |
| **Output** | `product/visuals/DG-01_system-context.mmd` + PNG/SVG |
| **Notes** | Show: Edge consumer, HQ content manager, Edge SPA (Chrome kiosk), Edge proxy (Docker/nginx), Cloud server, Admin portal, HQ desktop. Show network trust zones. |

---

### DG-02 — Container / Component Architecture

| Field | Value |
|-------|-------|
| **Purpose** | Show the major software containers and their responsibilities |
| **Audience** | Developers, evaluators |
| **Source basis** | `04_system-architecture.md` §5–7, `02_system-boundaries.md` §5 |
| **Priority** | Required |
| **Status** | 🔴 Not started |
| **Blockers** | None |
| **Output** | `product/visuals/DG-02_container-architecture.mmd` + PNG/SVG |
| **Notes** | Show: Edge SPA (React), Edge proxy (nginx/Docker), API server (Node/Express), Admin SPA (React), PostgreSQL, File store. Show internal interfaces between components. |

---

### DG-03 — Deployment / Runtime View

| Field | Value |
|-------|-------|
| **Purpose** | Show exactly what processes run where, on which physical/virtual machines |
| **Audience** | Developers, DevOps |
| **Source basis** | `04_system-architecture.md` §8, `02_system-boundaries.md` §8 |
| **Priority** | Required |
| **Status** | 🔴 Not started |
| **Blockers** | None (can use recommended defaults for Q26, Q11) |
| **Output** | `product/visuals/DG-03_deployment-runtime.mmd` + PNG/SVG |
| **Notes** | Show: Cloud VM (nginx TLS → Node.js → PostgreSQL + filesystem); Edge Device (Windows → Chrome kiosk → localhost; Linux VM → Docker → nginx + SPA bundle + proxy cache); HQ Desktop (browser → admin portal). Show ports. |

---

### DG-04 — Data Model / Entity Relationship Diagram

| Field | Value |
|-------|-------|
| **Purpose** | Show all 9 entities, their fields, and relationships |
| **Audience** | Developers |
| **Source basis** | `05_data-model.md` §5–7 |
| **Priority** | Required |
| **Status** | 🔴 Not started |
| **Blockers** | None |
| **Output** | `product/visuals/DG-04_data-model-erd.mmd` + PNG/SVG |
| **Notes** | Two regions: Server (PostgreSQL: ContentItem, Category, Interest, ContentCategory, ContentInterest) and Edge Browser (IndexedDB: DeviceProfile, CachedCatalog, DownloadRecord, LocalAction). Show key fields and relationship cardinalities. |

---

### DG-05 — Content Publishing Flow (Admin → Edge)

| Field | Value |
|-------|-------|
| **Purpose** | Show the full upload → publish → sync → consumption sequence |
| **Audience** | Evaluators, developers |
| **Source basis** | `04_system-architecture.md` §9.1–9.2, `03_mvp-spec.md` Journey 5, `01_product-brief.md` Flow C |
| **Priority** | Required |
| **Status** | 🟡 Partially blocked |
| **Blockers** | B1 (doc 06 needed for exact endpoint names) |
| **Output** | `product/visuals/DG-05_content-publishing-flow.mmd` + PNG/SVG |
| **Notes** | Participants: HQ staff, Admin SPA, API server, PostgreSQL, File store. Then: Edge SPA, Edge proxy, Cloud catalog endpoint. Show: file upload, validation, storage, metadata write, catalog sync pull, proxy cache. |

---

### DG-06 — Reels Feed / Video Playback Flow

| Field | Value |
|-------|-------|
| **Purpose** | Show how the reels feed loads, how video prefetch works, and how the edge proxy cache is involved |
| **Audience** | Developers |
| **Source basis** | `04_system-architecture.md` §9.3, §9.7, `03_mvp-spec.md` Journey 2, CAP-2 |
| **Priority** | Required |
| **Status** | 🟡 Partially blocked |
| **Blockers** | B1 (endpoint names); C3 (prefetch language — note in diagram) |
| **Output** | `product/visuals/DG-06_reels-playback-flow.mmd` + PNG/SVG |
| **Notes** | Show: SPA requests catalog → filters by interest → renders feed → first video auto-plays → prefetch range request triggers proxy to cache full next video file → swipe → instant start from cached file. Note C3 ambiguity in diagram comment. |

---

### DG-07 — Library Browse & Search Flow

| Field | Value |
|-------|-------|
| **Purpose** | Show the library navigation, category browsing, text search, and content item opening |
| **Audience** | Evaluators, developers |
| **Source basis** | `03_mvp-spec.md` Journey 3, CAP-3, `05_data-model.md` §13.2 |
| **Priority** | Required |
| **Status** | 🟠 Blocked |
| **Blockers** | B3 (updated badge scope Q23 must be resolved first); B5 (saved items Q17 must be resolved) |
| **Output** | `product/visuals/DG-07_library-browse-search.mmd` + PNG/SVG |
| **Notes** | Show: tab switch → category tree from IndexedDB catalog → user taps category → filtered list → search bar input → client-side filter → open PDF (PDF.js) or video (player). Resolve B3 and B5 before finalizing. |

---

### DG-08 — Offline Download + Sync Flow

| Field | Value |
|-------|-------|
| **Purpose** | Show how a user downloads content, how proxy caching works, how offline access is served, and how sync interacts with downloaded items |
| **Audience** | Evaluators, developers |
| **Source basis** | `04_system-architecture.md` §9.4–9.6, §10, `03_mvp-spec.md` Journey 4, CAP-5, CAP-7 |
| **Priority** | Required |
| **Status** | 🟠 Blocked |
| **Blockers** | B3 (updated badge on downloaded items — resolved version needed); B4 (cache invalidation on content update) |
| **Output** | `product/visuals/DG-08_offline-download-sync.mmd` + PNG/SVG |
| **Notes** | Show two paths: (a) Download action → fetch via proxy → proxy caches full file → SPA writes DownloadRecord to IndexedDB; (b) Offline access → SPA reads DownloadRecord → requests file from proxy → proxy serves from cache (STALE). Also show catalog sync path and version comparison for updated badge. Resolve B4 before finalizing the "content updated" sub-path. |

---

## Recommended Diagrams

These diagrams add significant value for understanding and debugging but are not strictly required for the first diagram generation pass.

---

### DG-09 — Edge Proxy Cache State Flow

| Field | Value |
|-------|-------|
| **Purpose** | Show the edge proxy's three cache states (HIT/MISS/STALE) and how each affects the SPA and user experience |
| **Audience** | Developers |
| **Source basis** | `04_system-architecture.md` §7 (C7), §10, `02_system-boundaries.md` §9 |
| **Priority** | Recommended |
| **Status** | 🟠 Partially blocked (B4 — cache invalidation) |
| **Blockers** | B4 |
| **Output** | `product/visuals/DG-09_edge-proxy-cache-states.mmd` + PNG/SVG |
| **Notes** | State diagram: MISS → proxy fetches from cloud → caches → returns; HIT → serves from cache immediately; STALE (cloud unreachable) → serves stale cache + X-Cache-Status header. |

---

### DG-10 — Network Connectivity State Diagram

| Field | Value |
|-------|-------|
| **Purpose** | Show the three connectivity states (Online, Degraded, Offline) and what the system does in each |
| **Audience** | Developers, evaluators |
| **Source basis** | `02_system-boundaries.md` §9.1, `04_system-architecture.md` §10.2 |
| **Priority** | Recommended |
| **Status** | 🟡 Mostly unblocked |
| **Blockers** | B4 (offline behavior for updated content) |
| **Output** | `product/visuals/DG-10_network-connectivity-states.mmd` + PNG/SVG |
| **Notes** | States: Online → full functionality; Degraded → prefetch, loading indicators, graceful degradation; Offline → serve from proxy cache, IndexedDB catalog, Downloads tab. Show transitions and SPA behavior in each state. |

---

### DG-11 — Admin Content Management Flow

| Field | Value |
|-------|-------|
| **Purpose** | Show admin login, content upload, category/interest management, and content update/delete |
| **Audience** | Developers |
| **Source basis** | `03_mvp-spec.md` Journey 5, CAP-6, `04_system-architecture.md` §9.1 |
| **Priority** | Recommended |
| **Status** | 🟠 Blocked |
| **Blockers** | B1 (doc 06 needed for admin API endpoint names) |
| **Output** | `product/visuals/DG-11_admin-content-management.mmd` + PNG/SVG |
| **Notes** | Show: login → password check → session token; upload form → file + metadata → API → validate → store → 201; edit metadata; category CRUD; interest CRUD; delete → cascade. |

---

### DG-12 — First-Time Setup / Interest Selection Flow

| Field | Value |
|-------|-------|
| **Purpose** | Show the first-time app open experience: interest selection screen, device profile creation, and transition to reels feed |
| **Audience** | Evaluators, developers |
| **Source basis** | `03_mvp-spec.md` Journey 1, CAP-1.4–1.5, `05_data-model.md` §6.6 |
| **Priority** | Recommended |
| **Status** | 🟢 Unblocked |
| **Blockers** | None |
| **Output** | `product/visuals/DG-12_first-time-setup.mmd` + PNG/SVG |
| **Notes** | Show: app open → check IndexedDB for DeviceProfile → if absent: show interest selection screen → user selects 1+ interests → write DeviceProfile → navigate to Reels feed. If profile exists: skip to Reels directly. |

---

### DG-13 — Monorepo Package Structure

| Field | Value |
|-------|-------|
| **Purpose** | Show the monorepo package layout and dependency relationships between packages |
| **Audience** | Developers |
| **Source basis** | `04_system-architecture.md` §6.2 |
| **Priority** | Recommended |
| **Status** | 🟢 Unblocked |
| **Blockers** | None |
| **Output** | `product/visuals/DG-13_monorepo-structure.mmd` + PNG/SVG |
| **Notes** | Show packages: client (Edge SPA), admin (Admin SPA), server (API), shared (types/validation), edge-proxy (Dockerfile + nginx.conf). Show dependency arrows (client → shared, admin → shared, server → shared). |

---

## Optional Diagrams

These diagrams add depth for specific audiences or edge cases but can be deferred without blocking the project.

---

### DG-14 — Content Lifecycle State Diagram

| Field | Value |
|-------|-------|
| **Purpose** | Show the server-side content lifecycle states and transitions |
| **Audience** | Developers, admin portal users |
| **Source basis** | `05_data-model.md` §9.1 |
| **Priority** | Optional |
| **Status** | 🟢 Unblocked |
| **Blockers** | None |
| **Output** | `product/visuals/DG-14_content-lifecycle.mmd` + PNG/SVG |
| **Notes** | States: Created (version=1) → Updated (version++) → Deleted (hard delete). Show what changes in each transition. |

---

### DG-15 — Download Record Lifecycle

| Field | Value |
|-------|-------|
| **Purpose** | Show the edge-side download record lifecycle |
| **Audience** | Developers |
| **Source basis** | `05_data-model.md` §9.2 |
| **Priority** | Optional |
| **Status** | 🟢 Unblocked |
| **Blockers** | None |
| **Output** | `product/visuals/DG-15_download-record-lifecycle.mmd` + PNG/SVG |
| **Notes** | States: Not Downloaded → Downloading (in-memory progress) → Downloaded (proxy cached + IndexedDB record) → Deleted (record removed; proxy may retain file). Note v0.2 key change: file is in proxy cache, not Chrome Cache API. |

---

### DG-16 — Trust / Security Zones

| Field | Value |
|-------|-------|
| **Purpose** | Show the three trust zones and the security controls at each boundary |
| **Audience** | Evaluators, security reviewers |
| **Source basis** | `02_system-boundaries.md` §10, `04_system-architecture.md` §11 |
| **Priority** | Optional |
| **Status** | 🟢 Unblocked |
| **Blockers** | None |
| **Output** | `product/visuals/DG-16_security-trust-zones.mmd` + PNG/SVG |
| **Notes** | Three zones: Zone 1 (Server — Trusted), Zone 2 (Edge Device — Semi-trusted), Zone 3 (Admin Client — Authenticated). Show controls: TLS, admin password, no edge auth, local storage sandbox. |

---

## Diagram Priority Order for Generation

When generating diagrams, follow this order to maximize the value of each generation pass:

**Pass 1 — Unblocked, high-value (generate immediately):**
1. DG-01 System Context
2. DG-02 Container Architecture
3. DG-03 Deployment / Runtime
4. DG-04 Data Model ERD
5. DG-12 First-Time Setup Flow
6. DG-13 Monorepo Structure

**Pass 2 — Resolve blockers B3/B5 first, then generate:**
7. DG-07 Library Browse & Search
8. DG-10 Network Connectivity States

**Pass 3 — Resolve blocker B1 (generate doc 06) first:**
9. DG-05 Content Publishing Flow
10. DG-06 Reels Feed / Video Playback
11. DG-11 Admin Content Management

**Pass 4 — Resolve blocker B4 (cache invalidation) first:**
12. DG-08 Offline Download + Sync
13. DG-09 Edge Proxy Cache States

**Pass 5 — Resolve blocker B2 (generate doc 07) first:**
14. DG-12 Sprint/Milestone (delivery plan diagram — TBD in doc 07)

**Pass 6 — Optional, anytime:**
15. DG-14 Content Lifecycle
16. DG-15 Download Record Lifecycle
17. DG-16 Security Trust Zones

---

## Output Conventions

All diagram files should follow this convention:

- **Source file:** `product/visuals/{ID}_{slug}.mmd` (Mermaid format)
- **PNG export:** `product/visuals/{ID}_{slug}.png`
- **SVG export:** `product/visuals/{ID}_{slug}.svg` (optional, preferred for web embedding)
- **Naming:** ID is DG-NN (two digits), slug is lowercase with hyphens
- **Format default:** Mermaid (text-based, version-controllable)
- **Embedded:** Diagrams may be linked from product docs but are not embedded inline (to keep docs readable in plain text)

---

*This backlog is maintained alongside `product/visuals/diagram-index.md` (the registry). Update status in both files when a diagram is generated.*
