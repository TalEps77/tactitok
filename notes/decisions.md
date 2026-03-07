# Decisions

Use this file to track explicit project decisions and why they were made.

## From Product Brief (01)

| # | Decision | Rationale | Date |
|---|---------|-----------|------|
| D1 | Short video max length = 3 minutes | Balances content depth with bandwidth constraints and "scroll" UX | 2026-03-06 |
| D2 | PDFs have no page-count limit | Training docs vary in length; viewer handles page-by-page | 2026-03-06 |
| D3 | Like/Save are local-only in MVP | Avoids server-side analytics complexity; can be batch-synced later | 2026-03-06 |
| D4 | Updated content shows "updated" badge on edge | Users need to know when material has changed | 2026-03-06 |
| D5 | No storage quota in MVP | Simplifies download manager; data model tracks sizes for later quota | 2026-03-06 |
| D6 | Single language for MVP | Reduces UI complexity; architecture uses string keys for future i18n | 2026-03-06 |
| D7 | Demo runs in a lab with simulated conditions | Controlled environment for reliable evaluation | 2026-03-06 |
| D8 | Demo is hands-on (evaluators use the tablet directly) | Most convincing validation of UX | 2026-03-06 |
| D9 | Demo corpus = 10 PDFs + 5 videos | Enough to demonstrate all flows without excessive content prep | 2026-03-06 |
| D10 | Admin portal persona = centralized HQ team | Admin UI can assume desktop, stable network, dedicated staff | 2026-03-06 |
| D11 | Target ~20 concurrent edge devices; design for scale-up | Covers realistic pilot size | 2026-03-06 |

## From System Boundaries (02)

| # | Decision | Rationale | Date |
|---|---------|-----------|------|
| D12 | Server deployed on a cloud VM (not on-prem or same-device) | Cloud VM gives stable hosting, independent of edge device limitations | 2026-03-06 |
| D13 | TLS required for all client ↔ server communication | Network between edge and server is untrusted; protects sensitive content | 2026-03-06 |
| D14 | No video transcoding in MVP — files must arrive upload-ready (MP4) | Avoids ffmpeg dependency and background job complexity | 2026-03-06 |
| D15 | Team does not manage kiosk setup or OS config on edge tablets | Reduces scope; kiosk is pre-configured by another team | 2026-03-06 |
| D16 | Content store implementation (filesystem vs. object store) deferred to team | Team chooses during architecture; document must define abstraction | 2026-03-06 |
| D17 | Metadata sync is pull-only (edge pulls from server); no push channel in MVP | Simplest implementation; push can be added later | 2026-03-06 |

## From MVP Spec (03)

| # | Decision | Rationale | Date |
|---|---------|-----------|------|
| D18 | MVP UI language = English | Simpler than Hebrew (avoids RTL layout); developers are Hebrew speakers but English UI avoids complexity | 2026-03-06 |
| D19 | Reels feed = videos only; PDFs appear only in Library | Reels is a video experience; PDFs don't fit swipe-to-advance model | 2026-03-06 |
| D20 | Navigation = bottom tab bar (Reels, Library, Downloads) | Standard mobile pattern; works well on 10″ tablet; 3 tabs covers all edge user needs | 2026-03-06 |
| D21 | First-time experience = interest selection screen before feed | Ensures feed is personalized from first use; simple onboarding | 2026-03-06 |
| D22 | Video playback = TikTok-style (auto-play, swipe-to-advance, full-screen) | Maximizes demo "wow" factor; matches product vision | 2026-03-06 |
| D23 | Category tree = max 2 levels for MVP | Sufficient for 15 demo items; deeper trees work with same parent-id model | 2026-03-06 |

## From System Architecture (04)

| # | Decision | Rationale | Date |
|---|---------|-----------|------|
| D24 | Frontend: React + TypeScript (edge SPA + admin SPA) | Largest ecosystem; best TikTok-style scroll support; shared language with backend | 2026-03-07 |
| D25 | Backend: Node.js + Express + TypeScript | Same language as frontend; reduces cognitive overhead for 3 students; simple file streaming | 2026-03-07 |
| D26 | Database: PostgreSQL | Production-grade; handles concurrent reads; text search; continuation-ready | 2026-03-07 |
| D27 | Content file storage: local filesystem behind storage abstraction | Simplest for MVP; abstraction allows S3/MinIO swap later | 2026-03-07 |
| D28 | Video delivery: MP4 + HTTP range requests (no HLS/DASH) | Simplest streaming; Chrome handles natively; sufficient for ≤3 min clips | 2026-03-07 |
| D29 | ~~Local storage split: IndexedDB for metadata/profile; Cache API for media files~~ **SUPERSEDED by D41** | ~~Correct API for each data type~~ | 2026-03-07 |
| D30 | ~~Both SPAs served by same Node.js server; Service Worker caches edge SPA shell~~ **SUPERSEDED by D42** | ~~Single deployment; offline app startup via SW~~ | 2026-03-07 |
| D31 | TypeScript monorepo with shared types package | Prevents API contract drift; single CI pipeline; shared validation | 2026-03-07 |
| D32 | Single Node.js process (no microservices) | 3 devs, 10 weeks, ~20 users; monolith with clean modules | 2026-03-07 |
| D33 | nginx as TLS reverse proxy | Standard pattern; offloads TLS from Node; production-ready | 2026-03-07 |
| D34 | Full catalog sync (not delta) for MVP | ~15 items = <10 KB payload; delta adds complexity without benefit | 2026-03-07 |

## From Data Model (05)

| # | Decision | Rationale | Date |
|---|---------|-----------|------|
| D35 | Interests and categories are independent — not hierarchically linked | Simpler model; content can have any combination; avoids forced mapping | 2026-03-07 |
| D36 | Version counter only; no version history retained | MVP overwrites file on update; `version++` drives "updated" badge; history table deferred | 2026-03-07 |
| D37 | Thumbnails are optional (admin-uploaded); UI shows type-based placeholder if omitted | Reduces admin burden; demo acceptable with placeholders; thumbnail support is additive | 2026-03-07 |
| D38 | UUIDs for all primary keys | Enables future multi-source sync; avoids sequential-ID leakage; standard for distributed systems | 2026-03-07 |
| D39 | Hard delete for content items in MVP (no soft delete) | Simplest implementation; audit trail not required for demo; add `deletedAt` later | 2026-03-07 |
| D40 | One binary file per content item (no ContentAsset table) | MVP is single-file; multi-file or multi-quality can add ContentAsset table later | 2026-03-07 |

## From Architecture v0.2 Update (Edge Proxy)

| # | Decision | Rationale | Date |
|---|---------|-----------|------|
| D41 | Edge device has local caching proxy (nginx in Docker on Linux VM); Chrome connects via localhost | Edge device has a Linux VM with Docker; proxy caches content + metadata for offline access; eliminates Cache API + Service Worker complexity | 2026-03-07 |
| D42 | Edge SPA bundled into Docker image; served by local nginx (not from cloud) | SPA always available locally; no cloud dependency for app startup; eliminates need for Service Worker | 2026-03-07 |
| D43 | No Service Worker in MVP | SPA is served locally by Docker nginx; content caching handled by edge proxy; SW adds no value | 2026-03-07 |
| D44 | No Chrome Cache API for content storage | Edge proxy's `proxy_cache` handles all content caching; Chrome Cache API would be redundant | 2026-03-07 |
| D45 | IndexedDB used only for device state (profile, download records metadata, local actions) | Content files are cached by edge proxy, not by Chrome; IndexedDB holds only structured metadata | 2026-03-07 |
| D46 | Team builds Docker setup (Dockerfile + nginx.conf) as part of MVP | Edge proxy is part of the system; team creates the Docker config; assumes Docker daemon pre-installed on Linux VM | 2026-03-07 |

## From API Contract (06)

| # | Decision | Rationale | Date |
|---|---------|-----------|------|
| D47 | Metadata sync = pull on app open + manual refresh; no background/periodic sync in MVP | Simplest implementation; app open is the natural trigger; manual refresh covers urgent needs | 2026-03-07 |
| D48 | Admin auth token = JWT (stateless); logout is client-side token discard | No server-side session store needed; logout risk is low in controlled HQ environment | 2026-03-07 |
| D49 | File upload = `multipart/form-data` (no chunked upload in MVP) | Admin operates on stable HQ network; tus adds complexity; can swap handler without changing API contract | 2026-03-07 |
| D50 | `GET /api/catalog` accepts `?since` param but always returns full catalog in MVP | Forward-compatible; clients can send the param from day one without breaking when delta sync is added | 2026-03-07 |
| D51 | `DELETE /api/admin/categories/:id` cascade-deletes child categories | Simpler admin UX; avoids forcing admin to manually delete children before parent | 2026-03-07 |
| D52 | MIME validation uses magic-byte check (`file-type` library) in addition to client-provided MIME header | Client-provided MIME header is trivially spoofed; magic bytes are the authoritative check | 2026-03-07 |
| D53 | ETag format for content files = `"{version}-{id}"` | ETag changes on every content update (version increment); edge proxy cache entry is automatically invalidated | 2026-03-07 |

## From Delivery Plan (07)

| # | Decision | Rationale | Date |
|---|---------|-----------|------|
| D54 | Role assignment: Dev A = backend, Dev B = edge SPA, Dev C = admin SPA | Cleanest separation; shared types in `packages/shared` owned by Dev A; roles shift for integration in Sprint 5 | 2026-03-07 |
| D55 | 6 × 2-week sprints (12 weeks total): sprints 1–5 build, sprint 6 stabilises | Aligns with North Star §8 (8–10 weeks build + stabilisation through week 12) | 2026-03-07 |
| D56 | Milestone 3 (reels on device, end of week 6) is the primary risk checkpoint | Reels UX is the highest-risk, highest-impact capability; if it fails, 6 weeks remain to recover or de-scope | 2026-03-07 |
| D57 | De-scope levers applied in priority order from MVP Spec §13; decision logged in notes/decisions.md | Consistent with the agreed de-scope ladder; prevents ad-hoc scope cuts | 2026-03-07 |
| D58 | Demo content sourcing: team provides 15 items (10 PDFs + 5 videos) by week 11; placeholder content acceptable | Avoids dependency on external stakeholder for content; team can use public-domain material | 2026-03-07 |
| D59 | WSL2 preferred over VirtualBox for Linux VM on edge Windows devices | WSL2 maps Docker ports to Windows localhost automatically; VirtualBox requires manual port forwarding configuration | 2026-03-07 |
