# API Contract — TactiTok

> **Version:** 0.1
> **Status:** Draft
> **Last updated:** 2026-03-07
> **Preceding document:** `product/05_data-model.md`
> **Next document:** `product/07_delivery-plan.md`

---

## 1. Purpose of This Document

This document defines the HTTP API contract for the TactiTok MVP. It specifies:

- All endpoints, request formats, and response shapes
- Authentication model
- Error envelope
- HTTP caching and streaming behaviour
- What is intentionally excluded from the MVP API

This document is the binding reference for server implementation and client integration. Shared TypeScript types in `packages/shared` must match every DTO defined here. If a conflict arises between this document and the Data Model, resolve by raising an open question — do not silently deviate.

---

## 2. API Principles

| Principle | Detail |
|-----------|--------|
| **REST over JSON** | All endpoints return JSON (except binary file endpoints). Standard HTTP methods and status codes. |
| **Public / Admin split** | Two surface areas: public (edge-facing, no auth) and admin (password-protected). |
| **Full catalog pull** | No delta sync in MVP. Full catalog on every sync request (~15 items ≈ <10 KB). |
| **Range request support** | Content file endpoints support `Range` header (HTTP 206) for progressive video streaming. |
| **Consistent error envelope** | All errors return `{ "error": "...", "code": "..." }`. |
| **No URL versioning** | `/api/...` paths only. Versioning can be added as `/api/v2/...` later without changing MVP paths. |
| **`?since` accepted, ignored** | `GET /api/catalog?since={ISO_timestamp}` is accepted but returns full catalog in MVP. Enables future delta sync without breaking clients. |

---

## 3. Base URLs

| Environment | Base URL |
|-------------|---------|
| Edge SPA → Edge proxy (Chrome on Windows) | `http://localhost:8080` |
| Admin SPA → Cloud server (HQ desktop) | `https://{CLOUD_DOMAIN}` |
| Edge proxy → Cloud server (internal) | `https://{CLOUD_DOMAIN}` |

The Edge SPA sends **all** requests to `localhost:8080`. The edge proxy handles routing to the cloud. The Admin SPA connects directly to the cloud server.

---

## 4. Authentication

### 4.1 Admin Authentication

Admin endpoints are protected with a session token issued on login.

| Aspect | Detail |
|--------|--------|
| **Login** | `POST /api/admin/login` with `{ password: string }` |
| **Token type** | JWT (stateless; no server-side session store needed) |
| **Token delivery** | Response body: `{ token: string; expiresAt: string }` |
| **Token usage** | `Authorization: Bearer {token}` header on all admin requests |
| **Token storage** | Admin SPA stores token in `sessionStorage` (clears on tab close) |
| **Token expiry** | 8 hours (configurable server constant) |
| **Single password** | One shared admin password; stored as env var on server; not in code |

### 4.2 Edge (Public) Endpoints

Edge-facing endpoints (`/api/catalog`, `/api/content/:id/*`) have **no authentication**. They are read-only and depend on network isolation for access control (edge proxy only routes to cloud; the cloud server is not publicly indexed).

---

## 5. Error Format

All error responses (4xx, 5xx) use the following JSON envelope:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE"
}
```

| HTTP Status | When used |
|-------------|---------|
| `400 Bad Request` | Validation failure (missing fields, invalid file type, constraint violation) |
| `401 Unauthorized` | Missing or invalid auth token on admin endpoint |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | Duplicate resource (e.g., interest name already exists) |
| `413 Payload Too Large` | Upload exceeds file size limit |
| `415 Unsupported Media Type` | File type not allowed (not MP4 or PDF) |
| `500 Internal Server Error` | Unexpected server error |

---

## 6. Public API (Edge-facing, No Auth)

### 6.1 GET /api/catalog

Returns the full catalog snapshot: all content items with metadata, the full category tree, and all interests.

**Used by:** Edge SPA on app open and on manual refresh. Edge proxy caches this response for 5 minutes.

**Request:**

```
GET /api/catalog
GET /api/catalog?since=2026-03-01T00:00:00.000Z   (accepted; returns full catalog in MVP)
```

**Response: 200 OK**

```json
{
  "syncedAt": "2026-03-07T10:00:00.000Z",
  "items": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "type": "video",
      "filename": "briefing.mp4",
      "fileSize": 52428800,
      "mimeType": "video/mp4",
      "duration": 120,
      "thumbnailUrl": "/api/content/{id}/thumbnail",
      "version": 1,
      "categoryIds": ["uuid", "uuid"],
      "interestIds": ["uuid"],
      "createdAt": "2026-03-07T09:00:00.000Z",
      "updatedAt": "2026-03-07T09:00:00.000Z"
    }
  ],
  "categories": [
    {
      "id": "uuid",
      "name": "Weapons",
      "parentId": null,
      "sortOrder": 0
    },
    {
      "id": "uuid",
      "name": "Rifles",
      "parentId": "uuid",
      "sortOrder": 0
    }
  ],
  "interests": [
    {
      "id": "uuid",
      "name": "Urban Combat"
    }
  ]
}
```

**Field notes:**
- `syncedAt` is the server timestamp at the moment the response was generated.
- `thumbnailUrl` is a relative path; Edge SPA prepends proxy base URL. `null` if no thumbnail was uploaded.
- `duration` is in seconds; `null` for PDFs.
- Items are returned `updatedAt` descending (newest first).
- All arrays may be empty.

**Response: 500** — database or server error.

**Edge proxy caching:**

```nginx
proxy_cache_valid 200 5m;
proxy_cache_use_stale error timeout updating http_502 http_503 http_504;
proxy_ignore_headers Cache-Control;   # cache despite server no-store
```

*(The server sets `Cache-Control: no-store` to prevent browser caching. The edge proxy is configured to cache regardless via `proxy_ignore_headers`.)*

---

### 6.2 GET /api/content/:id/file

Returns the raw binary content file (MP4 or PDF). Supports HTTP range requests for progressive video streaming and prefetch.

**Used by:** Edge SPA for video playback (`<video src="...">`), PDF fetching, download initiation, and reels prefetch.

**Request:**

```
GET /api/content/{id}/file
Range: bytes=0-499999        (optional — for range/prefetch)
```

**Response: 200 OK** (full file, no Range header sent)

```
Content-Type: video/mp4
Content-Length: 52428800
Accept-Ranges: bytes
Cache-Control: max-age=2592000, immutable
ETag: "1-{id}"
Content-Disposition: inline; filename="briefing.mp4"
```

**Response: 206 Partial Content** (range request)

```
Content-Type: video/mp4
Content-Range: bytes 0-499999/52428800
Content-Length: 500000
Accept-Ranges: bytes
```

**Response: 404 Not Found** — content item does not exist.

**Header notes:**
- `ETag` format is `"{version}-{id}"`. When content is updated (`version++`), the ETag changes, invalidating the edge proxy cache entry for that item.
- `Accept-Ranges: bytes` is required for Chrome's `<video>` element to issue range requests.
- `Cache-Control: max-age=2592000, immutable` = 30 days; matches edge proxy cache validity.
- `Content-Disposition: inline` tells Chrome to render (not save) the file.

**Edge proxy caching:**

```nginx
proxy_cache_valid 200 206 30d;
proxy_cache_use_stale error timeout updating http_502 http_503 http_504;
```

---

### 6.3 GET /api/content/:id/thumbnail

Returns the thumbnail image for a content item. Returns 404 if no thumbnail was uploaded; the SPA shows a type-based placeholder in that case.

**Used by:** Edge SPA for library and reels card thumbnails.

**Request:**

```
GET /api/content/{id}/thumbnail
```

**Response: 200 OK**

```
Content-Type: image/jpeg
Content-Length: 102400
Cache-Control: max-age=2592000, immutable
ETag: "1-{id}-thumb"
```

**Response: 404 Not Found** — no thumbnail for this content item.

**Edge proxy caching:**

```nginx
proxy_cache_valid 200 30d;
```

---

## 7. Admin API (Auth Required)

All admin endpoints require:

```
Authorization: Bearer {token}
```

Missing or invalid token → `401 Unauthorized`.

---

### 7.1 Auth

#### POST /api/admin/login

**Request:** `Content-Type: application/json`

```json
{
  "password": "string"
}
```

**Response: 200 OK**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-03-07T18:00:00.000Z"
}
```

**Response: 401 Unauthorized** — wrong password. Body: `{ "error": "Invalid password" }`.

---

#### POST /api/admin/logout

Clears the client-side token. Stateless JWT means the server has no session to invalidate; this endpoint is a no-op on the server but is included for API consistency and future session revocation.

**Request:** No body.

**Response: 204 No Content**

---

### 7.2 Content

#### GET /api/admin/content

Returns all content items. Sorted `createdAt` descending.

**Response: 200 OK**

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "type": "video",
      "filename": "briefing.mp4",
      "fileSize": 52428800,
      "mimeType": "video/mp4",
      "duration": 120,
      "thumbnailUrl": "/api/content/{id}/thumbnail",
      "version": 1,
      "categoryIds": ["uuid"],
      "interestIds": ["uuid"],
      "createdAt": "2026-03-07T09:00:00.000Z",
      "updatedAt": "2026-03-07T09:00:00.000Z"
    }
  ]
}
```

*(Same `ContentItemDTO` shape as catalog items.)*

---

#### POST /api/admin/content

Upload a new content item. File and metadata submitted together as `multipart/form-data`.

**Request:** `Content-Type: multipart/form-data`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `file` | binary | Yes | MP4 or PDF; ≤ 100 MB |
| `title` | string | Yes | Max 255 chars; non-empty |
| `description` | string | No | Default: `""` |
| `categoryIds` | string (JSON array) | No | Array of category UUIDs; default `[]` |
| `interestIds` | string (JSON array) | No | Array of interest UUIDs; default `[]` |

**Response: 201 Created** — full `ContentItemDTO` for the created item.

**Validation errors (400):**
- `file` missing
- MIME type not `video/mp4` or `application/pdf`
- File extension does not match MIME type
- File size > 100 MB
- `title` missing or empty
- `categoryIds` / `interestIds` contain non-existent UUIDs

**Video-specific validation:**
- Duration > 180 seconds → `400` (if duration parsing is implemented; treat as soft constraint if not ready in sprint)

---

#### GET /api/admin/content/:id

Returns a single content item by ID.

**Response: 200 OK** — `ContentItemDTO`.

**Response: 404 Not Found**

---

#### PUT /api/admin/content/:id

Update content metadata only. Does not replace the file. All fields are optional; only provided fields are updated.

**Request:** `Content-Type: application/json`

```json
{
  "title": "string",
  "description": "string",
  "categoryIds": ["uuid"],
  "interestIds": ["uuid"]
}
```

**Response: 200 OK** — updated `ContentItemDTO`.

**Validation errors (400):**
- `title` is empty string (if provided)
- `categoryIds` / `interestIds` contain non-existent UUIDs

**Response: 404 Not Found**

---

#### PUT /api/admin/content/:id/file

Replace the binary file for an existing content item. Increments `version` and updates `updatedAt`. The replacement file must be the same content type as the existing item.

**Request:** `Content-Type: multipart/form-data`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `file` | binary | Yes | Must match existing item type; ≤ 100 MB |

**Response: 200 OK**

```json
{
  "id": "uuid",
  "version": 2,
  "fileSize": 48234567,
  "updatedAt": "2026-03-07T12:00:00.000Z"
}
```

**Validation errors (400):**
- File missing
- MIME type does not match existing item type
- File size > 100 MB

**Response: 404 Not Found**

---

#### PUT /api/admin/content/:id/thumbnail

Upload or replace the thumbnail image for a content item.

**Request:** `Content-Type: multipart/form-data`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `thumbnail` | binary | Yes | JPEG, PNG, or WebP; ≤ 5 MB |

**Response: 200 OK**

```json
{
  "id": "uuid",
  "thumbnailUrl": "/api/content/{id}/thumbnail",
  "updatedAt": "2026-03-07T12:00:00.000Z"
}
```

**Validation errors (400):**
- File missing
- MIME type not `image/jpeg`, `image/png`, or `image/webp`
- File size > 5 MB

**Response: 404 Not Found**

---

#### DELETE /api/admin/content/:id

Delete a content item. Hard delete — removes the database record, the content file from the filesystem, and the thumbnail (if any). Junction rows (`content_categories`, `content_interests`) are cascade-deleted by the database.

**Response: 204 No Content**

**Response: 404 Not Found**

---

### 7.3 Categories

#### GET /api/admin/categories

Returns all categories as a flat list. The client builds the tree from `parentId`.

**Response: 200 OK**

```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Weapons",
      "parentId": null,
      "sortOrder": 0,
      "createdAt": "2026-03-07T09:00:00.000Z",
      "updatedAt": "2026-03-07T09:00:00.000Z"
    }
  ]
}
```

---

#### POST /api/admin/categories

Create a new category.

**Request:** `Content-Type: application/json`

```json
{
  "name": "string",
  "parentId": "uuid or null",
  "sortOrder": 0
}
```

**Response: 201 Created** — full `CategoryAdminDTO`.

**Validation errors (400):**
- `name` missing or empty
- `parentId` references a non-existent category
- `parentId` references a child category (would exceed 2-level max depth)
- `name` not unique within siblings (same `parentId`)

---

#### PUT /api/admin/categories/:id

Update a category. All fields optional.

**Request:** `Content-Type: application/json`

```json
{
  "name": "string",
  "parentId": "uuid or null",
  "sortOrder": 0
}
```

**Response: 200 OK** — updated `CategoryAdminDTO`.

**Validation errors (400):**
- Reparenting would exceed 2-level max depth
- `name` not unique within new siblings

**Response: 404 Not Found**

---

#### DELETE /api/admin/categories/:id

Delete a category. **Cascade-deletes** all child categories and removes all `content_categories` junction rows for the deleted category and its children. Content items themselves are not deleted — they become uncategorized.

**Response: 204 No Content**

**Response: 404 Not Found**

---

### 7.4 Interests

#### GET /api/admin/interests

Returns all interests as a flat list.

**Response: 200 OK**

```json
{
  "interests": [
    {
      "id": "uuid",
      "name": "Urban Combat",
      "createdAt": "2026-03-07T09:00:00.000Z"
    }
  ]
}
```

---

#### POST /api/admin/interests

Create a new interest.

**Request:** `Content-Type: application/json`

```json
{
  "name": "string"
}
```

**Response: 201 Created** — full `InterestAdminDTO`.

**Validation errors (400):** `name` missing or empty.

**Response: 409 Conflict** — name already exists (globally unique).

---

#### PUT /api/admin/interests/:id

Rename an interest.

**Request:** `Content-Type: application/json`

```json
{
  "name": "string"
}
```

**Response: 200 OK** — updated `InterestAdminDTO`.

**Response: 404 Not Found**

**Response: 409 Conflict** — new name already exists.

---

#### DELETE /api/admin/interests/:id

Delete an interest. Removes all `content_interests` junction rows. Edge device profiles with stale `selectedInterestIds` references are cleaned up by the SPA on next sync (filter absent IDs from catalog).

**Response: 204 No Content**

**Response: 404 Not Found**

---

## 8. Shared TypeScript Types

Defined in `packages/shared/src/types.ts`. Used by all packages. Server and client must import from here — no local re-definitions.

```typescript
// ---- Domain types ----

export type ContentType = 'video' | 'pdf';

export interface ContentItemDTO {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  filename: string;
  fileSize: number;              // bytes
  mimeType: string;
  duration: number | null;       // seconds; null for PDF
  thumbnailUrl: string | null;   // relative URL or null
  version: number;
  categoryIds: string[];
  interestIds: string[];
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}

export interface CategoryDTO {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
}

export interface CategoryAdminDTO extends CategoryDTO {
  createdAt: string;
  updatedAt: string;
}

export interface InterestDTO {
  id: string;
  name: string;
}

export interface InterestAdminDTO extends InterestDTO {
  createdAt: string;
}

// ---- Catalog ----

export interface CatalogResponse {
  syncedAt: string;
  items: ContentItemDTO[];
  categories: CategoryDTO[];
  interests: InterestDTO[];
}

// ---- Auth ----

export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;             // ISO 8601
}

// ---- File update responses ----

export interface FileUpdateResponse {
  id: string;
  version: number;
  fileSize: number;
  updatedAt: string;
}

export interface ThumbnailUpdateResponse {
  id: string;
  thumbnailUrl: string;
  updatedAt: string;
}

// ---- Errors ----

export interface ApiError {
  error: string;
  code?: string;
}
```

---

## 9. HTTP Caching Summary

| Endpoint | Server `Cache-Control` | Edge proxy cache | Notes |
|---------|----------------------|-----------------|-------|
| `GET /api/catalog` | `no-store` | 5 minutes | Proxy overrides via `proxy_ignore_headers Cache-Control` |
| `GET /api/content/:id/file` | `max-age=2592000, immutable` | 30 days | ETag includes version; changes on content update |
| `GET /api/content/:id/thumbnail` | `max-age=2592000, immutable` | 30 days | ETag includes version |
| All admin endpoints | `no-store` | Not cached | Admin SPA has stable network |

**Catalog cache note:** The server sets `Cache-Control: no-store` to prevent Chrome from caching the catalog (the SPA manages its own IndexedDB copy). The edge proxy caches it anyway using `proxy_ignore_headers Cache-Control` for the `/api/catalog` location block only.

---

## 10. Sync and Offline Behaviour

### 10.1 Sync Trigger

Metadata sync is initiated by the Edge SPA in two cases:
1. **On app open** — SPA fetches `GET /api/catalog` immediately after loading.
2. **Manual refresh** — user taps the refresh button in the UI.

There is no background or periodic sync in MVP.

### 10.2 Sync Flow

```
Edge SPA → GET /api/catalog → localhost:8080 (edge proxy)

  Cache HIT (< 5 min): serve cached response immediately
  Cache MISS or STALE: forward to cloud → cache response → return
  Cloud unreachable: serve stale response (proxy_cache_use_stale)

Edge SPA receives CatalogResponse:
  → Replace CachedCatalog singleton in IndexedDB
  → Update "last synced" timestamp in UI
  → Remove orphaned DownloadRecords / LocalActions (contentId not in catalog)
  → Re-render feed and library from new catalog data
```

### 10.3 Content Update Detection ("Updated" Badge)

On sync, the Edge SPA compares `DownloadRecord.version` with `CatalogResponse.items[].version` for each downloaded item. If `catalog.version > downloadRecord.version`, the item shows an "updated" badge in the Downloads tab.

### 10.4 Orphan Cleanup

After a successful catalog sync, the Edge SPA must:
1. Remove `DownloadRecord` entries whose `contentId` is no longer in the catalog.
2. Remove `LocalAction` entries whose `contentId` is no longer in the catalog.
3. Remove stale interest IDs from `DeviceProfile.selectedInterestIds` that no longer exist in the catalog.

---

## 11. File Upload Constraints

| Constraint | Value | Enforcement |
|-----------|-------|-------------|
| Max content file size | 100 MB | Multer server config + client-side pre-check |
| Allowed video MIME | `video/mp4` | Server: MIME type + magic-byte check |
| Allowed document MIME | `application/pdf` | Server: MIME type + magic-byte check |
| Max video duration | 180 s (3 min) | Server: soft constraint (validate if feasible in sprint) |
| Max thumbnail size | 5 MB | Server: Multer config + client-side pre-check |
| Allowed thumbnail MIMEs | `image/jpeg`, `image/png`, `image/webp` | Server: MIME type + extension check |

**MIME validation approach:** Check both the `Content-Type` header from the client and the file's magic bytes using a library such as `file-type`. Magic bytes are the authoritative check — the client-provided MIME type alone is insufficient.

---

## 12. Endpoint Reference Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/catalog` | None | Full catalog sync |
| `GET` | `/api/content/:id/file` | None | Binary content file (range-aware) |
| `GET` | `/api/content/:id/thumbnail` | None | Thumbnail image |
| `POST` | `/api/admin/login` | None | Issue session token |
| `POST` | `/api/admin/logout` | Bearer | Client-side token discard (no-op on server) |
| `GET` | `/api/admin/content` | Bearer | List all content items |
| `POST` | `/api/admin/content` | Bearer | Upload new content item |
| `GET` | `/api/admin/content/:id` | Bearer | Get single content item |
| `PUT` | `/api/admin/content/:id` | Bearer | Update content metadata |
| `PUT` | `/api/admin/content/:id/file` | Bearer | Replace content file |
| `PUT` | `/api/admin/content/:id/thumbnail` | Bearer | Upload/replace thumbnail |
| `DELETE` | `/api/admin/content/:id` | Bearer | Delete content item |
| `GET` | `/api/admin/categories` | Bearer | List all categories |
| `POST` | `/api/admin/categories` | Bearer | Create category |
| `PUT` | `/api/admin/categories/:id` | Bearer | Update category |
| `DELETE` | `/api/admin/categories/:id` | Bearer | Delete category (cascade) |
| `GET` | `/api/admin/interests` | Bearer | List all interests |
| `POST` | `/api/admin/interests` | Bearer | Create interest |
| `PUT` | `/api/admin/interests/:id` | Bearer | Rename interest |
| `DELETE` | `/api/admin/interests/:id` | Bearer | Delete interest |

**Total: 20 endpoints.** 3 public, 17 admin.

---

## 13. Assumptions

| # | Assumption | Impact if wrong |
|---|-----------|----------------|
| AC1 | Full catalog pull is adequate for ~15 items (<10 KB JSON) | Need delta sync if catalog grows to 100+ items |
| AC2 | nginx proxy caches the complete content file on first range-request access | May need full-file fetch trigger before caching; test early (see Risk CR1) |
| AC3 | MIME type + magic-byte validation is sufficient for file security in a controlled demo environment | Structured content attack still possible; acceptable for MVP |
| AC4 | JWT is stateless; admin logout is client-side token discard only | If revocation is needed, add a server-side blocklist |
| AC5 | Admin always operates on a stable network; multipart upload without chunking is acceptable | Large file uploads may time out; add chunked upload if needed |
| AC6 | 8-hour token expiry suits a typical admin session | Adjust if longer sessions are needed; add refresh endpoint later |
| AC7 | `proxy_ignore_headers Cache-Control` on the catalog route works without side effects | Test nginx behaviour; alternative: server sets `Cache-Control: public, max-age=0` |

---

## 14. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| CR1 | nginx `proxy_cache` does not cache content when Chrome's first request includes a `Range` header | Medium | High | Test in sprint 1; configure `proxy_cache_key` to ignore the `Range` header; or force a full-file pre-fetch to warm the cache |
| CR2 | ETag mismatch causes unnecessary proxy cache bypass after content update | Low | Low | Verify ETag format includes version; test with an actual content update |
| CR3 | 100 MB multipart upload times out under default Express/Multer config | Low | Medium | Set generous upload timeout (e.g., 10 min) on upload routes; test with a 100 MB file |
| CR4 | MIME type validation bypass (rename `.exe` to `.mp4`) | Medium | Medium | Use magic-byte check (`file-type` library) in addition to MIME header |
| CR5 | Catalog JSON grows unexpectedly large as content count increases | Low (MVP) | Low | `?since` param accepted from day one; add pagination as needed |
| CR6 | Deleting an interest leaves stale `selectedInterestIds` in edge DeviceProfile | Medium | Low | Edge SPA filters selected interests against catalog on every sync |

---

## 15. Open Questions / Pending Decisions

| # | Question | Affects | Recommended default | Deadline |
|---|---------|---------|-------------------|----------|
| APC1 | JWT (stateless) vs. opaque token (requires server-side store)? | Auth, logout behaviour | JWT — document assumes this | Before implementation |
| APC2 | Should `GET /api/content/:id/file` be served by Node.js streaming or nginx `X-Accel-Redirect`? | Performance | Node.js in MVP; switch to nginx if load is a problem | Sprint 2 after load test |
| APC3 | Should `DELETE /api/admin/categories/:id` cascade-delete children, or reject if children exist? | Admin UX | Cascade delete — document assumes this | Before implementation |
| APC4 | `multipart/form-data` vs. chunked upload (`tus` protocol) for file upload? | Upload reliability | `multipart/form-data` — admin has stable network | Before implementation |
| APC5 | Server sets `Cache-Control: no-store` or `Cache-Control: public, max-age=0` on `/api/catalog`? | nginx config | `no-store` + `proxy_ignore_headers` on proxy; test and adjust | Sprint 1 |

---

## 16. De-scope Levers

| Priority | Simplification | Endpoints removed | Effect |
|----------|---------------|------------------|--------|
| 1st | Drop thumbnail support entirely | `PUT /api/admin/content/:id/thumbnail`, `GET /api/content/:id/thumbnail` | Type-based placeholders only; saves ~2 days |
| 2nd | Drop file replacement | `PUT /api/admin/content/:id/file` | Admin must delete + re-upload to replace content; "updated" badge still works via `updatedAt` |
| 3rd | Read-only categories (seed data) | `POST /PUT /DELETE /api/admin/categories` | Categories from DB migration; no admin CRUD; saves ~2–3 days |
| 4th | Read-only interests (seed data) | `POST /PUT /DELETE /api/admin/interests` | Interests from DB migration; no admin CRUD; saves ~1–2 days |
| 5th | Drop admin content list | `GET /api/admin/content` | Admin has no list view; relies on upload/delete only |

---

## 17. Continuation Notes

- **Delta sync:** Add server support for `GET /api/catalog?since={ISO_timestamp}` returning only items where `updatedAt > since`, plus a `deleted: string[]` array of hard-deleted IDs. Edge SPA merges changes into IndexedDB rather than replacing the full snapshot.
- **Pagination:** Add `?page={n}&limit={n}` to `GET /api/admin/content` when catalog grows beyond ~50 items.
- **Chunked upload:** Replace `multipart/form-data` with the `tus` resumable upload protocol at the same endpoint URL. Swap the server-side handler without changing the client API contract.
- **Presigned upload URLs:** When switching to S3 storage, add `POST /api/admin/content/presign` returning a presigned S3 URL. Client uploads directly to S3; server stores only metadata. Catalog and content endpoints remain unchanged.
- **Server-side search:** Add `GET /api/catalog/search?q={term}` for full-text search via PostgreSQL `tsvector`. MVP does client-side filtering on the cached catalog.
- **Action sync:** Add `POST /api/actions` for batch-uploading `LocalAction` records from the edge. Request body: `{ deviceId: string; actions: LocalAction[] }`.
- **Push sync:** Add `GET /api/sync/stream` (Server-Sent Events) so the server can push catalog update notifications. Edge proxy passes SSE through without caching.
- **Admin user management:** Replace shared password with per-user auth. Add `POST /api/admin/users` CRUD and a `role` field on the login response. Add RBAC middleware to admin routes.
- **Token refresh:** Add `POST /api/admin/token/refresh` accepting the current token and returning a new one with a refreshed expiry.

---

*This document is the sixth in the TactiTok document set. Proceed to `product/07_delivery-plan.md`.*
