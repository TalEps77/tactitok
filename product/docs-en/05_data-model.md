# Data Model — TactiTok

> **Version:** 0.4
> **Status:** Draft
> **Last updated:** 2026-04-23
> **Preceding document:** `product/04_system-architecture.md`
> **Next document:** `product/06_api-contract.md`
> **Change log:** v0.2 — aligned with Architecture v0.2 (edge proxy topology): removed Cache API / Service Worker references; simplified DownloadRecord; content caching is now handled by edge proxy. v0.3 (2026-03-25): ORM changed from Prisma to SQLAlchemy. Migration tooling changed from Prisma migrate to Alembic. Any TypeScript type examples replaced with Python/Pydantic equivalents. v0.4 (2026-04-23): simplified the server schema to 3 tables. `content_items` now stores a single `categoryId` and a multi-value `interestIds` UUID array; separate assignment tables were removed.

---

## 1. Purpose of This Document

This document defines the minimum MVP data model. It answers:

- What the core domain entities are
- What metadata is required for content items
- How categories, interests, and content relate
- What state is stored server-side vs. browser-local
- What integrity constraints matter for MVP
- What parts of the model are intentionally deferred

Every downstream document (API Contract → Delivery Plan) must be consistent with this model.

---

## 2. Data Model Goals

| # | Goal | Rationale |
|---|------|-----------|
| DG1 | **Minimal entity count** | 3 developers, 10 weeks; every table must earn its place |
| DG2 | **Shared wire shapes** | Server responses and browser-local cache use the same catalog DTO shape |
| DG3 | **Continuation-ready** | Fields for future features (user-id, view-count) stay addable without rewriting the core model |
| DG4 | **Clean separation** | Server-side persistence (PostgreSQL) vs. edge proxy cache (nginx) vs. browser-local state (IndexedDB) clearly delineated |
| DG5 | **Migration-based schema** | Every change is a versioned Alembic migration; no ad-hoc ALTER TABLE |

---

## 3. Definitions / Terms

| Term | Definition |
|------|-----------|
| **Server entity** | A record persisted in PostgreSQL on the cloud VM |
| **Local entity** | A record persisted in IndexedDB on the edge device browser |
| **Content item** | A single piece of training content (video or PDF) with metadata |
| **Content file** | The binary asset (MP4 or PDF file) stored on the server filesystem |
| **Category** | A node in a 2-level hierarchy for organizing content in the library |
| **Interest** | A flat tag used to filter the reels feed and library; admin-managed |
| **Device profile** | Local-only configuration (selected interests); no server identity |
| **Download record** | Local-only metadata record tracking a content file the user explicitly downloaded (file itself is cached by the edge proxy) |
| **Array column** | A PostgreSQL column that stores multiple values in one field, used here for `content_items.interest_ids` |

---

## 4. Modeling Principles

1. **One file per content item** — a content item has exactly one binary file (MP4 or PDF). No multi-file items in MVP.
2. **One optional category per content item** — a content item may belong to zero or one category. This keeps library placement simple.
3. **Multiple interests per content item** — a content item can have zero or many interests, stored as a PostgreSQL `UUID[]` array on the content row itself.
4. **Interests and categories are independent** — a content item can be in any category and have any set of interests. They are not hierarchically linked.
5. **Server is authoritative** — all catalog data lives in PostgreSQL. The edge caches a snapshot in IndexedDB.
6. **No user identity** — there is no `User` table. Edge state is device-scoped (IndexedDB), admin auth is a single shared password (no user record).
7. **Version counter, not version history** — updating content increments a counter and overwrites the file. No old versions are retained.
8. **Thumbnails are optional** — admin may upload a thumbnail image; if omitted, UI shows a type-based placeholder.
9. **Soft delete not required** — MVP uses hard delete. Content deletion removes the record and file.
10. **UUIDs for primary keys** — enables future multi-source sync and avoids sequential-id leakage.

---

## 5. Entity Overview

### 5.1 Entity Relationship Diagram (Text)

```
┌──────────────────────────────────────────────────────────────┐
│                    SERVER (PostgreSQL)                      │
│                                                              │
│  ┌──────────────┐       ┌─────────────────────────────────┐  │
│  │   Category   │       │          ContentItem            │  │
│  │              │       │                                 │  │
│  │  id (PK)     │◄──────┤  categoryId (FK, nullable)      │  │
│  │  name        │ 1:N   │  interestIds (UUID[])           │  │
│  │  parentId(FK)│       │  title                          │  │
│  │  sortOrder   │       │  description                    │  │
│  └──────┬───────┘       │  type (video|pdf)               │  │
│         │               │  filename                       │  │
│         │ 1:N           │  fileSize                       │  │
│         ▼               │  mimeType                       │  │
│  ┌──────────────┐       │  duration                       │  │
│  │   Category   │       │  thumbnailPath                  │  │
│  │   (child)    │       │  version                        │  │
│  └──────────────┘       │  createdAt                      │  │
│                         │  updatedAt                      │  │
│                         └─────────────────────────────────┘  │
│                                      │                       │
│                                      │ logical M:N           │
│                                      ▼ via UUID[]            │
│                               ┌──────────────┐               │
│                               │   Interest   │               │
│                               │              │               │
│                               │  id (PK)     │               │
│                               │  name        │               │
│                               │  createdAt   │               │
│                               └──────────────┘               │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                 EDGE BROWSER (IndexedDB)                    │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │  DeviceProfile   │  │  CachedCatalog   │                  │
│  │                  │  │                  │                  │
│  │  deviceId        │  │  items[]         │                  │
│  │  selectedInterest│  │  categories[]    │                  │
│  │  Ids[]           │  │  interests[]     │                  │
│  │  createdAt       │  │  lastSyncedAt    │                  │
│  │  updatedAt       │  │                  │                  │
│  └──────────────────┘  └──────────────────┘                  │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │  DownloadRecord  │  │  LocalAction     │                  │
│  │                  │  │                  │                  │
│  │  contentId       │  │  contentId       │                  │
│  │  title           │  │  action          │                  │
│  │  type            │  │  timestamp       │                  │
│  │  fileSize        │  │  active          │                  │
│  │  downloadedAt    │  │                  │                  │
│  │  version         │  │                  │                  │
│  └──────────────────┘  └──────────────────┘                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Entity Count

| Location | Entity | Count |
|----------|--------|-------|
| Server (PostgreSQL) | ContentItem, Category, Interest | 3 |
| Edge (IndexedDB) | DeviceProfile, CachedCatalog, DownloadRecord, LocalAction | 4 |
| **Total** | | **7** |

---

## 6. Core Entities

### 6.1 ContentItem (Server)

The central entity representing a piece of training content.

| Field | Type | Constraints | Notes |
|-------|------|------------|-------|
| `id` | UUID | PK, auto-generated | Stable identifier across sync |
| `title` | VARCHAR(255) | NOT NULL | Displayed in feed, library, downloads |
| `description` | TEXT | NOT NULL, default '' | Searchable; shown in overlay/detail |
| `type` | ENUM('video','pdf') | NOT NULL | Determines viewer and feed eligibility |
| `filename` | VARCHAR(255) | NOT NULL | Original upload filename (for display) |
| `filePath` | VARCHAR(500) | NOT NULL | Server-side path: `./data/content/{id}.{ext}` |
| `fileSize` | BIGINT | NOT NULL | Bytes; used in download UI and future quota |
| `mimeType` | VARCHAR(100) | NOT NULL | `video/mp4` or `application/pdf` |
| `duration` | INTEGER | NULLABLE | Seconds; video only; NULL for PDF |
| `thumbnailPath` | VARCHAR(500) | NULLABLE | Optional admin-uploaded thumbnail; NULL = placeholder |
| `version` | INTEGER | NOT NULL, default 1 | Incremented on content update; drives "updated" badge |
| `categoryId` | UUID | NULLABLE, FK → Category.id, ON DELETE SET NULL | Single library category; `NULL` = uncategorized |
| `interestIds` | UUID[] | NOT NULL, default `{}` | Zero or more interest UUIDs; validated by service layer |
| `createdAt` | TIMESTAMP | NOT NULL, auto | First upload time |
| `updatedAt` | TIMESTAMP | NOT NULL, auto | Last modification time; used for sync and "updated" badge |

**Indexes:**
- `idx_content_type` on `type` (filter videos for reels feed)
- `idx_content_updated` on `updatedAt` (sync ordering)
- `idx_content_category` on `categoryId` (library filtering)
- `idx_content_interest_ids` as a PostgreSQL GIN index on `interestIds` (array overlap queries)
- Full-text: `idx_content_search` on `title, description` (PostgreSQL `tsvector` or `ILIKE`)

**Notes:**
- `interestIds` is deduplicated and normalized in application logic before save.
- Normalization rule for MVP: convert all UUIDs to canonical string form, remove duplicates, then sort ascending for stable equality checks.

---

### 6.2 Category (Server)

A node in a 2-level hierarchy for organizing library content.

| Field | Type | Constraints | Notes |
|-------|------|------------|-------|
| `id` | UUID | PK, auto-generated | |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE within siblings | Display name |
| `parentId` | UUID | NULLABLE, FK → Category.id | NULL = top-level; non-NULL = child |
| `sortOrder` | INTEGER | NOT NULL, default 0 | Controls display order within level |
| `createdAt` | TIMESTAMP | NOT NULL, auto | |
| `updatedAt` | TIMESTAMP | NOT NULL, auto | |

**Constraints:**
- Max depth enforced in application logic (not DB): `parentId` must reference a top-level category (where `parentId IS NULL`)
- Deleting a category with children: cascade delete children, set any matching `content_items.category_id` values to `NULL`

**Indexes:**
- `idx_category_parent` on `parentId`
- `idx_category_sort` on `parentId, sortOrder`

---

### 6.3 Interest (Server)

A flat tag used to filter the reels feed and library. Admin-managed.

| Field | Type | Constraints | Notes |
|-------|------|------------|-------|
| `id` | UUID | PK, auto-generated | |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Display name; used in device profile and content tagging |
| `createdAt` | TIMESTAMP | NOT NULL, auto | |

**Notes:**
- No hierarchy — flat list
- No direct DB relationship to `content_items`; links are stored in `content_items.interest_ids`
- Deleting an interest requires a service-layer cleanup step: remove the deleted UUID from all `content_items.interest_ids`, then delete the `interests` row

---

### 6.4 DeviceProfile (Edge — IndexedDB)

Local device configuration. One record per device.

| Field | Type | Notes |
|-------|------|-------|
| `deviceId` | string | Auto-generated UUID on first app open; stable across sessions |
| `selectedInterestIds` | string[] | Array of Interest UUIDs selected by user |
| `createdAt` | ISO timestamp | First-time setup |
| `updatedAt` | ISO timestamp | Last interest change |

**Storage:** Single record in an IndexedDB object store (`deviceProfile`).

**Continuation note:** `deviceId` can later be replaced by or linked to a `userId` when authentication is added.

---

### 6.5 CachedCatalog (Edge — IndexedDB)

A snapshot of the server catalog, stored locally for offline browsing.

| Field | Type | Notes |
|-------|------|-------|
| `items` | ContentItemDTO[] | Full list of content metadata (no binary files) |
| `categories` | CategoryDTO[] | Full category tree |
| `interests` | InterestDTO[] | Full interest list |
| `lastSyncedAt` | ISO timestamp | When this snapshot was pulled from server |

**Storage:** Single record in an IndexedDB object store (`catalogCache`). Replaced entirely on each sync.

**DTO shapes** (serialized to JSON for the edge client):

```python
from enum import Enum
from typing import Optional
from pydantic import BaseModel

class ContentType(str, Enum):
    video = "video"
    pdf = "pdf"

class ContentItemDTO(BaseModel):
    id: str
    title: str
    description: str
    type: ContentType
    filename: str
    fileSize: int
    mimeType: str
    duration: Optional[int] = None
    thumbnailUrl: Optional[str] = None
    version: int
    categoryId: Optional[str] = None
    interestIds: list[str]
    createdAt: str
    updatedAt: str

class CategoryDTO(BaseModel):
    id: str
    name: str
    parentId: Optional[str] = None
    sortOrder: int

class InterestDTO(BaseModel):
    id: str
    name: str
```

---

### 6.6 DownloadRecord (Edge — IndexedDB)

Metadata-only record tracking content items the user has explicitly downloaded for offline access. The actual file is cached by the edge proxy (nginx `proxy_cache`), not by Chrome.

| Field | Type | Notes |
|-------|------|-------|
| `contentId` | string | FK-like reference to ContentItem.id |
| `title` | string | Snapshot of title at download time (for offline display) |
| `type` | 'video' \| 'pdf' | Snapshot of type |
| `fileSize` | number | Bytes |
| `downloadedAt` | ISO timestamp | When the file was downloaded |
| `version` | number | Version at download time; compare with catalog for "updated" badge |

**Storage:** IndexedDB object store (`downloads`), keyed by `contentId`.

**Delete behavior:** Removing a download record removes only the IndexedDB metadata. The proxy cache may still hold the file (managed by nginx cache eviction, not by the SPA).

---

### 6.7 LocalAction (Edge — IndexedDB)

Tracks Like/Save actions locally. No server sync in MVP.

| Field | Type | Notes |
|-------|------|-------|
| `contentId` | string | FK-like reference to ContentItem.id |
| `action` | 'like' \| 'save' | Type of action |
| `active` | boolean | true = currently liked/saved; false = toggled off |
| `timestamp` | ISO timestamp | Last toggle time |

**Storage:** IndexedDB object store (`localActions`), keyed by composite `(contentId, action)`.

**Continuation note:** When user identity and analytics are added, these records can be batch-synced to the server using `deviceId` + `contentId` + `timestamp`.

---

## 7. Relationships

| Relationship | Type | Description |
|-------------|------|------------|
| Category → Category (self) | 1:N via `parentId` | Top-level categories have children; max 2 levels |
| Category → ContentItem | 1:N via `categoryId` | A category can contain many items; a content item belongs to zero or one category |
| ContentItem ↔ Interest | Logical M:N via `interestIds[]` | A content item can have many interests; an interest can appear on many content items |
| DeviceProfile → Interest | Local reference | `selectedInterestIds` references Interest UUIDs from CachedCatalog |
| DownloadRecord → ContentItem | Local reference | `contentId` references ContentItem.id from CachedCatalog |
| LocalAction → ContentItem | Local reference | `contentId` references ContentItem.id from CachedCatalog |

**Note:** Cross-boundary references (edge → server) are by UUID, not by foreign key. Integrity is maintained by the sync process: if a server-side content item is deleted, the next catalog sync removes it from CachedCatalog; the edge client should clean up orphaned DownloadRecords and LocalActions.

---

## 8. Key Attributes Summary

### 8.1 Server-Side (PostgreSQL)

| Entity | Key fields for MVP | Key fields for continuation |
|--------|-------------------|---------------------------|
| ContentItem | id, title, description, type, filePath, fileSize, mimeType, version, categoryId, interestIds, updatedAt | duration, thumbnailPath (future: viewCount, likeCount, userId) |
| Category | id, name, parentId, sortOrder | (future: description, iconUrl) |
| Interest | id, name | (future: description, sortOrder, color) |

### 8.2 Browser-Local (IndexedDB)

| Entity | Key fields for MVP | Key fields for continuation |
|--------|-------------------|---------------------------|
| DeviceProfile | deviceId, selectedInterestIds | (future: userId, displayName) |
| CachedCatalog | items[], categories[], interests[], lastSyncedAt | (future: syncVersion for delta sync) |
| DownloadRecord | contentId, title, type, fileSize, downloadedAt, version | (future: expiresAt for quota management) |
| LocalAction | contentId, action, active, timestamp | (future: synced flag, syncedAt) |

---

## 9. Lifecycle / Status Fields

### 9.1 Content Lifecycle

```
Upload (admin) → Created (version=1) → Updated (version++) → Deleted (hard delete)
```

| State | What happens |
|-------|-------------|
| **Created** | File stored; metadata record inserted; `version=1`; `createdAt` = `updatedAt` = now |
| **Updated** | File replaced; metadata updated; `version++`; `updatedAt` = now |
| **Deleted** | Metadata record deleted; file deleted from filesystem; category/interest assignments disappear with the row |

No draft/publish distinction in MVP — upload = published immediately.

### 9.2 Download Lifecycle (Edge)

```
Not Downloaded → Downloading (in-memory) → Downloaded (proxy cached) → Deleted (user action)
```

| State | Storage |
|-------|---------|
| **Not Downloaded** | No DownloadRecord; file may or may not be in proxy cache (transparent caching) |
| **Downloading** | In-memory progress; SPA fetches full file from proxy (triggering proxy to cache it) |
| **Downloaded** | DownloadRecord in IndexedDB (metadata only); file in edge proxy cache |
| **Deleted** | DownloadRecord removed from IndexedDB; proxy cache may still hold file (managed by nginx eviction) |

### 9.3 "Updated" Badge Logic

The edge client compares `DownloadRecord.version` with `CachedCatalog.items[].version`. If the catalog version is higher, the item shows an "updated" badge. For MVP, this badge is scoped to downloaded items only.

---

## 10. Server-Side Persistence

### 10.1 PostgreSQL Schema Overview

| Table | Row count (demo) | Growth pattern |
|-------|-----------------|---------------|
| `content_items` | 15 | Grows with uploads; ~10s–100s in production |
| `categories` | ~8–12 | Slow growth; admin-managed |
| `interests` | ~5–8 | Slow growth; admin-managed |

### 10.2 Naming Convention

- Table names: `snake_case`, plural (`content_items`, `categories`)
- Column names: `snake_case` (`file_size`, `parent_id`, `interest_ids`)
- Python model names: `PascalCase` (`ContentItem`, `Category`)
- JSON/API field names: `camelCase` (`fileSize`, `categoryId`, `interestIds`)

### 10.3 Binary Content Storage

Binary files (MP4, PDF, optional thumbnails) are **not** stored in PostgreSQL. They are stored on the server filesystem:

```
./data/
├── content/
│   ├── {uuid}.mp4
│   ├── {uuid}.pdf
│   └── ...
└── thumbnails/
    ├── {uuid}.jpg
    └── ...
```

The `filePath` and `thumbnailPath` fields in `content_items` reference these paths. The storage abstraction (`ContentFileService`) mediates all access.

---

## 11. Browser-Local Persistence

### 11.1 IndexedDB Stores

| Store name | Key | Value type | Records |
|-----------|-----|-----------|---------|
| `deviceProfile` | `'default'` (singleton) | DeviceProfile object | 1 |
| `catalogCache` | `'current'` (singleton) | CachedCatalog object | 1 |
| `downloads` | `contentId` | DownloadRecord object | 0–15+ |
| `localActions` | `[contentId, action]` | LocalAction object | 0–30+ |

### 11.2 Edge Proxy Cache (nginx `proxy_cache`)

Content files and API responses are cached by the edge proxy (nginx in Docker), not by Chrome.

| Cached content | Cache key (automatic) | Typical size | Eviction |
|---------------|----------------------|-------------|---------|
| Content files (video/PDF) | URL-based: `/api/content/{id}/file?v={version}` | 1–100 MB per file | 30 days inactive |
| Thumbnails | URL-based: `/api/content/{id}/thumbnail` | 10–200 KB per image | 30 days inactive |
| Catalog metadata | URL-based: `/api/catalog` | <10 KB | 5 minutes validity |
| SPA static files | N/A — served directly from Docker image | ~5–10 MB total | Never (part of image) |

### 11.3 Size Expectations

| Store | Typical size per entry | Total for 15 items |
|-------|----------------------|-------------------|
| IndexedDB (all stores) | <1 KB per record | <50 KB |
| Edge proxy cache (content files) | 1–100 MB per file | 15–1500 MB |
| Edge proxy cache (thumbnails) | 10–200 KB per image | <3 MB |
| SPA bundle (in Docker image) | ~5–10 MB total | ~5–10 MB |

---

## 12. Constraints and Invariants

### 12.1 Server-Side

| Constraint | Enforcement | Notes |
|-----------|-------------|-------|
| ContentItem.id is unique | PK (database) | UUID auto-generated |
| ContentItem.type ∈ {'video', 'pdf'} | ENUM (database) + validation (API) | |
| ContentItem.categoryId references valid category or NULL | FK (database) | `ON DELETE SET NULL` |
| ContentItem.interestIds contains only existing interest UUIDs | Application logic | No native FK across `UUID[]` |
| ContentItem.interestIds is deduplicated + normalized | Application logic | Sort ascending after dedupe |
| Category max depth = 2 | Application logic | `parentId` must reference a row where `parentId IS NULL` |
| Category.name unique within siblings | Application logic + UNIQUE(parentId, name) | |
| Interest.name globally unique | UNIQUE constraint (database) | |
| File upload: MP4 or PDF only | API validation | Check MIME type + extension |
| File upload: ≤100 MB | API validation | Configurable constant |
| Video duration: ≤3 min (180s) | API validation (if implemented) | Should priority; not hard blocker |

### 12.2 Browser-Local

| Constraint | Enforcement | Notes |
|-----------|-------------|-------|
| One DeviceProfile per device | Singleton key in IndexedDB | |
| One CachedCatalog snapshot | Singleton key in IndexedDB | Full replace on sync |
| DownloadRecord.contentId is unique | Keyed by contentId | Can't download same item twice |
| LocalAction unique per (contentId, action) | Composite key | Toggle on/off, not accumulate |

---

## 13. Query / Retrieval Considerations

### 13.1 Key Server Queries

| Query | Used by | Implementation |
|-------|---------|---------------|
| Get full catalog (all items + categories + interests) | Metadata sync (edge) | `SELECT` all `content_items`, `categories`, and `interests`; no junction joins needed |
| Search content by title/description | Library search (edge) | PostgreSQL `ILIKE '%term%'` on title + description; upgrade to `tsvector` if needed |
| Filter content by type='video' | Reels feed (edge) | WHERE clause on `type` |
| Filter content by interest IDs | Feed filtering (edge) | PostgreSQL array overlap: `interest_ids && ARRAY[...]::uuid[]` |
| Filter content by category ID | Library browsing (edge) | `WHERE category_id = ...` |
| Get uncategorized items | Library fallback/admin QA | `WHERE category_id IS NULL` |
| Get category tree | Library (edge) | SELECT all categories; build tree in application (small dataset) |
| Admin content list | Admin portal | SELECT with optional sort/filter; paginate if >50 items |

### 13.2 Key Edge Queries (IndexedDB)

| Query | Used by | Implementation |
|-------|---------|---------------|
| Get device interests | Feed filtering, interest screen | Read DeviceProfile singleton |
| Get cached catalog | Library, reels, search | Read CachedCatalog singleton; filter/sort in JS |
| Get all downloads | Downloads tab | Read all DownloadRecord entries |
| Check if content is downloaded | Download button state | Get DownloadRecord by contentId |
| Get like/save state for content | UI button state | Get LocalAction by (contentId, action) |

### 13.3 Performance Notes

- **Server:** With ~15 items, all queries are trivially fast. No pagination needed for MVP. Add `LIMIT/OFFSET` to admin endpoints if catalog grows.
- **Server interest filtering:** A GIN index on `interest_ids` keeps overlap queries fast enough for MVP and early growth.
- **Edge:** CachedCatalog is a single JSON object; all filtering (by interest, category, search) happens in-memory in JavaScript. This is fine for ~15 items. For 100+ items, consider IndexedDB indexes.

---

## 14. Alternatives Considered or Intentionally Deferred

| Alternative | Why deferred |
|------------|-------------|
| **Separate ContentAsset entity** (one-to-many: item has multiple files) | MVP is one file per item; if multi-quality or multi-format needed, add ContentAsset table later |
| **User table** | No user identity in MVP; device profile is local-only |
| **Content version history** (keep old files) | MVP overwrites; version counter is sufficient; add `content_versions` table later if rollback needed |
| **Junction tables for content-category and content-interest** | Deliberately removed for MVP simplicity; reintroduce only if assignment metadata or richer relationship semantics are needed |
| **JSONB for `interestIds`** | PostgreSQL `UUID[]` gives clearer intent and stronger type safety |
| **PublishState / Draft** | MVP publishes immediately on upload; add `status` ENUM to content_items if draft/review workflow is needed |
| **AnalyticsEvent table** | No server-side analytics in MVP; add event log table when user identity exists |
| **Full-text search index** (`tsvector`) | `ILIKE` is sufficient for ~15 items; upgrade to `tsvector` for 100+ items |
| **Soft delete** (`isDeleted` flag) | Hard delete in MVP; add soft delete if audit trail is needed |
| **Content expiry / TTL** | No auto-expiry; add `expiresAt` to content_items if content lifecycle management is needed |

---

## 15. Assumptions

| # | Assumption | Impact if wrong |
|---|-----------|----------------|
| DA1 | UUIDs are acceptable as primary keys (no need for sequential IDs) | Minor: some query patterns are slower with UUIDs; but dataset is tiny |
| DA2 | A single CachedCatalog JSON blob is efficient for ~15 items | Need IndexedDB indexes or pagination if catalog grows to 100+ |
| DA3 | Hard delete is acceptable for MVP (no recoverability needed) | Data loss on accidental delete; admin must re-upload |
| DA4 | Interests and categories are independent (no mapping between them) | If users expect interests to match categories, UX may be confusing |
| DA5 | One category per content item is sufficient for library organization in MVP | If multi-placement becomes necessary, reintroduce a junction table later |
| DA6 | PostgreSQL `UUID[]` is acceptable for interest assignment in MVP | If querying or integrity needs become more complex, reintroduce a junction table later |
| DA7 | Thumbnail upload is optional; placeholder is acceptable | Demo may look less polished without thumbnails |

---

## 16. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| DR1 | Orphaned download records if server deletes content between syncs | Medium | Low | Edge client cleanup: on sync, remove DownloadRecords/LocalActions where contentId not in catalog |
| DR2 | Deleting an interest requires application cleanup across `content_items.interest_ids` | Medium | Medium | Implement delete in one transaction: array cleanup first, then delete interest row |
| DR3 | Interest/category relationship confusion — users expect them to be linked | Medium | Medium | Clear admin UI guidance; document the distinction; consider linking post-MVP |
| DR4 | Array-based interest filtering becomes less transparent to developers than a fully normalized assignment model | Medium | Low | Document query patterns clearly; keep a focused service layer |
| DR5 | Thumbnail management adds upload complexity | Low | Low | Make thumbnail optional; admin can skip; UI shows type-based placeholder |
| DR6 | UUID generation collision | Negligible | High | Use crypto.randomUUID() / uuid4; collision probability is effectively zero |

---

## 17. Open Questions / Pending Decisions

| # | Question | Affects | Recommended default | Deadline |
|---|---------|---------|-------------------|----------|
| DQ1 | Should thumbnails be stored in the same `./data/content/` directory or separate `./data/thumbnails/`? | File organization | Separate `./data/thumbnails/` for clarity | Before implementation |
| DQ2 | Should the admin be able to assign a content item to zero categories? | Data integrity | Allow zero (uncategorized); show in library under "All" or "Uncategorized" | Before implementation |
| DQ3 | At what scale should the team reintroduce a normalized interest junction table? | Continuation architecture | Only if interest assignment needs per-link metadata, analytics, or significantly larger-scale querying | Post-MVP |

---

## 18. De-scope Levers

| Priority | Simplification | Effect |
|----------|---------------|--------|
| 1st | Drop thumbnails entirely (use type-based placeholders only) | Removes thumbnail upload, storage, and serving; saves ~2 days |
| 2nd | Drop LocalAction (Like/Save) entity | Remove Like/Save buttons from UI; users rely on downloads only |
| 3rd | Make interests a fixed seed list (no admin CRUD) | Remove InterestService admin API; interests come from database seed |
| 4th | Seed categories and drop category CRUD | Keep the single `categoryId` column but remove admin tree management |
| 5th | Drop CachedCatalog (require network for all browsing) | Removes IndexedDB catalog mirror; library/reels only work online |

---

## 19. Continuation Notes

- **v0.4 (2026-04-23):** Server schema simplified to 3 PostgreSQL tables. `categoryId` is now singular; `interestIds` is a `UUID[]` array on `content_items`.
- **User entity:** When auth is added, create a `users` table with `id (UUID)`, `email`, `passwordHash`, `role`. Link to content via `createdBy` FK on `content_items`. Replace `deviceId` in DeviceProfile with `userId`.
- **View/like counts (server):** Add `viewCount` and `likeCount` columns to `content_items`. Populate via batch sync from LocalAction records. Use for future recommendation engine.
- **Content versions table:** Add `content_versions` (id, contentId, version, filePath, createdAt) to keep old file references. Content update inserts a new version row instead of overwriting.
- **Analytics events:** Add `analytics_events` (id, deviceId/userId, contentId, eventType, timestamp) for tracking views, downloads, likes at the server level.
- **Soft delete:** Add `deletedAt` TIMESTAMP NULLABLE to `content_items` and `categories`. Filter `WHERE deletedAt IS NULL` in all queries. Add admin "trash" view.
- **Delta sync:** Add `syncVersion` (monotonic counter) to a `sync_state` table. Each mutation increments the counter. Edge sends last known version; server returns only changes since then.
- **Normalized interests (future):** If interest assignments need richer metadata, replace `content_items.interest_ids` with a dedicated normalized assignment table and migrate existing arrays into rows.
- **Multi-tenancy:** Add `tenantId` UUID to `content_items`, `categories`, `interests`. MVP sets to a constant. Future: partition all queries by tenant.
- **Full-text search:** Create a PostgreSQL `tsvector` column on `content_items` with a GIN index. Update on insert/update via trigger. Replace `ILIKE` queries.

---

*This document is the fifth in the TactiTok document set. Proceed to `product/06_api-contract.md`.*
