# Data Model — TactiTok

> **Version:** 0.2
> **Status:** Draft
> **Last updated:** 2026-03-07
> **Preceding document:** `product/04_system-architecture.md`
> **Next document:** `product/06_api-contract.md`
> **Change log:** v0.2 — aligned with Architecture v0.2 (edge proxy topology): removed Cache API / Service Worker references; simplified DownloadRecord; content caching is now handled by edge proxy.

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
| DG2 | **Shared types** | Server and client share TypeScript types from `packages/shared` |
| DG3 | **Continuation-ready** | Fields for future features (user-id, view-count) included but nullable/unused in MVP |
| DG4 | **Clean separation** | Server-side persistence (PostgreSQL) vs. edge proxy cache (nginx) vs. browser-local state (IndexedDB) clearly delineated |
| DG5 | **Migration-based schema** | Every change is a versioned migration; no ad-hoc ALTER TABLE |

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
| **Junction table** | A many-to-many relationship table (e.g., content ↔ interest) |

---

## 4. Modeling Principles

1. **One file per content item** — a content item has exactly one binary file (MP4 or PDF). No multi-file items in MVP.
2. **Interests and categories are independent** — a content item can have any combination of interests and categories. They are not hierarchically linked.
3. **Server is authoritative** — all catalog data lives in PostgreSQL. The edge caches a snapshot in IndexedDB.
4. **No user identity** — there is no `User` table. Edge state is device-scoped (IndexedDB), admin auth is a single shared password (no user record).
5. **Version counter, not version history** — updating content increments a counter and overwrites the file. No old versions are retained.
6. **Thumbnails are optional** — admin may upload a thumbnail image; if omitted, UI shows a type-based placeholder.
7. **Soft delete not required** — MVP uses hard delete. Content deletion removes the record and file.
8. **UUIDs for primary keys** — enables future multi-source sync and avoids sequential-id leakage.

---

## 5. Entity Overview

### 5.1 Entity Relationship Diagram (Text)

```
┌──────────────────────────────────────────────────────────────┐
│                    SERVER (PostgreSQL)                        │
│                                                              │
│  ┌──────────────┐       ┌───────────────────┐                │
│  │   Category   │       │   ContentItem     │                │
│  │              │       │                   │                │
│  │  id (PK)     │       │  id (PK)          │                │
│  │  name        │       │  title            │                │
│  │  parentId(FK)│       │  description      │                │
│  │  sortOrder   │       │  type (video|pdf) │                │
│  └──────┬───────┘       │  filename         │                │
│         │               │  fileSize         │                │
│         │ 1:N           │  mimeType         │                │
│         ▼               │  duration         │                │
│  ┌──────────────┐       │  thumbnailPath    │                │
│  │   Category   │       │  version          │                │
│  │   (child)    │       │  createdAt        │                │
│  └──────────────┘       │  updatedAt        │                │
│                         └─────┬──────┬──────┘                │
│                               │      │                       │
│              ┌────────────────┘      └────────────────┐      │
│              │ M:N                              M:N   │      │
│              ▼                                        ▼      │
│  ┌───────────────────┐                  ┌──────────────────┐ │
│  │ ContentCategory   │                  │ ContentInterest  │ │
│  │ (junction)        │                  │ (junction)       │ │
│  │                   │                  │                  │ │
│  │ contentId (FK)    │                  │ contentId (FK)   │ │
│  │ categoryId (FK)   │                  │ interestId (FK)  │ │
│  └───────────────────┘                  └──────────────────┘ │
│                                                ▲             │
│                                                │ M:N         │
│                                         ┌──────┴───────┐    │
│                                         │   Interest    │    │
│                                         │              │    │
│                                         │  id (PK)     │    │
│                                         │  name        │    │
│                                         │  createdAt   │    │
│                                         └──────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                 EDGE BROWSER (IndexedDB)                      │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │  DeviceProfile   │  │  CachedCatalog   │                  │
│  │                  │  │                  │                  │
│  │  deviceId        │  │  (mirror of      │                  │
│  │  interests[]     │  │   server catalog  │                  │
│  │  createdAt       │  │   as JSON)       │                  │
│  │  updatedAt       │  │  lastSyncedAt    │                  │
│  └──────────────────┘  └──────────────────┘                  │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │  DownloadRecord  │  │  LocalAction     │                  │
│  │  (metadata only; │  │                  │                  │
│  │   file in proxy) │  │  contentId       │                  │
│  │                  │  │  action (like|   │                  │
│  │  contentId       │  │    save)         │                  │
│  │  title           │  │  timestamp       │                  │
│  │  type            │  │  active (bool)   │                  │
│  │  fileSize        │  │                  │                  │
│  │  downloadedAt    │  │                  │                  │
│  │  version         │  │                  │                  │
│  └──────────────────┘  └──────────────────┘                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Entity Count

| Location | Entity | Count |
|----------|--------|-------|
| Server (PostgreSQL) | ContentItem, Category, Interest, ContentCategory, ContentInterest | 5 |
| Edge (IndexedDB) | DeviceProfile, CachedCatalog, DownloadRecord, LocalAction | 4 |
| **Total** | | **9** |

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
| `createdAt` | TIMESTAMP | NOT NULL, auto | First upload time |
| `updatedAt` | TIMESTAMP | NOT NULL, auto | Last modification time; used for sync and "updated" badge |

**Indexes:**
- `idx_content_type` on `type` (filter videos for reels feed)
- `idx_content_updated` on `updatedAt` (sync ordering)
- Full-text: `idx_content_search` on `title, description` (PostgreSQL `tsvector` or `ILIKE`)

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
- Deleting a category with children: cascade delete children, unlink content (remove junction rows)

**Indexes:**
- `idx_category_parent` on `parentId`
- `idx_category_sort` on `parentId, sortOrder`

---

### 6.3 Interest (Server)

A flat tag used to filter the reels feed and library. Admin-managed.

| Field | Type | Constraints | Notes |
|-------|------|------------|-------|
| `id` | UUID | PK, auto-generated | |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Display name; used in device profile |
| `createdAt` | TIMESTAMP | NOT NULL, auto | |

**Notes:**
- No hierarchy — flat list
- Deleting an interest: remove junction rows (ContentInterest); edge device profiles updated on next sync

---

### 6.4 ContentCategory (Server — Junction)

Many-to-many: content items belong to categories.

| Field | Type | Constraints | Notes |
|-------|------|------------|-------|
| `contentId` | UUID | FK → ContentItem.id, ON DELETE CASCADE | |
| `categoryId` | UUID | FK → Category.id, ON DELETE CASCADE | |

**PK:** Composite `(contentId, categoryId)`

---

### 6.5 ContentInterest (Server — Junction)

Many-to-many: content items are tagged with interests.

| Field | Type | Constraints | Notes |
|-------|------|------------|-------|
| `contentId` | UUID | FK → ContentItem.id, ON DELETE CASCADE | |
| `interestId` | UUID | FK → Interest.id, ON DELETE CASCADE | |

**PK:** Composite `(contentId, interestId)`

---

### 6.6 DeviceProfile (Edge — IndexedDB)

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

### 6.7 CachedCatalog (Edge — IndexedDB)

A snapshot of the server catalog, stored locally for offline browsing.

| Field | Type | Notes |
|-------|------|-------|
| `items` | ContentItemDTO[] | Full list of content metadata (no binary files) |
| `categories` | CategoryDTO[] | Full category tree |
| `interests` | InterestDTO[] | Full interest list |
| `lastSyncedAt` | ISO timestamp | When this snapshot was pulled from server |

**Storage:** Single record in an IndexedDB object store (`catalogCache`). Replaced entirely on each sync.

**DTO shapes** (shared TypeScript types in `packages/shared`):

```typescript
interface ContentItemDTO {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'pdf';
  filename: string;
  fileSize: number;
  mimeType: string;
  duration: number | null;
  thumbnailUrl: string | null;
  version: number;
  categoryIds: string[];
  interestIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface CategoryDTO {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
}

interface InterestDTO {
  id: string;
  name: string;
}
```

---

### 6.8 DownloadRecord (Edge — IndexedDB)

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

**What changed (v0.2):** Removed `cacheKey` and `mimeType` fields. The file is no longer stored in Chrome's Cache API — it is cached by the edge proxy. The DownloadRecord is now a pure metadata record used by the Downloads tab UI. When the user plays a downloaded item, the SPA requests the file from the edge proxy (localhost), which serves it from its cache.

**Delete behavior:** Removing a download record removes only the IndexedDB metadata. The proxy cache may still hold the file (managed by nginx cache eviction, not by the SPA).

---

### 6.9 LocalAction (Edge — IndexedDB)

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
| ContentItem ↔ Category | M:N via ContentCategory | A content item can belong to multiple categories; a category can contain many items |
| ContentItem ↔ Interest | M:N via ContentInterest | A content item can be tagged with multiple interests; an interest can tag many items |
| Category → Category (self) | 1:N via parentId | Top-level categories have children; max 2 levels |
| DeviceProfile → Interest | Local reference | `selectedInterestIds` references Interest UUIDs from CachedCatalog |
| DownloadRecord → ContentItem | Local reference | `contentId` references ContentItem.id from CachedCatalog |
| LocalAction → ContentItem | Local reference | `contentId` references ContentItem.id from CachedCatalog |

**Note:** Cross-boundary references (edge → server) are by UUID, not by foreign key. Integrity is maintained by the sync process: if a server-side content item is deleted, the next catalog sync removes it from CachedCatalog; the edge client should clean up orphaned DownloadRecords and LocalActions.

---

## 8. Key Attributes Summary

### 8.1 Server-Side (PostgreSQL)

| Entity | Key fields for MVP | Key fields for continuation |
|--------|-------------------|---------------------------|
| ContentItem | id, title, description, type, filePath, fileSize, mimeType, version, updatedAt | duration, thumbnailPath (future: viewCount, likeCount, userId) |
| Category | id, name, parentId, sortOrder | (future: description, iconUrl) |
| Interest | id, name | (future: description, sortOrder) |

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
| **Deleted** | Metadata record deleted; file deleted from filesystem; junction rows cascade-deleted |

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

**What changed (v0.2):** The download lifecycle no longer involves Chrome's Cache API. The file is cached by the edge proxy transparently. The SPA only manages the metadata record in IndexedDB.

### 9.3 "Updated" Badge Logic

The edge client compares `DownloadRecord.version` with `CachedCatalog.items[].version`. If the catalog version is higher, the item shows an "updated" badge. This also applies to items in the library (comparing `CachedCatalog` current version with the version the user last saw — but for MVP simplicity, badge shows only on downloaded items where the version mismatch is clear).

---

## 10. Server-Side Persistence

### 10.1 PostgreSQL Schema Overview

| Table | Row count (demo) | Growth pattern |
|-------|-----------------|---------------|
| `content_items` | 15 | Grows with uploads; ~10s–100s in production |
| `categories` | ~8–12 | Slow growth; admin-managed |
| `interests` | ~5–8 | Slow growth; admin-managed |
| `content_categories` | ~20–30 | Proportional to content × categories |
| `content_interests` | ~20–30 | Proportional to content × interests |

### 10.2 Naming Convention

- Table names: `snake_case`, plural (`content_items`, `categories`)
- Column names: `snake_case` (`file_size`, `parent_id`, `created_at`)
- TypeScript types: `PascalCase` (`ContentItem`, `Category`)
- Prisma/ORM maps between conventions automatically

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
| Content files (video/PDF) | URL-based: `/api/content/{id}/file` | 1–100 MB per file | 30 days inactive |
| Thumbnails | URL-based: `/api/content/{id}/thumbnail` | 10–200 KB per image | 30 days inactive |
| Catalog metadata | URL-based: `/api/catalog` | <10 KB | 5 minutes validity |
| SPA static files | N/A — served directly from Docker image | ~5–10 MB total | Never (part of image) |

**What changed (v0.2):** Chrome's Cache API and Service Worker cache are no longer used. All content caching is handled by the edge proxy's `proxy_cache` on the Linux VM filesystem. The SPA static files are bundled into the Docker image and served by nginx directly.

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
| Category max depth = 2 | Application logic | `parentId` must reference a row where `parentId IS NULL` |
| Category.name unique within siblings | Application logic + UNIQUE(parentId, name) | |
| Interest.name globally unique | UNIQUE constraint (database) | |
| ContentCategory: no duplicate pairs | Composite PK (database) | |
| ContentInterest: no duplicate pairs | Composite PK (database) | |
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
| Get full catalog (all items + categories + interests) | Metadata sync (edge) | JOIN content_items with content_categories, content_interests; include all categories and interests |
| Search content by title/description | Library search (edge) | PostgreSQL `ILIKE '%term%'` on title + description; upgrade to `tsvector` if needed |
| Filter content by type='video' | Reels feed (edge) | WHERE clause on `type` |
| Filter content by interest IDs | Feed filtering (edge) | JOIN content_interests WHERE interest_id IN (...) |
| Filter content by category ID | Library browsing (edge) | JOIN content_categories WHERE category_id = ... |
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

- **Server:** With ~15 items, all queries are trivially fast. No pagination needed for MVP. Add `LIMIT/OFFSET` to catalog API for future growth.
- **Edge:** CachedCatalog is a single JSON object; all filtering (by interest, category, search) happens in-memory in JavaScript. This is fine for ~15 items. For 100+ items, consider IndexedDB indexes.

---

## 14. Alternatives Considered or Intentionally Deferred

| Alternative | Why deferred |
|------------|-------------|
| **Separate ContentAsset entity** (one-to-many: item has multiple files) | MVP is one file per item; if multi-quality or multi-format needed, add ContentAsset table later |
| **User table** | No user identity in MVP; device profile is local-only |
| **Content version history** (keep old files) | MVP overwrites; version counter is sufficient; add `content_versions` table later if rollback needed |
| **Tag entity** (separate from Interest) | Interests serve as the only tagging mechanism; if more granular tags are needed, add a separate Tag table |
| **PublishState / Draft** | MVP publishes immediately on upload; add `status` ENUM to content_items if draft/review workflow is needed |
| **AnalyticsEvent table** | No server-side analytics in MVP; add event log table when user identity exists |
| **Full-text search index** (tsvector) | `ILIKE` is sufficient for ~15 items; upgrade to tsvector for 100+ items |
| **Soft delete** (isDeleted flag) | Hard delete in MVP; add soft delete if audit trail is needed |
| **Content expiry / TTL** | No auto-expiry; add `expiresAt` to content_items if content lifecycle management is needed |

---

## 15. Assumptions

| # | Assumption | Impact if wrong |
|---|-----------|----------------|
| DA1 | UUIDs are acceptable as primary keys (no need for sequential IDs) | Minor: some query patterns are slower with UUIDs; but dataset is tiny |
| DA2 | A single CachedCatalog JSON blob is efficient for ~15 items | Need IndexedDB indexes or pagination if catalog grows to 100+ |
| DA3 | Hard delete is acceptable for MVP (no recoverability needed) | Data loss on accidental delete; admin must re-upload |
| DA4 | Interests and categories are independent (no mapping between them) | If users expect interests to match categories, UX may be confusing |
| DA5 | Thumbnail upload is optional; placeholder is acceptable | Demo may look less polished without thumbnails |
| DA6 | No need for a `status` field on content items (all are published immediately) | If approval workflow is needed, must add status ENUM |

---

## 16. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| DR1 | Orphaned download records if server deletes content between syncs | Medium | Low | Edge client cleanup: on sync, remove DownloadRecords/LocalActions where contentId not in catalog |
| DR2 | CachedCatalog grows large if content count increases significantly | Low (MVP) | Medium | Design API to support pagination; switch to per-item IndexedDB records if needed |
| DR3 | Interest/category relationship confusion — users expect them to be linked | Medium | Medium | Clear admin UI guidance; document the distinction; consider linking post-MVP |
| DR4 | Thumbnail management adds upload complexity | Low | Low | Make thumbnail optional; admin can skip; UI shows type-based placeholder |
| DR5 | UUID generation collision | Negligible | High | Use crypto.randomUUID() — collision probability is effectively zero |

---

## 17. Open Questions / Pending Decisions

| # | Question | Affects | Recommended default | Deadline |
|---|---------|---------|-------------------|----------|
| DQ1 | Should the "updated" badge appear on all items in library, or only on downloaded items? | Edge UX, logic complexity | All items: compare `CachedCatalog` version with a "last seen version" in LocalAction; simpler: only on downloads | Before UI implementation |
| DQ2 | Should thumbnails be stored in the same `./data/content/` directory or separate `./data/thumbnails/`? | File organization | Separate `./data/thumbnails/` for clarity | Before implementation |
| DQ3 | Should the admin be able to assign a content item to zero categories? | Data integrity | Allow zero (uncategorized); show in library under "All" or "Uncategorized" | Before implementation |

---

## 18. De-scope Levers

| Priority | Simplification | Effect |
|----------|---------------|--------|
| 1st | Drop thumbnails entirely (use type-based placeholders only) | Removes thumbnail upload, storage, and serving; saves ~2 days |
| 2nd | Drop LocalAction (Like/Save) entity | Remove Like/Save buttons from UI; users rely on downloads only |
| 3rd | Make interests a fixed seed list (no admin CRUD) | Remove InterestService admin API; interests are database seeds |
| 4th | Drop ContentCategory junction (content belongs to zero or one category via direct FK) | Simplifies to 1:N; loses multi-category assignment |
| 5th | Drop CachedCatalog (require network for all browsing) | Removes IndexedDB catalog mirror; library/reels only work online |

---

## 19. Continuation Notes

- **User entity:** When auth is added, create a `users` table with `id (UUID)`, `email`, `passwordHash`, `role`. Link to content via `createdBy` FK on `content_items`. Replace `deviceId` in DeviceProfile with `userId`.
- **View/like counts (server):** Add `viewCount` and `likeCount` columns to `content_items`. Populate via batch sync from LocalAction records. Use for future recommendation engine.
- **Content versions table:** Add `content_versions` (id, contentId, version, filePath, createdAt) to keep old file references. Content update inserts a new version row instead of overwriting.
- **Analytics events:** Add `analytics_events` (id, deviceId/userId, contentId, eventType, timestamp) for tracking views, downloads, likes at the server level.
- **Soft delete:** Add `deletedAt` TIMESTAMP NULLABLE to `content_items` and `categories`. Filter `WHERE deletedAt IS NULL` in all queries. Add admin "trash" view.
- **Delta sync:** Add `syncVersion` (monotonic counter) to a `sync_state` table. Each mutation increments the counter. Edge sends last known version; server returns only changes since then.
- **Multi-tenancy:** Add `tenantId` UUID to `content_items`, `categories`, `interests`. MVP sets to a constant. Future: partition all queries by tenant.
- **Full-text search:** Create a PostgreSQL `tsvector` column on `content_items` with a GIN index. Update on insert/update via trigger. Replace `ILIKE` queries.

---

*This document is the fifth in the TactiTok document set. Proceed to `product/06_api-contract.md`.*
