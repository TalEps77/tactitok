# Diagram Index — TactiTok

> **Version:** 0.2
> **Status:** Draft
> **Date:** 2026-03-07
> **Source:** Cross-doc review v0.2 (`product/reviews/01_cross-doc-review.md`)
> **Change from v0.1:** All 7 documents reviewed. DG-05, DG-06, DG-11 now unblocked. DG-10 blocker updated from B4 to N1. DG-08, DG-09 blocker updated to N2. DG-17 (sprint/milestone overview) added.

For backlog detail, priority order, and blocker tracking, see `product/visuals/diagram-todo.md`.

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| 🔴 | Not started |
| 🟠 | Blocked |
| 🟡 | Partially blocked (can start, cannot finalize) |
| 🟢 | Unblocked — ready to generate |
| ✅ | Generated — source file exists |
| 📌 | Generated — exported (PNG/SVG available) |

---

## Required Diagrams

| ID | Name | Priority | Status | Blockers | Source file | PNG | SVG |
|----|------|----------|--------|----------|-------------|-----|-----|
| DG-01 | System Context Diagram | Required | 🟢 Unblocked | — | — | — | — |
| DG-02 | Container / Component Architecture | Required | 🟢 Unblocked | — | — | — | — |
| DG-03 | Deployment / Runtime View | Required | 🟢 Unblocked | — | — | — | — |
| DG-04 | Data Model / ERD | Required | 🟢 Unblocked | — | — | — | — |
| DG-05 | Content Publishing Flow (Sequence) | Required | 🟢 **Unblocked** | — | — | — | — |
| DG-06 | Reels Feed / Video Playback Flow (Sequence) | Required | 🟢 **Unblocked** | — | — | — | — |
| DG-07 | Library Browse & Search Flow (Sequence) | Required | 🟠 Blocked | B3 (Q23), B5 (Q17) | — | — | — |
| DG-08 | Offline Download + Sync Flow (Sequence) | Required | 🟠 Blocked | B3 (Q23), N2 | — | — | — |

---

## Recommended Diagrams

| ID | Name | Priority | Status | Blockers | Source file | PNG | SVG |
|----|------|----------|--------|----------|-------------|-----|-----|
| DG-09 | Edge Proxy Cache State Flow | Recommended | 🟠 Blocked | N2 | — | — | — |
| DG-10 | Network Connectivity State Diagram | Recommended | 🟡 Partial | N1 | — | — | — |
| DG-11 | Admin Content Management Flow (Sequence) | Recommended | 🟢 **Unblocked** | — | — | — | — |
| DG-12 | First-Time Setup / Interest Selection Flow | Recommended | 🟢 Unblocked | — | — | — | — |
| DG-13 | Monorepo Package Structure | Recommended | 🟢 Unblocked | — | — | — | — |
| DG-17 | Sprint / Milestone Overview | Recommended | 🟢 **Unblocked** | — | — | — | — |

---

## Optional Diagrams

| ID | Name | Priority | Status | Blockers | Source file | PNG | SVG |
|----|------|----------|--------|----------|-------------|-----|-----|
| DG-14 | Content Lifecycle State Diagram | Optional | 🟢 Unblocked | — | — | — | — |
| DG-15 | Download Record Lifecycle | Optional | 🟢 Unblocked | — | — | — | — |
| DG-16 | Trust / Security Zones | Optional | 🟢 Unblocked | — | — | — | — |

---

## Blocker Status

| Blocker | Status | Resolves |
|---------|--------|---------|
| ~~B1 — Doc 06 missing~~ | ✅ Resolved | DG-05, DG-06, DG-11 unblocked |
| ~~B2 — Doc 07 missing~~ | ✅ Resolved | DG-17 unblocked |
| B3 — Q23 (updated badge scope) | 🔴 Open | DG-07, DG-08 |
| B5 — Q17 (saved items UI surface) | 🔴 Open | DG-07 |
| N1 — `/api/health` not in API contract | 🔴 Open | DG-10 accuracy |
| N2 — proxy cache invalidation via ETag (same URL) | 🔴 Open | DG-08, DG-09 |

---

## Diagram Descriptions (Quick Reference)

| ID | What it shows |
|----|--------------|
| DG-01 | All actors (fighter, HQ staff), surfaces (Edge SPA, Admin portal), network zones, and relationships at the highest abstraction |
| DG-02 | The 8 software containers (Edge SPA, Edge proxy, API server, Admin SPA, PostgreSQL, File store, TLS proxy, shared types) and their interfaces |
| DG-03 | Physical/virtual runtime: Cloud VM processes + ports; Edge device (Windows/Chrome, Linux VM/Docker) processes + ports |
| DG-04 | All 9 entities (5 server, 4 edge) with fields, types, and relationship cardinalities |
| DG-05 | Admin upload (`POST /api/admin/content`) → server validate + store + DB insert → edge `GET /api/catalog` → proxy cache → edge consumption |
| DG-06 | `GET /api/catalog` → interest filter → reels render → first video (tap-to-start) → auto-play → prefetch range request at 30% → proxy caches full next file → swipe → instant start |
| DG-07 | Tab switch → category tree from IndexedDB → user taps category → filtered list → search input → client-side filter → open PDF or video |
| DG-08 | Download tap → full fetch via proxy → proxy caches file → IndexedDB record written; offline: SPA reads record → proxy serves cached file (STALE) |
| DG-09 | Proxy cache states: MISS → cloud fetch + cache → return; HIT → instant serve; STALE → serve from cache when cloud unreachable; content update → cache invalidation path |
| DG-10 | Three connectivity states (Online / Degraded / Offline), transitions via `GET /api/health` polling, and SPA behavior in each |
| DG-11 | Admin login (`POST /api/admin/login` → JWT) → session → upload form → validation → store → metadata CRUD → category/interest CRUD → delete with cascade |
| DG-12 | First app open → check DeviceProfile → interest selection screen → profile write → Reels feed |
| DG-13 | Monorepo: 5 packages (client, admin, server, shared, edge-proxy) with dependency arrows |
| DG-14 | Content server states: Created (v=1) → Updated (v++) → Deleted (hard) |
| DG-15 | Download record states: Not Downloaded → Downloading → Downloaded (proxy cache + IndexedDB) → Deleted (record only) |
| DG-16 | Three trust zones (Server, Edge Device, Admin Client) with security controls at each boundary |
| DG-17 | Gantt/timeline: 6 × 2-week sprints, 6 milestones (M1–M6), critical path from monorepo setup to reels on device (M3) |

---

## Audience Map

| Audience | Primary diagrams | Secondary diagrams |
|----------|-----------------|-------------------|
| **Project evaluators / stakeholders** | DG-01, DG-05, DG-08 | DG-10, DG-16 |
| **Student developers (implementation)** | DG-02, DG-03, DG-04, DG-06, DG-08, DG-13 | DG-09, DG-11, DG-12, DG-14, DG-15 |
| **Academic supervisors / project managers** | DG-01, DG-02, DG-03, DG-17 | DG-04, DG-10 |
| **Demo / presentation** | DG-01, DG-05, DG-08, DG-10 | DG-02 |

---

## File Location Convention

```
product/visuals/
├── diagram-todo.md                        ← backlog and tracking
├── diagram-index.md                       ← this file
├── DG-01_system-context.mmd
├── DG-01_system-context.png
├── DG-02_container-architecture.mmd
├── DG-02_container-architecture.png
├── DG-03_deployment-runtime.mmd
├── DG-03_deployment-runtime.png
├── DG-04_data-model-erd.mmd
├── DG-04_data-model-erd.png
├── DG-05_content-publishing-flow.mmd
├── DG-05_content-publishing-flow.png
├── DG-06_reels-playback-flow.mmd
├── DG-06_reels-playback-flow.png
├── DG-07_library-browse-search.mmd        (blocked)
├── DG-08_offline-download-sync.mmd        (blocked)
├── DG-09_edge-proxy-cache-states.mmd      (blocked)
├── DG-10_network-connectivity-states.mmd  (partial)
├── DG-11_admin-content-management.mmd
├── DG-11_admin-content-management.png
├── DG-12_first-time-setup.mmd
├── DG-12_first-time-setup.png
├── DG-13_monorepo-structure.mmd
├── DG-13_monorepo-structure.png
├── DG-14_content-lifecycle.mmd
├── DG-15_download-record-lifecycle.mmd
├── DG-16_security-trust-zones.mmd
├── DG-17_sprint-milestone-overview.mmd
└── DG-17_sprint-milestone-overview.png
```

---

*Update this index when diagrams are generated. Set status to ✅ and fill in the source file path. Set to 📌 when PNG/SVG exports are available.*
