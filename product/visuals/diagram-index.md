# Diagram Index — TactiTok

> **Version:** 0.6
> **Status:** All 17 diagrams generated (Excalidraw) — labels fixed, encryption fixed
> **Date:** 2026-03-09
> **Source:** Cross-doc review v0.3 (`product/reviews/01_cross-doc-review.md`)
> **Change from v0.5:** Fixed excalidraw.com export — now uses AES-GCM encryption with proper `#json=<id>,<key>` URL format. Each link loads its own unique diagram content correctly.

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
| 🔗 | Generated — Excalidraw shareable link |

---

## Required Diagrams

| ID | Name | Priority | Status | Excalidraw URL |
|----|------|----------|--------|----------------|
| DG-01 | System Context Diagram | Required | 🔗 Generated | [Open](https://excalidraw.com/#json=m2H5BVnwXn-CcTY6ykag8,ol_aWg9H5j_ATn2_NSz16g) |
| DG-02 | Container / Component Architecture | Required | 🔗 Generated | [Open](https://excalidraw.com/#json=eGwui9XaJkvQ5b8gF7ZPS,NXds79drLkQ2PDdKnTlo3A) |
| DG-03 | Deployment / Runtime View | Required | 🔗 Generated | [Open](https://excalidraw.com/#json=7Mtj45WBcOmvqABp2aEvc,m0clX0ptpLq0C8VgAVCXTQ) |
| DG-04 | Data Model / ERD | Required | 🔗 Generated | [Open](https://excalidraw.com/#json=kS9zEDFbS1ZPMiobq3E8a,uGCiwysIVh8mFmOAR-wSCA) |
| DG-05 | Content Publishing Flow (Sequence) | Required | 🔗 Generated | [Open](https://excalidraw.com/#json=yov-GdfdUJMPxBEScbQG_,q_lrpkFPHut0BjkT2WG_LA) |
| DG-06 | Reels Feed / Video Playback Flow (Sequence) | Required | 🔗 Generated | [Open](https://excalidraw.com/#json=--xf1beWa1YLSVgoroXjd,GqNPYMsdSgidjC62F13FSg) |
| DG-07 | Library Browse & Search Flow (Sequence) | Required | 🔗 Generated | [Open](https://excalidraw.com/#json=mCrkff3Iit10k-r-kNiBh,dudd8ueOjM3RZeXOD_4cYA) |
| DG-08 | Offline Download + Sync Flow (Sequence) | Required | 🔗 Generated | [Open](https://excalidraw.com/#json=lwVwkkqyLwSK7Hwdea9a9,nE2PAGSRQQawq2xD3UaVkQ) |

---

## Recommended Diagrams

| ID | Name | Priority | Status | Excalidraw URL |
|----|------|----------|--------|----------------|
| DG-09 | Edge Proxy Cache State Flow | Recommended | 🔗 Generated | [Open](https://excalidraw.com/#json=riT3KeN9H-y-WN3i5L5jG,Y7o77jzEqNxvezfQSjOCvA) |
| DG-10 | Network Connectivity State Diagram | Recommended | 🔗 Generated | [Open](https://excalidraw.com/#json=vtywzzpqispqWGDyIOxdo,5u0_XAC0Efia75wL73fz1g) |
| DG-11 | Admin Content Management Flow (Sequence) | Recommended | 🔗 Generated | [Open](https://excalidraw.com/#json=8cI0p9A1O6JTpUTrqDByT,ziFROXSSjqkXzADlTQajhQ) |
| DG-12 | First-Time Setup / Interest Selection Flow | Recommended | 🔗 Generated | [Open](https://excalidraw.com/#json=FqoG_03hWkhsTAyS-yTnO,bJCy1liPggeA-ZRQhKi2YA) |
| DG-13 | Monorepo Package Structure | Recommended | 🔗 Generated | [Open](https://excalidraw.com/#json=dF-Zzea7unFkk0Myx3sI6,X_cPLhE4uqGsulFEseLxUg) |
| DG-17 | Sprint / Milestone Overview | Recommended | 🔗 Generated | [Open](https://excalidraw.com/#json=3NAh-giD82UiMB9HWh6tn,hAG9lW_oMS9QKt5OYU2dyA) |

---

## Optional Diagrams

| ID | Name | Priority | Status | Excalidraw URL |
|----|------|----------|--------|----------------|
| DG-14 | Content Lifecycle State Diagram | Optional | 🔗 Generated | [Open](https://excalidraw.com/#json=FOmdtbFMWy70wozToMPRc,MyUT4oX-XlNaZ1tON73vlQ) |
| DG-15 | Download Record Lifecycle | Optional | 🔗 Generated | [Open](https://excalidraw.com/#json=Omx0QnVm9Yajm5WWOA5Li,O7xsw6b8vSQYEgMQcG6YVw) |
| DG-16 | Trust / Security Zones | Optional | 🔗 Generated | [Open](https://excalidraw.com/#json=yj9CXVYfnlk2MN_7VTh8r,rJgM31lAPsysNHpc5v2-mQ) |

---

## Blocker Status

| Blocker | Status | Resolves |
|---------|--------|---------|
| ~~B1 — Doc 06 missing~~ | ✅ Resolved | DG-05, DG-06, DG-11 unblocked |
| ~~B2 — Doc 07 missing~~ | ✅ Resolved | DG-17 unblocked |
| ~~B3 — Q23 (updated badge scope)~~ | ✅ Resolved → D60 | DG-07, DG-08 unblocked |
| ~~B5 — Q17 (saved items UI surface)~~ | ✅ Resolved → D61 | DG-07 unblocked |
| ~~N1 — `/api/health` not in API contract~~ | ✅ Resolved → D63 | DG-10 unblocked |
| ~~N2 — proxy cache invalidation via ETag (same URL)~~ | ✅ Resolved → D62 | DG-08, DG-09 unblocked |

**All blockers resolved. All 17 diagrams generated and label rendering verified.**

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

*All 17 diagrams generated via Excalidraw. Labels fixed on 2026-03-09 using native bound text elements. Each URL is a shareable, editable Excalidraw link with properly rendered text.*
