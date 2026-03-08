# Open Questions

Use this file to track unresolved questions that may affect future documents or implementation.

## From Product Brief (01)

| # | Question | Affects | Recommended default | Deadline |
|---|---------|---------|-------------------|----------|
| Q1 | ~~Which video protocol/format for MVP?~~ **RESOLVED → D28: MP4 + range requests** | System Architecture | MP4 + HTTP range requests | Resolved 2026-03-07 |
| Q2 | ~~Metadata sync mechanism: pull on app open, periodic polling, or push?~~ **RESOLVED → D47: Pull on app open + manual refresh; no background sync in MVP** | API Contract | Pull on app open + manual refresh | Resolved 2026-03-07 |
| Q3 | ~~What is stored in IndexedDB vs. Cache API?~~ **SUPERSEDED → D41/D44/D45: Cache API no longer used; IndexedDB for device state only; edge proxy caches content** | System Architecture | Edge proxy for content; IndexedDB for device state | Superseded 2026-03-07 |
| Q4 | ~~How are interests defined and managed? Fixed list, admin-managed, hierarchical?~~ **RESOLVED → D35: Admin-managed flat list; independent of categories** | Data Model, Admin UX | Admin-managed flat list | Resolved 2026-03-07 |
| Q5 | ~~Minimum demo security posture?~~ **RESOLVED → D13/D14 (Architecture): TLS on cloud + admin password; edge on internal network; no user auth on edge endpoints** | Deployment | Network isolation + admin password + TLS | Resolved 2026-03-07 |
| Q6 | ~~Which single language for MVP UI?~~ **RESOLVED → D18: English** | UI development | English | Resolved 2026-03-06 |
| Q7 | ~~Should the reels feed show PDFs or only videos?~~ **RESOLVED → D19: Videos only** | Feed UX | Videos only in reels; PDFs in library | Resolved 2026-03-06 |

## From System Boundaries (02)

| # | Question | Affects | Recommended default | Deadline |
|---|---------|---------|-------------------|----------|
| Q8 | ~~Content store: filesystem vs. object store?~~ **RESOLVED → D27: Local filesystem behind abstraction** | Architecture, deployment | Local filesystem behind abstraction | Resolved 2026-03-07 |
| Q9 | ~~Database choice?~~ **RESOLVED → D26: PostgreSQL** | Architecture, deployment | PostgreSQL | Resolved 2026-03-07 |
| Q10 | ~~Admin portal: SPA or server-rendered?~~ **RESOLVED → Separate SPA (React/TS). Note: D30 (both SPAs served by same server) was superseded by D42 — Edge SPA is now bundled in Docker on the edge device; Admin SPA is still served by the cloud server.** | Architecture, build pipeline | Separate SPA (React) | Resolved 2026-03-07 |
| Q11 | TLS: Let's Encrypt, self-signed, or organizational cert? | Deployment | Let's Encrypt if domain; self-signed fallback | Before Delivery Plan |
| Q12 | ~~Edge client SPA: served by server or static bundle?~~ **SUPERSEDED → D42: SPA bundled into Docker image on edge; served by local nginx** | Deployment, offline | Bundled in Docker | Superseded 2026-03-07 |

## From MVP Spec (03)

| # | Question | Affects | Recommended default | Deadline |
|---|---------|---------|-------------------|----------|
| Q13 | Exact prefetch strategy: how many seconds of next video? | Reels UX, bandwidth | 3 seconds | Before implementation (sprint 1) |
| Q14 | Standalone video player (from Library) — same full-screen UI as reels, or different? | UI consistency | Same player, no swipe | Before UI design |
| Q15 | Upload size limit for video files? | Admin UX, server | 100MB per file | Before API Contract |
| Q16 | Metadata sync: full catalog pull or delta-based? | API design, bandwidth | Full pull (≤15 items) | Before API Contract |
| Q17 | ~~Saved items — separate sub-view or marked in Library?~~ **RESOLVED → D61: Save/Like indicators only in MVP; no recall surface. Stored in IndexedDB (LocalAction); no "Saved" filter or sub-view. Continuation item.** | Edge UX | Indicators only; no recall surface | Resolved 2026-03-07 |

## From System Architecture (04)

| # | Question | Affects | Recommended default | Deadline |
|---|---------|---------|-------------------|----------|
| Q18 | ORM / query layer: Prisma vs. Knex vs. raw SQL? | Implementation | Prisma (type-safe, migrations) | Before implementation start |
| Q19 | Should nginx serve content files directly (bypass Node) for performance? | Deployment | Start with Node; switch to nginx X-Accel-Redirect if needed | Sprint 2 |
| Q20 | ~~Service Worker tooling: Workbox vs. manual?~~ **RESOLVED → D43: No Service Worker in MVP** | Implementation | N/A — SW eliminated | Resolved 2026-03-07 |
| Q21 | CSS scroll-snap vs. library (Swiper.js) for TikTok reels? | UI implementation | CSS scroll-snap first; add Swiper if janky | Sprint 1 prototype |
| Q22 | Monorepo tool: npm workspaces vs. pnpm workspaces vs. turborepo? | Build pipeline | pnpm workspaces | Before implementation start |

## From Data Model (05)

| # | Question | Affects | Recommended default | Deadline |
|---|---------|---------|-------------------|----------|
| Q23 | ~~Should the "updated" badge appear on all items in library, or only on downloaded items?~~ **RESOLVED → D60: Downloads tab only — compare DownloadRecord.version to catalog version on sync** | Edge UX, logic complexity | Only on downloaded items (version mismatch is clear) | Resolved 2026-03-07 |
| Q24 | Should thumbnails be stored in same `./data/content/` directory or separate `./data/thumbnails/`? | File organization | Separate `./data/thumbnails/` for clarity | Before implementation |
| Q25 | Should the admin be able to assign a content item to zero categories? | Data integrity | Allow zero (uncategorized); show under "All" or "Uncategorized" | Before implementation |

## From API Contract (06)

| # | Question | Affects | Recommended default | Deadline |
|---|---------|---------|-------------------|----------|
| Q29 | JWT (stateless) vs. opaque token (requires server-side store)? | Auth, logout behaviour | JWT — API contract assumes this | Before implementation |
| Q30 | Should content file endpoint use Node.js streaming or nginx `X-Accel-Redirect`? | Performance | Node.js in MVP; switch if load is a problem | Sprint 2 after load test |
| Q31 | Should `DELETE /api/admin/categories/:id` cascade-delete children, or reject if children exist? | Admin UX | Cascade delete — API contract assumes this | Before implementation |
| Q32 | `multipart/form-data` vs. `tus` chunked upload for file upload? | Upload reliability | `multipart/form-data` (admin has stable network) | Before implementation |
| Q33 | Server sets `Cache-Control: no-store` or `public, max-age=0` on `/api/catalog`? | nginx config | `no-store` + `proxy_ignore_headers` on proxy; test and adjust | Sprint 1 |

## From Architecture v0.2 Update (Edge Proxy)

| # | Question | Affects | Recommended default | Deadline |
|---|---------|---------|-------------------|----------|
| Q26 | ~~Linux VM type on edge devices: WSL2 vs. VirtualBox vs. other?~~ **RESOLVED → D59: WSL2 preferred** | Edge deployment | WSL2 (simplest Docker integration on Windows) | Resolved 2026-03-07 |
| Q27 | Cloud server URL: hardcoded in nginx.conf or configurable via env var? | Edge proxy deployment | Environment variable (Docker `-e CLOUD_URL=...`) | Before implementation |
| Q28 | Should edge proxy use HTTP or HTTPS to connect to cloud? | Security | HTTPS (TLS); proxy validates cloud cert | Before deployment |

## From Delivery Plan (07)

| # | Question | Affects | Recommended default | Deadline |
|---|---------|---------|-------------------|----------|
| Q34 | Is the target 10″ tablet available for hands-on testing by week 5? | Sprint 3, M3 | If not: use Windows laptop Chrome at 1280×800 as fallback; confirm device availability | Week 3 |
| Q35 | Who provides the 15 demo content items? | Sprint 6 | Team sources placeholder content (public domain); confirm by week 8 | Week 8 |
| Q36 | Is the cloud VM provisioned and accessible by week 1? What specs? | Sprint 1 | Linux VM, 4+ GB RAM, 50+ GB disk, outbound HTTPS | Week 1 |
| Q37 | TLS cert for cloud server: Let's Encrypt (needs domain) vs. self-signed? | Deployment | Let's Encrypt if domain is available; self-signed for lab demo | Week 9 |
