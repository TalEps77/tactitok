# System Boundaries — TactiTok

> **Version:** 0.2
> **Status:** Draft
> **Last updated:** 2026-03-07
> **Preceding document:** `product/01_product-brief.md`
> **Next document:** `product/03_mvp-spec.md`
> **Change log:** v0.2 — corrected edge device topology: each edge device has a local Linux VM running Docker with a caching proxy; Chrome on Windows connects via localhost.

---

## 1. Purpose of This Document

This document defines the boundary of the TactiTok system for MVP purposes:

- What is inside the system vs. outside it
- Which actors interact with it
- Which external services or infrastructure are assumed
- What runs on the edge device, what runs on the server, and what is outside the product boundary
- Where the trust, network, and operational boundaries lie

It is intended to reduce ambiguity before the MVP Spec, System Architecture, Data Model, and API Contract are written. Every downstream document must respect these boundaries.

---

## 2. System Under Definition

**TactiTok MVP** is a two-surface web application with a three-tier edge architecture:

- **Edge device** — a Windows PC with a 10″ tablet display. A local Linux VM runs Docker with an nginx caching proxy + bundled Edge SPA. Chrome on Windows runs in kiosk mode, connecting to `localhost`. The proxy caches content from the cloud for offline access.
- **Cloud server** — a cloud VM hosting the content API, admin portal, metadata database, and content file storage.
- **HQ desktop** — a standard browser accessing the admin portal on the cloud server.

The system boundary includes everything the team builds and deploys: the Edge SPA, the edge proxy (Dockerfile + nginx config), the cloud API server, the admin SPA, and database schema. It excludes the underlying OS, kiosk configuration, Linux VM provisioning, cloud infrastructure provisioning, and any external organizational systems.

---

## 3. Definitions / Terms

| Term | Definition |
|------|-----------|
| **Edge client** | The SPA running in Chrome on Windows; connects to localhost (edge proxy), never directly to cloud |
| **Edge proxy** | An nginx caching reverse proxy running in Docker on the edge device's Linux VM; serves the SPA and proxies/caches cloud content |
| **Server** | The cloud VM that hosts the API, admin portal, content storage |
| **Admin portal** | The web UI served by the server for HQ staff to manage content and categories |
| **Content API** | The HTTP/REST interface the edge client uses to fetch metadata and content files |
| **Content store** | The server-side location where uploaded video and PDF files are persisted |
| **Metadata catalog** | The structured data (titles, categories, tags, versions) describing all content items |
| **Device profile** | A browser-local configuration on the edge device (interests selection); no server-side identity |
| **Local cache** | Edge proxy cache (nginx `proxy_cache` for content/metadata) + IndexedDB in Chrome (for device profile, download records, local actions) |
| **Trust boundary** | The logical line separating trusted internal components from untrusted or external ones |

---

## 4. Actors

### 4.1 Human Actors

| Actor | Surface | Location | Identity |
|-------|---------|----------|----------|
| **Edge consumer** (fighter) | Edge client (Chrome kiosk) | Field / lab | Anonymous; device profile only |
| **Content manager** (HQ training staff) | Admin portal (browser) | HQ office / desktop | Simple password authentication |

### 4.2 System Actors

| Actor | Role | Direction |
|-------|------|-----------|
| **Edge client** | Pulls metadata catalog; fetches content on demand; stores downloads locally | Client → Server |
| **Server / Content API** | Serves metadata, streams/serves content files, accepts uploads | Server → Client |
| **Admin portal** | Sends uploads and catalog mutations to server | Admin → Server |
| **Edge proxy** (nginx in Docker) | Caches content files and metadata from cloud; serves SPA bundle; enables offline access | Edge device (local) |
| **Browser storage** (IndexedDB) | Persists device profile, download records (metadata only), and local actions (like/save) | Local only |

---

## 5. In-Scope Systems / Components

These are built and owned by the TactiTok team:

### 5.1 Edge Client (Browser SPA)

| Component | Responsibility |
|-----------|---------------|
| **Reels feed** | Vertical-scroll video feed with interest filtering |
| **Library view** | Category tree browsing + text search |
| **Video player** | In-browser playback with prefetch-first-seconds behavior |
| **PDF viewer** | In-browser page-by-page PDF rendering (e.g., PDF.js) |
| **Download manager** | User-initiated download of content to browser local storage; list + delete |
| **Device profile** | Local interest selection, persisted in IndexedDB |
| **Local Like/Save** | Stored locally on device; no server sync in MVP |
| **Metadata sync client** | Pulls latest catalog from server on app open / manual refresh |
| **Offline playback** | Serves previously downloaded content from local cache when network is unavailable |

### 5.2 Server

| Component | Responsibility |
|-----------|---------------|
| **Content API** | REST endpoints for: catalog metadata, content file serving, search, category tree |
| **Admin API** | REST endpoints for: content upload, metadata CRUD, category CRUD, interest/tag management |
| **Admin portal** | Web UI for HQ staff (served by the same server) |
| **Content store** | Server-local file storage for uploaded videos and PDFs (decision on external object store deferred) |
| **Metadata store** | Database holding the content catalog, categories, interests, and version info |
| **Static asset server** | Serves the Admin SPA bundle (edge SPA is bundled in Docker on edge device) |

### 5.3 Edge Proxy (Docker on Linux VM)

| Component | Responsibility |
|-----------|---------------|
| **Edge proxy** (nginx in Docker) | Serve Edge SPA from bundled static files; proxy + cache API/content requests to cloud; serve cached content offline |

### 5.4 Shared / Cross-Cutting

| Component | Responsibility |
|-----------|---------------|
| **TLS termination** (cloud) | HTTPS for admin ↔ server and edge proxy ↔ server communication |
| **Content delivery** | HTTP range request support for video streaming / prefetch |

---

## 6. Out-of-Scope Systems / Components

These are **not built** in the MVP. The architecture should not block their future addition, but no code, API, or schema is created for them now.

| Component | Why out of scope |
|-----------|-----------------|
| **User identity / authentication** | MVP is kiosk/anonymous; device profile only |
| **RBAC / permissions engine** | No user identity → no roles |
| **Recommendation engine** | MVP uses interest-based filtering only |
| **Analytics / telemetry service** | No usage reporting in MVP |
| **Push notification / sync service** | MVP uses pull-based metadata sync |
| **Video transcoding pipeline** | MVP assumes upload-ready MP4 files |
| **CDN / edge caching layer** | Single server serves content directly; ~20 devices |
| **External SSO / LDAP / organizational IAM** | No integration with external identity systems |
| **DRM / content protection** | Security via network isolation + TLS only |
| **Chat / social / commenting** | No social features |
| **Multi-language / i18n runtime** | Single language; string-key architecture only |
| **Storage quota enforcement** | No limit in MVP; data model tracks sizes for later |
| **Complex version management** | Replace-in-place with "updated" badge; no rollback |
| **Approval workflows for content** | Upload → publish is immediate; no review step |
| **Monitoring / alerting / observability platform** | Not built; standard server logs only |

---

## 7. External Systems / Dependencies

These are **not built by the team** but are assumed to exist and function:

| Dependency | What it provides | Team responsibility |
|-----------|-----------------|-------------------|
| **Cloud VM provider** | A Linux VM with public/private IP, sufficient CPU/RAM/disk for ~20 concurrent edge devices | Provision and configure; not build |
| **DNS / domain** (optional) | A hostname for the server; can use raw IP for demo | Configure if available |
| **TLS certificate** | HTTPS for all traffic | Obtain and install (Let's Encrypt or self-signed for demo) |
| **Chrome browser** | Runtime for the edge client; kiosk mode already configured | Build for Chrome; do not configure kiosk |
| **Docker** | Container runtime on the edge device's Linux VM | Team writes Dockerfile + nginx.conf; assumes Docker daemon is installed |
| **Windows + Linux VM on tablet** | OS environment on the edge device; Linux VM hosts Docker | Not managed by team; assume it works; Docker daemon assumed installed |
| **Network infrastructure** | Connectivity between edge devices and cloud VM | Not managed; assume it exists (may be unstable) |
| **Demo content corpus** | 10 PDFs + 5 videos (≤3 min, MP4, upload-ready) | Team or stakeholders prepare content; system does not generate it |

---

## 8. Runtime / Deployment Boundaries

### 8.1 Deployment Topology

```
┌─────────────────────────────────┐
│         CLOUD VM (Linux)        │
│                                 │
│  ┌───────────┐  ┌────────────┐  │
│  │ Content   │  │  Admin     │  │
│  │ API       │  │  Portal    │  │
│  │ (REST)    │  │  (Web UI)  │  │
│  └─────┬─────┘  └─────┬──────┘  │
│        │               │        │
│  ┌─────┴───────────────┴──────┐ │
│  │   Metadata Store (DB)      │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │   Content Store (files)    │ │
│  └────────────────────────────┘ │
└───────────────┬─────────────────┘
                │ HTTPS (TLS)
                │
    ┌───────────┴───────────────┐
    │                           │
    │                    ┌──────┴──────────┐
    │                    │  HQ DESKTOP     │
    │                    │  Chrome / any   │
    │                    │  modern browser │
    │                    │ ┌─────────────┐ │
    │                    │ │ Admin Portal│ │
    │                    │ └─────────────┘ │
    │                    └─────────────────┘
    │
┌───┴──────────────────────────────────┐
│  EDGE DEVICE ×N (Windows PC, ≤20)    │
│                                      │
│  ┌──────────────┐ ┌───────────────┐  │
│  │ WINDOWS      │ │ LINUX VM      │  │
│  │              │ │  (Docker)     │  │
│  │ Chrome kiosk │ │ ┌───────────┐ │  │
│  │ ↔ localhost  │─│ │nginx proxy│ │  │
│  │              │ │ │(caching)  │ │  │
│  │ ┌──────────┐ │ │ ├───────────┤ │  │
│  │ │IndexedDB │ │ │ │SPA bundle │ │  │
│  │ │(profile, │ │ │ ├───────────┤ │  │
│  │ │ actions) │ │ │ │Proxy cache│ │  │
│  │ └──────────┘ │ │ └───────────┘ │  │
│  └──────────────┘ └───────────────┘  │
└──────────────────────────────────────┘
```

### 8.2 What Runs Where

| Location | What runs | Managed by team? |
|----------|----------|-----------------|
| **Cloud VM** | Content API, Admin API, Admin Portal UI, Metadata DB, Content file storage | ✅ Yes — fully |
| **Edge device (Docker on Linux VM)** | Edge proxy (nginx caching proxy), Edge SPA bundle (static files in Docker image) | ✅ Yes — Dockerfile + nginx config |
| **Edge device (Chrome on Windows)** | Edge SPA (loaded from localhost), IndexedDB (profile, download records, local actions) | ✅ Yes — SPA code only |
| **Edge device (OS/kiosk)** | Windows, Linux VM, Docker daemon, Chrome kiosk config | ❌ No — pre-configured |
| **HQ desktop (browser)** | Admin Portal (loaded from server) | ✅ Yes — UI code only |
| **Network** | Routing, DNS, firewall, VPN | ❌ No — assumed infrastructure |

---

## 9. Network and Offline Boundaries

### 9.1 Connectivity Model

| State | Edge client behavior | Server behavior |
|-------|---------------------|----------------|
| **Online** | Pull metadata catalog; stream/fetch content on demand; download items | Serve API requests normally |
| **Degraded** | Prefetch video start (first N seconds); degrade gracefully with loading indicators; metadata may be stale | Serve with slower responses; client handles timeouts |
| **Offline** | Serve only locally downloaded content + cached metadata; no new content available; no metadata sync | Unreachable |

### 9.2 Data Flow by Connectivity

| Data type | Online | Offline | Storage location |
|-----------|--------|---------|-----------------|
| **Metadata catalog** | Pulled from server | Cached local copy used | Server DB → Edge IndexedDB |
| **Video content** | Streamed from server via edge proxy (prefetch + range requests) | Served from edge proxy cache (if previously accessed or downloaded) | Server file store → Edge proxy cache → Chrome |
| **PDF content** | Fetched from server via edge proxy | Served from edge proxy cache (if previously accessed or downloaded) | Server file store → Edge proxy cache → Chrome |
| **Device profile** | Local only (never sent to server) | Local only | Edge IndexedDB |
| **Like/Save actions** | Local only in MVP | Local only | Edge IndexedDB |

### 9.3 Sync Mechanism (MVP)

- **Direction:** Edge → Server pull only (no push)
- **Trigger:** On app open + manual refresh button
- **Scope:** Full metadata catalog (small payload for ~15 items; can paginate later)
- **Conflict strategy:** Server is authoritative; edge overwrites local metadata cache on sync

---

## 10. Trust / Security Boundaries

### 10.1 Trust Zones

```
┌──────────────────────────────────────────┐
│  ZONE 1 — Server (Trusted)               │
│  - Content API                            │
│  - Admin API (password-protected)         │
│  - Metadata DB                            │
│  - Content file store                     │
│  - All data is authoritative here         │
└────────────────┬─────────────────────────┘
                 │ TLS (HTTPS)
                 │ Untrusted transport
┌────────────────┴─────────────────────────┐
│  ZONE 2 — Edge Device (Semi-trusted)       │
│  - No identity; device profile only       │
│  - Edge proxy caches cloud data locally   │
│  - Chrome connects to proxy via localhost │
│  - Can read catalog + content             │
│  - Cannot mutate server-side data         │
│  - Local storage is user-controlled       │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  ZONE 3 — Admin Client (Authenticated)    │
│  - Password-authenticated session         │
│  - Can upload content                     │
│  - Can mutate catalog (CRUD)              │
│  - Runs on trusted HQ network             │
└──────────────────────────────────────────┘
```

### 10.2 Security Decisions for MVP

| Boundary | MVP approach |
|----------|-------------|
| **Transport** | TLS (HTTPS) for all traffic — edge ↔ server and admin ↔ server |
| **Edge client auth** | None — anonymous/kiosk; all catalog content is readable |
| **Admin portal auth** | Simple shared password (server-side session or token) |
| **Content sensitivity** | Assume sensitive; minimize exposure; store locally only what user explicitly downloads |
| **Server access** | Restrict to known network if possible; no public open API |
| **Local storage** | Browser-managed; no encryption in MVP (browser sandbox is the boundary) |
| **Telemetry** | None in MVP; no usage data leaves the edge device |

### 10.3 What the Team Does NOT Secure

- OS-level security on the tablet (kiosk config is external)
- Cloud VM firewall rules (infrastructure team / provisioning)
- Physical device security
- Content classification or DRM

---

## 11. Operational Assumptions

| # | Assumption | Impact if wrong |
|---|-----------|----------------|
| OA1 | The cloud VM has enough disk space and bandwidth for ~15 content items and ~20 concurrent edge clients | Content delivery fails or is slow under load |
| OA2 | Chrome kiosk mode does not restrict IndexedDB or Cache API | Offline/download feature breaks |
| OA3 | The network between edge devices and the cloud VM supports HTTPS (port 443 open) | Entire system is unreachable |
| OA4 | Content files are uploaded in final format (MP4 H.264 for video; standard PDF) | Playback or rendering fails; transcoding is out of scope |
| OA5 | A self-signed or Let's Encrypt TLS certificate is acceptable for the demo | TLS setup becomes complex |
| OA6 | The server can be a single process / single VM for MVP scale (~20 devices) | Needs load balancing; not MVP-feasible |
| OA7 | The admin portal and content API can be co-hosted on the same server | Simplifies deployment; separating later is straightforward if layers are clean |
| OA8 | Content store decision (local filesystem vs. object store) can be deferred | Architecture must abstract file storage behind an interface |

---

## 12. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| BR1 | Browser storage limits in kiosk mode are more restrictive than expected | Medium | High | Early spike test on target device; design download manager to handle quota errors gracefully |
| BR2 | TLS setup on cloud VM is complex or blocked by org policy | Low | Medium | Prepare both Let's Encrypt and self-signed fallback; document setup |
| BR3 | Single-server deployment becomes a bottleneck at 20 concurrent streams | Medium | Medium | Test with simulated load early; video prefetch reduces simultaneous full-stream count |
| BR4 | Content store decision (deferred) creates ambiguity during architecture | Medium | Low | Define a storage interface/abstraction in architecture; implement with local filesystem first |
| BR5 | Network instability causes metadata sync failures that confuse the UX | Medium | Medium | Design sync with clear error states; show "last synced" timestamp |

---

## 13. Open Questions / Pending Decisions

| # | Question | Affects | Recommended default | Deadline |
|---|---------|---------|-------------------|----------|
| BQ1 | Content store: server-local filesystem vs. external object store (S3/MinIO)? | Architecture, deployment | Local filesystem behind an abstraction layer; swap later | Before System Architecture |
| BQ2 | Database choice: SQLite vs. PostgreSQL vs. other? | Architecture, deployment | Team decides; document must define abstraction | Before System Architecture |
| BQ3 | Should the admin portal be a separate SPA or server-rendered? | Architecture, build pipeline | Separate SPA (same tech stack as edge client) for consistency | Before System Architecture |
| BQ4 | TLS: Let's Encrypt, self-signed, or organizational cert? | Deployment | Let's Encrypt if domain available; self-signed for demo fallback | Before Delivery Plan |
| BQ5 | ~~Should the edge client SPA be served by the same server, or as a static bundle deployed to the tablet?~~ **RESOLVED → AD12: SPA bundled into Docker image on edge device; served by local nginx** | Deployment, offline | Bundled in Docker image | Resolved 2026-03-07 |

---

## 14. De-scope Levers

If system boundary proves too broad for the team, cut in this order:

| Priority | Boundary to simplify | Effect |
|----------|---------------------|--------|
| 1st | Drop TLS for demo (HTTP only) | Reduces setup; acceptable in lab environment; add TLS for production |
| 2nd | Content store = local filesystem only (no abstraction layer) | Faster to build; harder to swap later but feasible |
| 3rd | Admin portal is minimal server-rendered pages (not a full SPA) | Reduces front-end work; less polished admin UX |
| 4th | No "updated" badge — edge always shows latest metadata after sync | Removes version-tracking logic from edge client |
| 5th | Drop metadata caching on edge — require network for all browsing | Reduces offline complexity significantly; download still works for content |

---

## 15. Continuation Notes

Guidance for a follow-on team expanding beyond MVP boundaries:

- **User identity:** The anonymous device-profile pattern should be replaceable by a user-id. The Content API should accept an optional auth header that MVP ignores but post-MVP enforces.
- **Push sync:** The pull-based metadata sync can be augmented with a WebSocket/SSE channel. The API layer should be designed so push is additive, not a rewrite.
- **Content store migration:** If the team starts with local filesystem, the storage layer should be behind an interface (read/write/delete by content-id) so S3/MinIO can be swapped in.
- **CDN / edge caching:** At higher scale (>20 devices), a CDN or reverse proxy cache in front of the content store reduces server load. The API should serve content with proper cache headers from day one.
- **Video transcoding:** If non-MP4 uploads are needed, a background job queue (e.g., ffmpeg worker) can be added behind the upload endpoint. The upload API should validate format and reject unsupported files in MVP.
- **Analytics:** Like/Save actions are stored locally in MVP. A future sync job can batch-upload these to the server when identity exists. The local storage schema should include timestamps and content-ids to enable this.
- **Multi-tenancy:** MVP is single-tenant. If multiple organizations need separate catalogs, the data model should use a tenant-id column that MVP sets to a constant.

---

*This document is the second in the TactiTok document set. Proceed to `product/03_mvp-spec.md`.*
