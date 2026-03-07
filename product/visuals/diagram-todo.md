# Diagram Backlog — TactiTok

> **Version:** 0.2
> **Status:** Draft
> **Date:** 2026-03-07
> **Source:** Cross-doc review v0.2 (`product/reviews/01_cross-doc-review.md`)
> **Binding source of truth:** `product/north-star.md`
> **Change from v0.1:** All 7 documents now reviewed. Docs 06 and 07 are substantive. Blocker B1 and B2 resolved. New blockers N1 and N2 identified. DG-05, DG-06, DG-11 are now unblocked. DG-07, DG-08, DG-09 remain blocked. DG-10 remains partially blocked. New diagram DG-17 added for sprint/milestone view.

This file is the working backlog for all planned diagram artifacts. It tracks status, priority, blockers, and source basis. Update status as diagrams are generated.

---

## Blocker Summary

The following issues must be resolved **before** specific diagrams can be finalized. See cross-doc review v0.2 for details.

| Blocker | Affects diagrams | Status | Resolution |
|---------|-----------------|--------|-----------|
| ~~**B1** — Doc 06 (API Contract) not generated~~ | ~~DG-05, DG-06, DG-07, DG-08, DG-11~~ | ✅ **Resolved** | Doc 06 is now complete |
| ~~**B2** — Doc 07 (Delivery Plan) not generated~~ | ~~DG-17~~ | ✅ **Resolved** | Doc 07 is now complete |
| **B3** — "Updated" badge scope unresolved (Q23) | DG-07, DG-08 | 🔴 Open | Close Q23 (recommend: downloads-only) |
| **B5** — "Saved" items UI surface unresolved (Q17) | DG-07 | 🔴 Open | Close Q17 (recommend: indicators-only MVP) |
| **N1** — `GET /api/health` missing from API contract | DG-10 | 🔴 Open | Add endpoint to doc 06 |
| **N2** — nginx proxy_cache not invalidated by ETag on same URL | DG-08, DG-09 | 🔴 Open | Decide cache-busting strategy (recommend: `?v={version}` in content URL) |

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
| **Source basis** | `04_system-architecture.md` §9.1–9.2, `06_api-contract.md` §7.2, `03_mvp-spec.md` Journey 5, `01_product-brief.md` Flow C |
| **Priority** | Required |
| **Status** | 🟢 **Unblocked** |
| **Blockers** | None |
| **Output** | `product/visuals/DG-05_content-publishing-flow.mmd` + PNG/SVG |
| **Notes** | Participants: HQ staff, Admin SPA, API server (`POST /api/admin/content`), PostgreSQL, File store. Then: Edge SPA, Edge proxy, `GET /api/catalog`. Show: multipart upload, MIME + magic-byte validation, filesystem store, DB insert, catalog sync pull, proxy cache. Include thumbnail upload as optional sub-flow. |

---

### DG-06 — Reels Feed / Video Playback Flow

| Field | Value |
|-------|-------|
| **Purpose** | Show how the reels feed loads, how video prefetch works, and how the edge proxy cache is involved |
| **Audience** | Developers |
| **Source basis** | `04_system-architecture.md` §9.3, §9.7, `06_api-contract.md` §6.1–6.2, `03_mvp-spec.md` Journey 2, CAP-2, `07_delivery-plan.md` Sprint 3 |
| **Priority** | Required |
| **Status** | 🟢 **Unblocked** |
| **Blockers** | None |
| **Output** | `product/visuals/DG-06_reels-playback-flow.mmd` + PNG/SVG |
| **Notes** | Show: `GET /api/catalog` → interest filter → render feed → first video: tap-to-start overlay (Chrome auto-play policy) → subsequent auto-play → at 30% playback: `Range: bytes=0-{N}` for next video → proxy caches full file → swipe → instant start from cache. Note that prefetch range request triggers full file caching at proxy (not just the partial bytes). |

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
| **Source basis** | `04_system-architecture.md` §9.4–9.6, §10, `06_api-contract.md` §10, `03_mvp-spec.md` Journey 4, CAP-5, CAP-7, `07_delivery-plan.md` Sprint 4 |
| **Priority** | Required |
| **Status** | 🟠 **Blocked** |
| **Blockers** | B3 (Q23: updated badge scope); N2 (proxy cache invalidation on content update — must resolve before the "updated content" sub-path can be accurately diagrammed) |
| **Output** | `product/visuals/DG-08_offline-download-sync.mmd` + PNG/SVG |
| **Notes** | Show two main paths: (a) Download tap → `fetch("/api/content/{id}/file")` via proxy → read response to completion → proxy caches full file → SPA writes DownloadRecord to IndexedDB; (b) Offline access → SPA reads DownloadRecord → requests file from proxy → proxy serves STALE. Also show catalog sync + version comparison for updated badge. For the "content updated" sub-path: the accurate diagram depends on N2 resolution (whether URL includes `?v={version}` for cache-busting). |

---

## Recommended Diagrams

These diagrams add significant value for understanding and debugging but are not strictly required for the first diagram generation pass.

---

### DG-09 — Edge Proxy Cache State Flow

| Field | Value |
|-------|-------|
| **Purpose** | Show the edge proxy's three cache states (HIT/MISS/STALE) and how each affects the SPA and user experience |
| **Audience** | Developers |
| **Source basis** | `04_system-architecture.md` §7 (C7), §10, `06_api-contract.md` §9, `02_system-boundaries.md` §9 |
| **Priority** | Recommended |
| **Status** | 🟠 **Blocked** |
| **Blockers** | N2 (proxy cache invalidation on content update — the "cache key" behavior must be decided before this diagram accurately reflects the invalidation path) |
| **Output** | `product/visuals/DG-09_edge-proxy-cache-states.mmd` + PNG/SVG |
| **Notes** | State diagram: MISS → proxy fetches from cloud → caches → returns; HIT → serves from cache immediately; STALE (cloud unreachable) → serves stale cache + `X-Cache-Status: STALE` header. Include: content update sub-path (version bump → new cache key if `?v={version}` adopted; old entry naturally expires at 30d TTL). Resolve N2 before finalizing. |

---

### DG-10 — Network Connectivity State Diagram

| Field | Value |
|-------|-------|
| **Purpose** | Show the three connectivity states (Online, Degraded, Offline) and what the system does in each |
| **Audience** | Developers, evaluators |
| **Source basis** | `02_system-boundaries.md` §9.1, `04_system-architecture.md` §10.2, `07_delivery-plan.md` Sprint 4 Week 8 |
| **Priority** | Recommended |
| **Status** | 🟡 **Partially blocked** |
| **Blockers** | N1 (`GET /api/health` not yet in API contract — this is the detection mechanism; diagram needs to show it accurately) |
| **Output** | `product/visuals/DG-10_network-connectivity-states.mmd` + PNG/SVG |
| **Notes** | States: Online → full functionality; Degraded → prefetch, loading indicators, graceful degradation; Offline → serve from proxy cache, IndexedDB catalog, Downloads tab. Show: connectivity detection via poll of `GET /api/health`; `X-Cache-Status: STALE` response indicates offline mode. Transitions and SPA behavior in each state. Resolve N1 first for accuracy. |

---

### DG-11 — Admin Content Management Flow

| Field | Value |
|-------|-------|
| **Purpose** | Show admin login, content upload, category/interest management, and content update/delete |
| **Audience** | Developers |
| **Source basis** | `06_api-contract.md` §7, `03_mvp-spec.md` Journey 5, CAP-6, `04_system-architecture.md` §9.1, `07_delivery-plan.md` Sprint 2 + Sprint 5 |
| **Priority** | Recommended |
| **Status** | 🟢 **Unblocked** |
| **Blockers** | None |
| **Output** | `product/visuals/DG-11_admin-content-management.mmd` + PNG/SVG |
| **Notes** | Show: `POST /api/admin/login` → JWT returned → stored in sessionStorage; upload form → `POST /api/admin/content` (multipart) → MIME + magic-byte validation → filesystem store → DB insert → 201; `PUT /api/admin/content/:id` (metadata); `PUT /api/admin/content/:id/file` (version++); `PUT /api/admin/content/:id/thumbnail`; `DELETE /api/admin/content/:id` (cascade); category and interest CRUD endpoints. |

---

### DG-12 — First-Time Setup / Interest Selection Flow

| Field | Value |
|-------|-------|
| **Purpose** | Show the first-time app open experience: interest selection screen, device profile creation, and transition to reels feed |
| **Audience** | Evaluators, developers |
| **Source basis** | `03_mvp-spec.md` Journey 1, CAP-1.4–1.5, `05_data-model.md` §6.6, `07_delivery-plan.md` Sprint 3 Week 6 |
| **Priority** | Recommended |
| **Status** | 🟢 Unblocked |
| **Blockers** | None |
| **Output** | `product/visuals/DG-12_first-time-setup.mmd` + PNG/SVG |
| **Notes** | Show: app open → check IndexedDB for DeviceProfile → if absent: show interest selection screen → user selects 1+ interests → write DeviceProfile → navigate to Reels feed. If profile exists: skip to Reels directly. Also show: re-access interests from settings/profile area. |

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

### DG-17 — Sprint / Milestone Overview

| Field | Value |
|-------|-------|
| **Purpose** | Show the 6-sprint delivery plan, 6 milestones, and critical path in a visual timeline |
| **Audience** | Developers, academic supervisors, project managers |
| **Source basis** | `07_delivery-plan.md` §3–6 |
| **Priority** | Recommended |
| **Status** | 🟢 Unblocked |
| **Blockers** | None |
| **Output** | `product/visuals/DG-17_sprint-milestone-overview.mmd` + PNG/SVG |
| **Notes** | Show: 6 × 2-week sprints with goals; 6 milestones (M1–M6) with their week and what they prove; critical path (monorepo → types → schema → catalog endpoint → catalog sync → reels on device → M3). Use Mermaid Gantt chart or timeline diagram. |

---

## Diagram Priority Order for Generation

When generating diagrams, follow this order to maximize the value of each generation pass:

**Pass 1 — Fully unblocked, high-value (generate immediately):**
1. DG-01 System Context
2. DG-02 Container Architecture
3. DG-03 Deployment / Runtime
4. DG-04 Data Model ERD
5. DG-05 Content Publishing Flow *(newly unblocked)*
6. DG-06 Reels Feed / Video Playback *(newly unblocked)*
7. DG-11 Admin Content Management *(newly unblocked)*
8. DG-12 First-Time Setup Flow
9. DG-13 Monorepo Structure
10. DG-17 Sprint / Milestone Overview *(newly unblocked)*

**Pass 2 — Resolve N1 first (add `/api/health` to API contract), then generate:**
11. DG-10 Network Connectivity States

**Pass 3 — Resolve N2 (cache-busting strategy) and close Q23 + Q17, then generate:**
12. DG-07 Library Browse & Search
13. DG-08 Offline Download + Sync
14. DG-09 Edge Proxy Cache States

**Pass 4 — Optional, anytime:**
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
