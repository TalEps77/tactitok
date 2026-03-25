# System Architecture — TactiTok

> **Version:** 0.3
> **Status:** Draft
> **Last updated:** 2026-03-25
> **Preceding document:** `product/03_mvp-spec.md`
> **Next document:** `product/05_data-model.md`
> **Change log:** v0.2 — corrected edge device topology: local Linux VM + Docker caching proxy replaces direct-to-cloud browser model. v0.3 (2026-03-25): Complete tech stack update per MVP Spec v3. Backend changed from Node.js/Express/TypeScript to Python/FastAPI/SQLAlchemy. Frontend changed from TypeScript+Vite to vanilla HTML+JS. Shared types package eliminated. Admin UI served as static files by FastAPI.

---

## 1. Purpose of This Document

This document defines the minimum architecture needed to realize the TactiTok MVP. It answers:

- What the main system components are and what each is responsible for
- What runs on the edge device, what runs on the server, and what is external
- How content, metadata, and local downloads are handled at a high level
- How the system behaves under intermittent connectivity
- What the main interfaces between components are
- What architectural choices are intentionally deferred

Every downstream document (Data Model → API Contract → Delivery Plan) must be consistent with this architecture.

---

## 2. Architecture Goals

| # | Goal | Rationale |
|---|------|-----------|
| AG1 | **Simplest viable architecture** | 3 student developers, 8–10 weeks; minimize moving parts |
| AG2 | **End-to-end functional** | Upload → catalog → stream/browse → download → offline must all work |
| AG3 | **Continuation-ready** | Clean layer separation so a follow-on team can extend without rewrites |
| AG4 | **Single tech stack** | Python (backend) + vanilla JS (frontend); minimal tooling reduces cognitive overhead |
| AG5 | **Offline-aware from day one** | Edge proxy + local SPA bundle designed into the architecture, not bolted on |
| AG6 | **Demo-optimized** | Fast video start, smooth scrolling, reliable offline — these drive architectural choices |

---

## 3. Definitions / Terms

Carried forward from prior documents. Architecture-specific additions:

| Term | Definition |
|------|-----------|
| **API server** | The Python FastAPI process on the cloud VM serving REST endpoints for both edge proxy and admin portal |
| **Storage abstraction** | An internal interface (read/write/delete by content-id) that decouples the API from the physical storage backend |
| **Edge proxy** | An nginx caching reverse proxy running in a Docker container on the edge device's Linux VM; serves the Edge SPA locally and proxies + caches all API/content requests to the cloud server |
| **Content proxy** | The API server's role in serving content files with proper HTTP headers (range requests, cache control, CORS) |
| **SPA bundle** | The static HTML/CSS/JS that constitutes the client application; no compilation required; files are copied directly into the edge proxy Docker image |
| **Edge Docker container** | A Docker container on the edge device's Linux VM that packages nginx + the Edge SPA static files; provides local serving and offline capability |

---

## 4. Architectural Drivers

These constraints and requirements shape every architectural choice:

| Driver | Source | Architecture impact |
|--------|--------|-------------------|
| 3 student developers, 8–10 weeks | North Star §8 | Minimal component count; Python backend + vanilla JS frontend; no microservices |
| Chrome kiosk on Windows, Linux VM with Docker on same device | North Star §3 + discovery | Chrome connects to localhost; edge proxy in Docker serves SPA and caches cloud content |
| Unstable / limited bandwidth | North Star §3 | Edge proxy caches content + metadata locally; reduces cloud dependency |
| Hybrid offline support | North Star §6 | Edge proxy serves cached responses when cloud is unreachable; IndexedDB for device state |
| TikTok-style video feed | MVP Spec CAP-2 | Auto-play, scroll-snap, prefetch next video; drives video delivery approach |
| ~20 concurrent edge devices | Product Brief §5 | Single cloud server is sufficient; no load balancer needed |
| No user authentication (edge) | Product Brief §4 | No auth middleware on edge-facing API; admin uses simple password |
| Cloud VM deployment | System Boundaries §8 | Single Linux VM; all server components co-located |
| TLS required (cloud) | Decision D13 | HTTPS termination on the cloud server (nginx reverse proxy) |
| Upload-ready MP4 only | Decision D14 | No transcoding pipeline; validate and store |
| Edge device = Windows + local Linux VM | Discovery (architecture) | Docker container on Linux VM; Chrome on Windows connects via localhost |

---

## 5. High-Level Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                       CLOUD VM (Linux)                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Python FastAPI + SQLAlchemy                      │  │
│  │                                                             │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐    │  │
│  │  │  Content API  │  │  Admin API   │  │ Static Server  │    │  │
│  │  │  (REST)       │  │  (REST)      │  │ (Admin SPA)    │    │  │
│  │  └──────┬───────┘  └──────┬───────┘  └────────────────┘    │  │
│  │         │                 │                                  │  │
│  │  ┌──────┴─────────────────┴──────┐                          │  │
│  │  │       Service Layer            │                          │  │
│  │  │  (content, catalog, category,  │                          │  │
│  │  │   interest, auth)              │                          │  │
│  │  └──────┬─────────────────┬──────┘                          │  │
│  │         │                 │                                  │  │
│  │  ┌──────┴──────┐  ┌──────┴──────┐                          │  │
│  │  │  PostgreSQL  │  │  File Store │                          │  │
│  │  │  (metadata)  │  │  (content)  │                          │  │
│  │  └─────────────┘  └─────────────┘                          │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────┐                                                 │
│  │ TLS (nginx)  │  ← reverse proxy, port 443                     │
│  └──────┬───────┘                                                 │
└─────────┼─────────────────────────────────────────────────────────┘
          │
          │ HTTPS
          │
    ┌─────┴──────────────────────────────────┐
    │                                        │
    │                         ┌──────────────┴──────┐
    │                         │  HQ DESKTOP          │
    │                         │  (modern browser)    │
    │                         │                      │
    │                         │  ┌────────────────┐  │
    │                         │  │ Admin SPA      │  │
    │                         │  │ (HTML/JS)      │  │
    │                         │  └────────────────┘  │
    │                         └─────────────────────┘
    │
┌───┴──────────────────────────────────────────────────┐
│  EDGE DEVICE ×N  (Windows PC + 10″ screen)            │
│                                                        │
│  ┌─────────────────────┐  ┌─────────────────────────┐ │
│  │   WINDOWS SIDE      │  │   LINUX VM (Docker)     │ │
│  │                     │  │                         │ │
│  │  ┌───────────────┐  │  │  ┌───────────────────┐  │ │
│  │  │ Chrome        │  │  │  │ Docker Container  │  │ │
│  │  │ (kiosk mode)  │──┼──│  │                   │  │ │
│  │  │               │  │  │  │ ┌───────────────┐ │  │ │
│  │  │ localhost:8080 │  │  │  │ │ nginx         │ │  │ │
│  │  │               │  │  │  │ │ (caching      │ │  │ │
│  │  └───────────────┘  │  │  │ │  reverse      │ │  │ │
│  │                     │  │  │ │  proxy)       │ │  │ │
│  │  ┌───────────────┐  │  │  │ └───────┬───────┘ │  │ │
│  │  │ IndexedDB     │  │  │  │         │         │  │ │
│  │  │ (profile,     │  │  │  │ ┌───────┴───────┐ │  │ │
│  │  │  actions,     │  │  │  │ │ SPA bundle    │ │  │ │
│  │  │  download     │  │  │  │ │ (HTML/JS)     │ │  │ │
│  │  │  records)     │  │  │  │ └───────────────┘ │  │ │
│  │  └───────────────┘  │  │  │                   │  │ │
│  │                     │  │  │ ┌───────────────┐ │  │ │
│  │                     │  │  │ │ Proxy cache   │ │  │ │
│  │                     │  │  │ │ (content +    │ │  │ │
│  │                     │  │  │ │  metadata)    │ │  │ │
│  │                     │  │  │ └───────────────┘ │  │ │
│  │                     │  │  └───────────────────┘  │ │
│  └─────────────────────┘  └─────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

**Key topology change (v0.2):** The edge device is not a simple Chrome browser connecting to the cloud. Each edge device is a Windows PC running a Linux VM. Inside the VM, a Docker container runs an nginx caching proxy that:
1. Serves the Edge SPA from a bundled local copy
2. Proxies all API / content requests to the cloud server
3. Caches responses locally (both metadata and content files)
4. Serves cached responses when the cloud is unreachable (offline mode)

Chrome on Windows connects to `localhost` only. It never connects directly to the cloud.

---

## 6. Major Components

### 6.1 Component Inventory

| # | Component | Location | Tech | Built by team? |
|---|-----------|----------|------|---------------|
| C1 | **Edge SPA** | Edge device (Chrome on Windows) | Vanilla HTML + CSS + JS (no build step) | ✅ Yes |
| C2 | **Admin SPA** | HQ desktop (browser) | Plain HTML + vanilla JS (static files served by FastAPI) | ✅ Yes |
| C3 | **API Server** | Cloud VM | Python FastAPI + SQLAlchemy ORM | ✅ Yes |
| C4 | **Service Layer** | Cloud VM (inside API Server) | Python modules | ✅ Yes |
| C5 | **PostgreSQL** | Cloud VM | PostgreSQL 15+ | ✅ Configure; not build |
| C6 | **File Store** | Cloud VM (local filesystem) | OS filesystem behind abstraction | ✅ Yes (abstraction layer) |
| C7 | **Edge Proxy** | Edge device (Docker on Linux VM) | nginx caching reverse proxy | ✅ Yes (Dockerfile + nginx config) |
| C8 | **TLS Termination** | Cloud VM | nginx reverse proxy | ✅ Configure |

### 6.2 Repository Structure

```
tactitok/
├── client/              ← Edge SPA (vanilla HTML + CSS + JS; open index.html in Chrome)
├── admin/               ← Admin SPA (plain HTML + vanilla JS; served by FastAPI at /admin)
├── server/              ← API Server (Python FastAPI)
│   ├── main.py
│   ├── requirements.txt
│   └── alembic/         ← Database migrations
├── edge-proxy/          ← Dockerfile + nginx.conf for edge caching proxy
└── ...
```

**Rationale:** A flat single-repo structure without workspace tooling. No build step for the frontend: HTML/CSS/JS files are opened directly in Chrome (edge) or served as static files by FastAPI (admin). No shared types package — the API contract is documented in the API spec and enforced by tests.

---

## 7. Component Responsibilities

### C1 — Edge SPA

| Responsibility | Details |
|---------------|---------|
| **Reels feed** | TikTok-style vertical scroll; auto-play; swipe navigation; interest filtering |
| **Library view** | 2-level category tree; text search; content list with type indicators |
| **Video player** | HTML5 `<video>` element; play/pause, progress bar, mute controls |
| **PDF viewer** | PDF.js integration; page-by-page navigation |
| **Download manager** | Initiate downloads (triggers proxy caching); show progress; manage downloaded items |
| **Device profile** | Interest selection (first-time + settings); persist in IndexedDB |
| **Local actions** | Like/Save stored in IndexedDB; no server sync in MVP |
| **Metadata handling** | Request catalog from edge proxy; store in IndexedDB for client-side filtering/search |
| **Network awareness** | Detect online/offline (proxy reachability to cloud); show status indicator; degrade gracefully |
| **Navigation** | Bottom tab bar: Reels, Library, Downloads |

**What changed (v0.2):** The Edge SPA no longer manages Cache API for media files or Service Worker for SPA shell caching. All content caching is handled by the edge proxy. The SPA makes all requests to `localhost` (the proxy), never directly to the cloud. IndexedDB is still used for device profile, local actions, download records (metadata only), and a parsed catalog snapshot for client-side filtering.

**What changed (v0.3):** The Edge SPA is vanilla HTML + CSS + JS with no compilation step. There is no TypeScript, no Vite build, and no `node_modules`. The SPA files are opened directly in Chrome (edge) or copied into the Docker image as-is.

### C2 — Admin SPA

| Responsibility | Details |
|---------------|---------|
| **Authentication** | Password login screen; session token stored in memory/sessionStorage |
| **Content management** | Upload video (MP4) / PDF; fill metadata form; edit; delete |
| **Content update** | Replace file for existing content; server increments version |
| **Category management** | CRUD for 2-level category tree |
| **Interest management** | CRUD for flat interest/tag list |
| **Content list** | Sortable, filterable table of all content items |
| **Upload validation** | Client-side: check file type, size (≤100MB); server validates too |

**What changed (v0.3):** The Admin SPA is plain HTML + vanilla JS served as static files by FastAPI at `/admin`. There is no Vite build step, no TypeScript compiler, and no SPA framework.

### C3 — API Server (Python FastAPI)

| Responsibility | Details |
|---------------|---------|
| **Content API** (edge-facing) | `GET` catalog metadata; `GET` content file (video/PDF) with range request support |
| **Admin API** (admin-facing) | `POST` upload; `PUT` update metadata/file; `DELETE` content; CRUD categories; CRUD interests |
| **Auth middleware** | Admin endpoints protected by password session; edge endpoints are public |
| **Static file serving** | Serve Admin SPA static files at `/admin` (edge SPA files are copied into Docker image) |
| **Content proxy** | Serve content files from File Store with proper headers (Content-Type, Accept-Ranges, Content-Length, Cache-Control) |
| **Validation** | Reject non-MP4 video, non-PDF documents, files >100MB, videos >3 min (if duration check implemented) |

**What changed (v0.2):** The API server no longer serves the Edge SPA. It serves only the Admin SPA. Edge devices get the SPA from the local Docker container.

**What changed (v0.3):** The API server is now Python FastAPI (replacing Node.js + Express). SQLAlchemy is the ORM. Alembic manages database migrations (replaces Prisma migrate).

### C4 — Service Layer

| Service | Responsibility |
|---------|---------------|
| **CatalogService** | CRUD for content metadata; search (title + description); filter by category/interest |
| **CategoryService** | CRUD for category tree; enforce 2-level max; reorder |
| **InterestService** | CRUD for flat interest tags |
| **ContentFileService** | Store/retrieve/delete files via storage abstraction; generate content-id |
| **AuthService** | Validate admin password; issue/validate session tokens |
| **SyncService** | Serve full catalog snapshot for edge sync requests |

*(No changes from v0.1)*

### C5 — PostgreSQL

| Responsibility | Details |
|---------------|---------|
| **Metadata storage** | Content items, categories, interests, content-category/interest mappings |
| **Schema management** | Alembic migrations (versioned migration files; applied via `alembic upgrade head`) |
| **Query support** | Text search (PostgreSQL `ILIKE` or `tsvector`); category tree queries; interest filtering |

*(No changes from v0.1)*

### C6 — File Store (Storage Abstraction)

| Responsibility | Details |
|---------------|---------|
| **Interface** | `store(contentId, file) → path`; `retrieve(contentId) → stream`; `delete(contentId)` |
| **MVP implementation** | Local filesystem: files stored in `./data/content/{contentId}.{ext}` |
| **Future swap** | Interface allows replacing with S3/MinIO without changing service layer |
| **Serving** | API server reads file and streams to client (not direct filesystem access) |

*(No changes from v0.1)*

### C7 — Edge Proxy (nginx caching reverse proxy in Docker)

| Responsibility | Details |
|---------------|---------|
| **SPA serving** | Serve Edge SPA static files (HTML/JS/CSS) from the Docker image; nginx `try_files` handles SPA client-side routing |
| **API proxying** | Forward all `/api/*` requests to the cloud server (HTTPS) |
| **Content caching** | Cache API responses and content files (video/PDF) in nginx `proxy_cache`; configurable cache size (≥10 GB for demo) |
| **Metadata caching** | Cache catalog API responses; serve cached version when cloud is unreachable |
| **Offline mode** | When cloud is down, serve all cached responses transparently; Chrome/SPA does not need to know |
| **Cache headers** | Add `X-Cache-Status` header (HIT/MISS/STALE) so SPA can detect freshness |
| **Not responsible for** | Device profile, local actions, download tracking (these remain in Chrome's IndexedDB) |

**nginx proxy_cache configuration (conceptual):**
```
proxy_cache_path /var/cache/nginx levels=1:2
    keys_zone=tactitok:10m
    max_size=10g
    inactive=30d
    use_temp_path=off;

# Cache content files aggressively (large, rarely change)
location /api/content/ {
    proxy_pass https://CLOUD_SERVER;
    proxy_cache tactitok;
    proxy_cache_valid 200 30d;
    proxy_cache_use_stale error timeout updating http_502 http_503 http_504;
    add_header X-Cache-Status $upstream_cache_status;
}

# Cache catalog metadata with shorter validity
location /api/catalog {
    proxy_pass https://CLOUD_SERVER;
    proxy_cache tactitok;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout updating http_502 http_503 http_504;
    add_header X-Cache-Status $upstream_cache_status;
}

# SPA fallback routing
location / {
    root /var/www/spa;
    try_files $uri $uri/ /index.html;
}
```

### C8 — TLS Termination (Cloud)

| Responsibility | Details |
|---------------|---------|
| **MVP approach** | nginx reverse proxy on port 443 → forwards to uvicorn on localhost:8000 |
| **Fallback** | uvicorn with TLS certs directly (simpler setup, less production-ready) |
| **Certificate** | Let's Encrypt (if domain available) or self-signed for demo |

*(No changes from v0.1)*

---

## 8. Runtime / Deployment View

### 8.1 Cloud VM Deployment

```
Cloud VM (Linux, e.g., Ubuntu 22.04)
├── nginx (port 443, TLS termination)
│   └── proxy_pass → localhost:8000
├── uvicorn (port 8000) — runs FastAPI app
│   ├── FastAPI app (main.py)
│   ├── Serves: Content API, Admin API, Admin SPA static files (/admin)
│   └── Reads/writes: ./data/content/
├── PostgreSQL (port 5432, localhost only)
│   └── Database: tactitok
└── Filesystem
    └── ./data/content/  (uploaded files)
```

**Dev environment setup:**
```
python -m venv .venv
source .venv/bin/activate   # (or .venv\Scripts\activate on Windows)
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload
```

### 8.2 Edge Device Deployment

```
Edge Device (Windows PC with 10″ tablet display)
│
├── WINDOWS SIDE
│   └── Chrome (kiosk mode)
│       ├── Navigates to http://localhost:8080
│       ├── IndexedDB: device profile, download records, local actions
│       └── All requests go to localhost:8080 (edge proxy)
│
└── LINUX VM (e.g., WSL2 or VirtualBox)
    └── Docker
        └── Container: tactitok-edge-proxy
            ├── nginx (port 8080, HTTP)
            │   ├── Serves: Edge SPA static files from /var/www/spa/
            │   ├── Proxies: /api/* → https://CLOUD_SERVER
            │   ├── Cache: /var/cache/nginx/ (content + metadata)
            │   └── Offline: serves cached responses when cloud is unreachable
            └── /var/www/spa/ (Edge SPA build files, baked into image)
```

**Docker build process:**
1. `client/` contains vanilla HTML/CSS/JS files — no build step required
2. Dockerfile copies `client/` into `/var/www/spa/` and `nginx.conf` into `/etc/nginx/`
3. Result: a single Docker image (`tactitok-edge-proxy`) containing nginx + SPA static files

### 8.3 Process Model

**Cloud VM:**

| Process | Count | Restart strategy |
|---------|-------|-----------------|
| nginx (TLS) | 1 | systemd service |
| uvicorn (FastAPI API Server) | 1 | systemd service |
| PostgreSQL | 1 | systemd service |

**Edge Device (per device):**

| Process | Count | Restart strategy |
|---------|-------|-----------------|
| Docker daemon | 1 | systemd (in Linux VM) |
| nginx (in container) | 1 | Docker restart policy: `always` |

**Total: 3 processes on cloud + 2 processes per edge device.**

### 8.4 Network Model

```
Chrome (Windows) ──HTTP──► localhost:8080 (nginx in Docker/Linux VM)
                                │
                                │ HTTPS (when cloud reachable)
                                ▼
                          Cloud Server:443 (nginx TLS → uvicorn:8000)

HQ Desktop (browser) ──HTTPS──► Cloud Server:443
```

- Chrome ↔ Edge Proxy: **HTTP** over localhost (no TLS needed — same machine)
- Edge Proxy ↔ Cloud: **HTTPS** (TLS required; edge proxy validates cloud cert)
- HQ Desktop ↔ Cloud: **HTTPS** (standard browser TLS)

---

## 9. Data / Content Flow Overview

### 9.1 Content Upload Flow

```
HQ Staff → Admin SPA → POST /api/admin/content (multipart) → API Server
    → Validate (type, size, format)
    → ContentFileService.store(file) → ./data/content/{id}.{ext}
    → CatalogService.create(metadata) → PostgreSQL
    → Return 201 + content metadata
```

*(No change from v0.1 — uploads go directly to cloud from HQ desktop)*

### 9.2 Metadata Sync Flow (Edge)

```
Edge SPA (on app open / manual refresh)
    → GET /api/catalog → localhost:8080 (edge proxy)
    → Edge proxy checks cache:
        → MISS or STALE: forward to cloud server → cache response → return
        → HIT: serve from cache
        → Cloud unreachable: serve stale cache (proxy_cache_use_stale)
    → Edge SPA receives catalog JSON
    → Stores in IndexedDB for client-side filtering/search
    → UI renders from parsed catalog data
```

### 9.3 Content Consumption Flow (Video)

```
Edge SPA (user scrolls to video in reels)
    → <video src="/api/content/{id}/file">
    → Browser sends GET with Range header to localhost:8080
    → Edge proxy:
        → If cached: serve from /var/cache/nginx/ (HIT)
        → If not cached: proxy to cloud, cache full response, stream to Chrome
    → Browser plays video progressively
```

**Note:** nginx `proxy_cache` caches the full response on first request. Subsequent requests (including range requests for the same file) are served from cache. This means the first playback of a video also pre-caches it for offline use.

### 9.4 Content Consumption Flow (PDF)

```
Edge SPA (user opens PDF from library)
    → fetch("/api/content/{id}/file") → localhost:8080
    → Edge proxy serves from cache or proxies to cloud (same as video)
    → Edge SPA passes ArrayBuffer to PDF.js
    → PDF.js renders page-by-page in canvas
```

### 9.5 Download Flow

```
Edge SPA (user taps Download)
    → fetch("/api/content/{id}/file") → localhost:8080
    → Edge proxy:
        → If cached: serve immediately (HIT)
        → If not cached: proxy to cloud → cache → stream to Chrome
    → SPA receives full response (reads to completion to ensure proxy caches it)
    → SPA stores download record in IndexedDB (id, title, type, size, date, version)
    → UI updates: item appears in Downloads tab
```

**What changed (v0.2):** The SPA no longer stores the file in Cache API. The file is cached by the edge proxy. The SPA only stores a metadata record in IndexedDB to track what the user has explicitly downloaded. The proxy cache holds the actual file.

### 9.6 Offline Playback Flow

```
Edge SPA (user opens item, cloud unreachable)
    → Read download record from IndexedDB (metadata only)
    → Request file: <video src="/api/content/{id}/file"> or fetch(...)
    → Request goes to localhost:8080 (edge proxy)
    → Edge proxy: cloud unreachable → serve from cache (STALE)
    → Browser plays video / SPA renders PDF normally
```

**What changed (v0.2):** Offline playback is transparent. The SPA makes the same request as online; the proxy handles the offline serving. No special offline code path in the SPA (no Cache API lookups, no blob URLs). The SPA code for online and offline playback is identical.

### 9.7 Prefetch Flow (Reels)

```
Edge SPA (while current video plays)
    → Identify next video in feed
    → fetch("/api/content/{nextId}/file", { headers: { Range: "bytes=0-{N}" } })
    → Request goes to localhost:8080 (edge proxy)
    → Proxy: if not cached, fetches full file from cloud and caches it
    → Returns partial response to Chrome
    → Store partial response in memory
    → When user swipes to next video:
        → Start playback from prefetched bytes
        → Continue via additional requests (served from proxy cache — instant)
```

**Benefit of proxy:** The prefetch request triggers the proxy to cache the full file. Subsequent range requests for the same file are served from cache with zero latency.

---

## 10. Offline / Sync / Local Persistence Approach

### 10.1 Storage Allocation

| Store | Location | Contents | Size expectation | Persistence |
|-------|----------|----------|-----------------|------------|
| **Edge proxy cache** | Docker (Linux VM) filesystem | Cached content files + API responses | Up to 10 GB | Persists until Docker volume is cleared or cache evicts |
| **IndexedDB** | Chrome (Windows) | Device profile (interests), download records (metadata), local actions (like/save) | <1 MB | Persists across sessions |
| **Memory** | Chrome (Windows) | Prefetch buffers for next video; parsed catalog data | ~5–20 MB | Lost on page unload |

**What changed (v0.2):** Cache API and Service Worker cache are no longer used. The edge proxy's `proxy_cache` replaces both. This eliminates all Service Worker code and Cache API code from the SPA, significantly simplifying the client.

### 10.2 Offline Capability Matrix

| Feature | Online | Offline (cloud unreachable) | How |
|---------|--------|---------------------------|-----|
| App startup | Load SPA from proxy | ✅ SPA is local (bundled in Docker) | nginx serves static files from `/var/www/spa/` |
| Reels feed | Stream via proxy → cloud | ✅ If previously accessed | Proxy serves cached video files |
| Library browsing | Fresh catalog from cloud via proxy | ✅ Cached catalog | Proxy serves cached `/api/catalog` response |
| Video playback | Stream via proxy → cloud | ✅ If previously accessed or downloaded | Proxy serves cached file |
| PDF viewing | Fetch via proxy → cloud | ✅ If previously accessed or downloaded | Proxy serves cached file |
| Downloads tab | Show download records | ✅ Always | IndexedDB records; files served from proxy cache |
| Interest change | Immediate | ✅ Local only | IndexedDB write |
| Metadata sync | Proxy forwards to cloud | ❌ Serve stale cache | Show "last synced" timestamp; proxy serves stale |
| Search | Client-side filter on catalog | ✅ On cached catalog | IndexedDB catalog snapshot |

**Key improvement (v0.2):** Offline reels feed is now possible for previously accessed videos. In v0.1, reels required a live stream. Now the proxy cache makes any previously-viewed video available offline.

### 10.3 Sync Strategy

- **Direction:** Edge proxy → Cloud pull (transparent; edge proxy forwards requests)
- **Trigger:** On app open + manual refresh button (SPA requests `/api/catalog`)
- **Payload:** Full catalog JSON (all content metadata)
- **Conflict resolution:** Server wins; edge SPA replaces local catalog in IndexedDB
- **Staleness:** Edge proxy caches catalog for ~5 minutes; after that, next request goes to cloud (if reachable)
- **Incremental sync:** Not in MVP (catalog is small: ~15 items). Design API to support `?since=timestamp` parameter for future delta sync.

### 10.4 Edge Proxy Cache Management

| Setting | Value | Rationale |
|---------|-------|-----------|
| **Max cache size** | 10 GB | All demo content (~15 items × ≤100 MB) fits comfortably |
| **Content file cache validity** | 30 days | Content changes infrequently; version check on metadata sync detects updates |
| **Catalog cache validity** | 5 minutes | Frequent enough for demo; stale serving when offline |
| **Inactive eviction** | 30 days | Items not accessed for 30 days are evicted; generous for demo |
| **Stale serving** | On error, timeout, 502, 503, 504 | Ensures offline functionality |

---

## 11. Security / Trust / Operational Considerations

### 11.1 Transport Security

- Cloud: All traffic over HTTPS (TLS 1.2+); nginx terminates TLS on port 443
- Edge proxy → Cloud: HTTPS (proxy validates cloud server certificate)
- Chrome → Edge proxy: HTTP over localhost (no TLS — same machine; no network exposure)
- Self-signed cert or Let's Encrypt for cloud server demo

### 11.2 Authentication

| Surface | Mechanism | Implementation |
|---------|-----------|---------------|
| Edge SPA → Edge proxy → Content API | None (public, read-only) | No auth middleware on `/api/catalog`, `/api/content` |
| Admin SPA → Admin API | Shared password | `POST /api/admin/login` → returns session token (JWT or opaque); token sent in `Authorization` header |
| Admin session | Server-side validation | Token expiry; stored in sessionStorage (not localStorage — clears on tab close) |

### 11.3 Content Security

- Content files served by API server — no direct filesystem URLs exposed
- Edge proxy cache is on the local Linux VM filesystem — not directly accessible from Windows (Chrome accesses via HTTP only)
- File upload validates MIME type + file extension
- No executable file types accepted
- Uploaded files stored with generated content-id filenames (no user-supplied paths)

### 11.4 Operational Basics

- Standard server logging (request logs, error logs) — no analytics platform
- PostgreSQL connection pooling (default pool size sufficient for ~20 concurrent)
- systemd for uvicorn process auto-restart
- Docker restart policy `always` for edge proxy container
- No monitoring/alerting platform in MVP

---

## 12. External Dependencies

| Dependency | Version/Spec | Role | Risk |
|-----------|-------------|------|------|
| **Python** | 3.11+ | API server runtime (cloud) | Low — stable LTS |
| **FastAPI** | 0.100+ | HTTP server framework | Low — actively maintained |
| **SQLAlchemy** | 2.x | ORM (cloud) | Low — standard |
| **Alembic** | Latest | Database migrations | Low — standard |
| **uvicorn** | Latest | ASGI server (cloud) | Low — standard |
| **PostgreSQL** | 15+ | Metadata storage (cloud) | Low — standard |
| **nginx** | Latest stable | TLS termination (cloud) + caching proxy (edge) | Low — standard |
| **PDF.js** | Latest | In-browser PDF rendering | Low — Mozilla-maintained |
| **Docker** | Latest stable | Edge proxy container runtime | Low — standard |
| **Chrome** | Latest stable | Edge runtime (Windows) | External — not managed by team |

No runtime dependencies on cloud services (AWS, GCP, etc.) — the cloud server runs on a plain Linux VM. Edge devices run Docker on their local Linux VM.

---

## 13. Key Architectural Decisions

| # | Decision | Rationale | Alternatives considered |
|---|---------|-----------|----------------------|
| AD1 | **Flat single repo** (client + admin + server + edge-proxy; no monorepo tooling) | No build tooling overhead; no shared types package; no pnpm workspaces; simpler for 3 students | Monorepo with workspaces (adds tooling complexity without benefit when no shared TS types needed) |
| AD2 | **Vanilla HTML + CSS + JS for both SPAs** (no TypeScript, no Vite, no build step) | No compilation step; open index.html directly in Chrome; zero tooling dependency; sufficient for SPA complexity | TypeScript + Vite (adds build step and tooling overhead); React (adds framework overhead) |
| AD3 | **Python FastAPI backend** | Familiar to team; excellent async support; automatic OpenAPI docs; SQLAlchemy ORM; Alembic migrations | Node.js/Express (TS mismatch with vanilla JS frontend); Go (overkill for MVP) |
| AD4 | **PostgreSQL for metadata** | Production-grade; supports text search; handles concurrent reads; continuation-ready | SQLite (simpler but poor concurrency); MongoDB (less structured) |
| AD5 | **Local filesystem for content files** behind abstraction | Simplest; no external service; abstraction allows S3/MinIO swap | S3 directly (adds cloud dependency); MinIO (extra process) |
| AD6 | **MP4 + HTTP range requests** for video | Simplest streaming; no transcoding; Chrome handles natively | HLS/DASH (complex; needs segmenting); WebRTC (wrong use case) |
| AD7 | **Edge proxy (nginx in Docker) for SPA serving + caching** | Eliminates Service Worker and Cache API complexity; handles offline transparently; SPA code is simpler | Service Worker + Cache API (more client complexity); custom Node.js proxy on edge (more code to maintain) |
| AD8 | **IndexedDB for device state only** (profile, actions, download records) | Only structured local data that the SPA needs to manage directly; all content caching delegated to proxy | IndexedDB + Cache API (redundant with proxy); localStorage (size-limited) |
| AD9 | **Single uvicorn process** (no microservices) | 3 developers; 10 weeks; ~20 users; no need for distributed architecture | Microservices (too complex); serverless (wrong deployment model) |
| AD10 | **nginx as TLS reverse proxy** (cloud) | Standard pattern; offloads TLS from Node; production-ready | Node native TLS (simpler but less robust); Caddy (less common) |
| AD11 | **Full catalog sync** (not delta) | Catalog is ~15 items; full JSON payload is <10 KB; delta adds complexity | Delta sync (premature optimization); GraphQL subscriptions (overkill) |
| AD12 | **SPA bundled into Docker image** (not fetched from cloud) | SPA always available locally; no dependency on cloud for app startup; simplifies offline | Serve SPA from cloud (requires SW for offline startup); pre-install SPA on Windows (harder to update) |

---

## 14. Alternatives Considered or Intentionally Deferred

| Alternative | Why deferred / rejected |
|------------|------------------------|
| **HLS/DASH adaptive streaming** | Requires video segmentation tooling (ffmpeg); MP4 range requests are sufficient for ≤3 min clips on ~20 devices |
| **Service Worker for SPA caching** | SPA is bundled locally in Docker; SW adds complexity without benefit in this topology |
| **Cache API for media files** | Edge proxy cache handles all content caching; Cache API would be redundant |
| **GraphQL** | REST is simpler; catalog is small; GraphQL adds learning curve |
| **WebSocket / SSE for push sync** | Pull-based sync is sufficient for MVP; push can be added to the same FastAPI server later (FastAPI supports WebSockets natively) |
| **Redis cache layer** | ~20 concurrent devices don't require in-memory caching; PostgreSQL handles it |
| **CDN for content delivery** | Single server with direct file serving is sufficient; CDN can be added in front of the same API later |
| **React Native / PWA installable** | Chrome kiosk is the target; no need for native install |
| **Heavy ORM alternatives** | SQLAlchemy (chosen) is the standard Python ORM; Tortoise ORM or raw SQL are alternatives but SQLAlchemy has the broadest support |
| **S3 / MinIO for content storage** | Local filesystem is simplest for MVP; storage abstraction allows swap later |
| **Microservices** | 3 developers, 10 weeks, ~20 users — monolith with clean internal modules is the right choice |
| **Custom Python/Node proxy on edge** | nginx proxy_cache is mature, zero-code caching; custom proxy means more code to maintain |
| **Kubernetes / Docker Compose orchestration** | Single container per edge device; `docker run` with restart policy is sufficient |

---

## 15. Assumptions

| # | Assumption | Impact if wrong |
|---|-----------|----------------|
| AA1 | Vanilla HTML + JS (no framework, no TypeScript) is accessible to 3 student developers | May need to add a lightweight framework if DOM complexity grows; delays project start |
| AA2 | Python FastAPI + uvicorn handles ~20 concurrent video streams without bottleneck | Need load testing; may need nginx file serving to bypass Python for large files |
| AA3 | PostgreSQL runs comfortably alongside uvicorn + nginx on a single VM (4+ GB RAM) | Need larger VM or optimize resource usage |
| AA4 | Flat single-repo structure (no workspace tooling) is manageable for 3 students | May need to add tooling if code organisation becomes an issue |
| AA5 | Students can write a Dockerfile + nginx.conf for the edge proxy with reasonable guidance | May need a pre-built template; adds ~1–2 days if unfamiliar |
| AA6 | FastAPI can serve content files with range request support (206 Partial Content) adequately | May need nginx to serve files directly from disk (bypassing Python) |
| AA7 | A single uvicorn process handles the MVP load | May need gunicorn multi-worker mode or nginx upstream balancing |
| AA8 | nginx proxy_cache handles range requests correctly for cached content | Need testing; if not, may need full-file fetch for caching then separate range serving |
| AA9 | Linux VM networking allows Docker container to bind port 8080 accessible from Windows localhost | May need port forwarding or bridge networking configuration |
| AA10 | 10 GB proxy cache is sufficient for all demo content (~15 items) | Increase cache size or add eviction monitoring |

---

## 16. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| AR1 | uvicorn/FastAPI becomes a bottleneck serving video files to 20 concurrent clients | Medium | High | Test early with simulated load; fallback: nginx serves files directly from `./data/content/` via X-Accel-Redirect |
| AR2 | Docker / Linux VM setup is unfamiliar to students and takes too long | Medium | Medium | Provide pre-built Dockerfile template; keep config minimal; pair-program setup |
| AR3 | Lack of shared types between Python backend and JS frontend causes API contract drift | Low | Medium | Maintain API contract in `06_api-contract.md`; add integration tests that validate response shapes |
| AR4 | PostgreSQL text search is insufficient for demo quality | Low | Low | Use `ILIKE` for MVP; upgrade to `tsvector` if needed; or client-side filter (15 items) |
| AR5 | CSS scroll-snap for TikTok-style reels may be janky on tablet | Medium | High | Prototype in week 1; consider Swiper.js or custom touch handler if native scroll-snap insufficient |
| AR6 | File upload (100MB) is slow or times out over unstable admin network | Low | Medium | FastAPI supports streaming multipart uploads; configure uvicorn/nginx timeouts appropriately; or accept that admin uses stable HQ network |
| AR7 | nginx proxy_cache evicts downloaded content before user accesses offline | Low | Medium | Set generous inactive timeout (30d); monitor cache hit rate; cache size 10 GB is ample for 15 items |
| AR8 | Port mapping between Linux VM and Windows (for localhost:8080) requires non-trivial config | Medium | Medium | Test VM networking early (WSL2 maps ports automatically; VirtualBox needs port forwarding) |
| AR9 | nginx proxy_cache doesn't cache range request responses correctly | Low | High | Test early; if needed, configure proxy to always fetch full file and serve ranges from cache |

---

## 17. Open Questions / Pending Decisions

| # | Question | Affects | Recommended default | Deadline |
|---|---------|---------|-------------------|----------|
| AQ1 | Should nginx (cloud) serve content files directly (bypass Python) for performance? | Deployment | Start with FastAPI; switch to nginx `X-Accel-Redirect` if load is an issue | Sprint 2 (after load test) |
| AQ2 | CSS scroll-snap vs. library (e.g., Swiper.js) for TikTok-style reels? | UI implementation | CSS scroll-snap first; add Swiper if scroll is janky | Sprint 1 prototype |
| AQ3 | Linux VM type on edge devices: WSL2 vs. VirtualBox vs. other? | Edge deployment | WSL2 (simplest Docker integration on Windows) | Before edge setup |
| AQ4 | Cloud server URL: hardcoded in nginx.conf or configurable via environment variable? | Edge proxy deployment | Environment variable (Docker `-e CLOUD_URL=...`) | Before implementation |
| AQ5 | Should the edge proxy use HTTP or HTTPS to connect to cloud? | Security | HTTPS (TLS); proxy verifies cloud cert | Before deployment |

---

## 18. De-scope Levers

| Priority | Simplification | Effect |
|----------|---------------|--------|
| 1st | Drop nginx TLS on cloud; run uvicorn with TLS certs directly | Simpler cloud deployment; slightly less robust TLS handling |
| 2nd | Hardcode cloud URL in nginx.conf (skip env var) | Simpler Docker setup; must rebuild image for URL changes |
| 3rd | Use SQLite instead of PostgreSQL | Simpler setup; acceptable for ~20 devices; loses text search and concurrent writes |
| 4th | Serve content files via nginx directly on cloud (skip FastAPI proxy) | Loses centralized access control; but removes Python bottleneck concern |
| 5th | Skip Docker; manually install nginx + SPA files on Linux VM | Removes Docker learning curve; harder to update/reproduce |

---

## 19. Continuation Notes

Guidance for a follow-on team extending beyond MVP architecture:

- **Microservices migration:** The service layer (CatalogService, ContentFileService, etc.) is modular. Each service can be extracted into a separate process with its own API if scaling requires it. Start by extracting ContentFileService if video load grows.
- **CDN integration:** The content proxy (`/api/content/{id}/file`) can be fronted by a CDN. Add cache headers (`Cache-Control`, `ETag`) from day one so CDN integration is a configuration change, not a code change.
- **Push sync (WebSocket/SSE):** FastAPI supports WebSockets natively. The edge proxy would pass through WebSocket connections. The SPA's sync module should be designed with a `SyncProvider` pattern so pull can be swapped for push.
- **Object storage (S3/MinIO):** The storage abstraction (`ContentFileService`) has `store`, `retrieve`, `delete` methods. Replace the filesystem implementation with a boto3/S3 client while keeping the same interface.
- **User authentication:** Add FastAPI dependency-based auth middleware (e.g., python-jose for JWT). The API already separates public (edge) from protected (admin) routes. Future: add auth to edge routes, swap device-id for user-id.
- **Clustering / load balancing:** gunicorn multi-worker mode or multiple uvicorn instances behind nginx upstream. PostgreSQL handles concurrent connections natively. File store is shared via filesystem (or object store for multi-VM).
- **CI/CD:** Single pipeline per repo: lint (ruff) → test (pytest) → build Docker image → deploy. Add GitHub Actions or similar when the team is ready.
- **Database migration strategy:** Use Alembic migrations (already in place). Every schema change is a versioned migration file. This is continuation-critical — must be established from sprint 1.
- **Edge proxy enhancement:** Add proxy-side content prefetching (background job that pulls all new content from cloud into cache). Currently the proxy caches on first access; proactive prefetch ensures everything is available offline before the user requests it.
- **Service Worker (future):** If edge requirements grow beyond what the proxy handles (e.g., push notifications, background sync of local actions), a Service Worker can be added to the SPA alongside the proxy. The proxy provides the caching foundation; SW would add browser-level features.

---

*This document is the fourth in the TactiTok document set. Proceed to `product/05_data-model.md`.*
