# DB Implementation PRD — TactiTok

> **Version:** 1.1
> **Status:** Draft
> **Date:** 2026-04-23
> **Source spec:** `product/docs-en/05_data-model.md`
> **Parallel docs:** `product/docs-en/04_system-architecture.md`, `product/docs-en/06_api-contract.md`
> **Audience:** Dev A (backend primary), Dev B + Dev C (reference)

---

## 1. Purpose & Audience

This is the dev-facing build handoff for the TactiTok database layer. It translates `05_data-model.md` (the *what*) into concrete implementation (the *how*).

After reading, Dev A should be able to:
- Create the SQLAlchemy model files under `server/app/models/`
- Wire Alembic and run `alembic upgrade head` on a fresh PostgreSQL instance to produce the correct schema
- Seed the database with demo categories and interests
- Write repository queries that serve every endpoint in `06_api-contract.md`
- Implement the service-layer cleanup required by the denormalized `interest_ids` array

This PRD does **not** redefine entities or columns — those are authoritative in `05_data-model.md`. Conflicts defer to that document.

---

## 2. Source of Truth

| Document | Governs |
|----------|---------|
| `product/docs-en/05_data-model.md` | Entities, columns, indexes, relationships, invariants (binding) |
| `product/docs-en/06_api-contract.md` | Queries and response shapes the schema must serve |
| `product/docs-en/04_system-architecture.md` | Stack, repo layout, env configuration |

Key decisions in force:
- **D26** — PostgreSQL (not SQLite)
- **D38** — UUIDs for all primary keys
- **D39** — Hard delete only (no `deleted_at`)
- **D40** — One binary file per content item
- **D64** — Python + FastAPI backend
- **D68** — SQLAlchemy 2.x ORM + Alembic migrations
- **D69** — Server DB simplified to 3 tables: `content_items`, `categories`, `interests`
- **D70** — `content_items.category_id` is a single nullable FK
- **D71** — `content_items.interest_ids` is a PostgreSQL `UUID[]`, validated and normalized in the service layer

---

## 3. Repo Layout — Database Code

All database code lives under `server/`. No `packages/shared` or top-level `db/`.

```
server/
├── app/
│   ├── db/
│   │   ├── base.py           # DeclarativeBase; imports all models for Alembic
│   │   ├── session.py        # Engine, SessionLocal, get_db() dependency
│   │   └── seed.py           # Insert demo categories + interests
│   ├── models/
│   │   ├── __init__.py
│   │   ├── content_item.py
│   │   ├── category.py
│   │   └── interest.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── content_item.py   # ContentItemCreate, ContentItemRead, ContentItemUpdate
│   │   ├── category.py       # CategoryCreate, CategoryRead
│   │   ├── interest.py       # InterestCreate, InterestRead
│   │   └── catalog.py        # CatalogResponse (full sync payload)
│   └── services/
│       ├── catalog_service.py
│       ├── category_service.py
│       └── interest_service.py
├── alembic/
│   ├── env.py                # Wired to Base.metadata
│   ├── alembic.ini
│   └── versions/
│       ├── 0001_enable_uuid_extension.py
│       ├── 0002_create_core_tables.py
│       └── 0003_add_indexes.py
└── tests/
    └── db/
        ├── conftest.py       # Test DB session, rollback per test
        ├── factories.py      # Hand-rolled test data factories
        └── test_models.py    # Smoke tests
```

**Rule:** `app/db/base.py` must import every model so Alembic autogenerate sees the full schema.

---

## 4. Connection & Config

### 4.1 Environment variables

| Variable | Example | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql+psycopg2://tactitok:secret@localhost:5432/tactitok` | Required. Used by SQLAlchemy + Alembic. |
| `DB_POOL_SIZE` | `5` | Optional; default 5 |
| `DB_POOL_MAX_OVERFLOW` | `10` | Optional; default 10 |

Store in `.env` (gitignored). Load via `python-dotenv` in `main.py`. Never commit credentials.

### 4.2 Local dev — Docker Compose

```yaml
# docker-compose.dev.yml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: tactitok
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: tactitok
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

```bash
docker compose -f docker-compose.dev.yml up -d
alembic upgrade head
python -m app.db.seed
```

### 4.3 `session.py` pattern

```python
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

engine = create_engine(
    os.environ["DATABASE_URL"],
    pool_size=int(os.getenv("DB_POOL_SIZE", 5)),
    max_overflow=int(os.getenv("DB_POOL_MAX_OVERFLOW", 10)),
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Use as FastAPI dependency: `db: Session = Depends(get_db)`.

---

## 5. SQLAlchemy Model Spec

All models inherit from `Base = DeclarativeBase()` in `app/db/base.py`. Use classic `Column()` style consistently.

### 5.1 Base (`app/db/base.py`)

```python
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

# Import all models so Alembic sees the full schema
from app.models.content_item import ContentItem  # noqa: F401
from app.models.category import Category         # noqa: F401
from app.models.interest import Interest         # noqa: F401
```

### 5.2 ContentItem (`app/models/content_item.py`)

Table: `content_items`

```python
import uuid
from sqlalchemy import Column, String, Text, Enum as SAEnum, BigInteger, Integer, DateTime, ForeignKey, func, text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.orm import relationship
from app.db.base import Base

class ContentItem(Base):
    __tablename__ = "content_items"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title          = Column(String(255), nullable=False)
    description    = Column(Text, nullable=False, server_default="")
    type           = Column(SAEnum("video", "pdf", name="content_type_enum"), nullable=False)
    filename       = Column(String(255), nullable=False)
    file_path      = Column(String(500), nullable=False)
    file_size      = Column(BigInteger, nullable=False)
    mime_type      = Column(String(100), nullable=False)
    duration       = Column(Integer, nullable=True)
    thumbnail_path = Column(String(500), nullable=True)
    version        = Column(Integer, nullable=False, default=1)
    category_id    = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    interest_ids   = Column(
        MutableList.as_mutable(ARRAY(UUID(as_uuid=True))),
        nullable=False,
        server_default=text("'{}'::uuid[]"),
    )
    created_at     = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    category = relationship("Category", back_populates="content_items", lazy="selectin")
```

**Important implementation note:** `MutableList.as_mutable(...)` is required. Without it, in-place changes such as `item.interest_ids.append(...)` may not be detected by SQLAlchemy.

Indexes (defined in migration `0003`, not in model):
- `idx_content_type` on `type`
- `idx_content_updated` on `updated_at`
- `idx_content_category` on `category_id`
- `idx_content_interest_ids` as a GIN index on `interest_ids`
- `idx_content_search` covering `(title, description)` — use `ILIKE` initially; upgrade to `tsvector` GIN if needed

### 5.3 Category (`app/models/category.py`)

Table: `categories`

```python
import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base

class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (UniqueConstraint("parent_id", "name", name="uq_category_parent_name"),)

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name       = Column(String(100), nullable=False)
    parent_id  = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    parent        = relationship("Category", remote_side="Category.id", back_populates="children")
    children      = relationship("Category", back_populates="parent", cascade="all, delete-orphan")
    content_items = relationship("ContentItem", back_populates="category", passive_deletes=True)
```

**App-level constraint (not DB):** in `CategoryService.create()` / `.update()`, if `parent_id` is provided, verify the referenced category has `parent_id IS NULL`. Raise `HTTPException(400, "max category depth is 2")` if violated.

### 5.4 Interest (`app/models/interest.py`)

Table: `interests`

```python
import uuid
from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class Interest(Base):
    __tablename__ = "interests"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name       = Column(String(100), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
```

**Implementation note:** There is intentionally **no ORM relationship** from `Interest` to `ContentItem` in MVP. The link is stored as raw UUIDs in `content_items.interest_ids`.

---

## 6. Pydantic Schema Spec

Schemas live in `server/app/schemas/`. They serve two purposes: (a) request validation for admin API endpoints, (b) response serialization matching `06_api-contract.md`.

### 6.1 Read DTOs (`catalog.py`)

These match `05_data-model.md §6.5` exactly.

```python
from enum import Enum
from typing import Optional
from pydantic import BaseModel

class ContentType(str, Enum):
    video = "video"
    pdf   = "pdf"

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

class CatalogResponse(BaseModel):
    items: list[ContentItemDTO]
    categories: list[CategoryDTO]
    interests: list[InterestDTO]
    syncedAt: str
```

### 6.2 Admin write schemas (`content_item.py`, `category.py`, `interest.py`)

```python
# content_item.py
class ContentItemCreate(BaseModel):
    title: str
    description: str = ""
    categoryId: Optional[str] = None
    interestIds: list[str] = []

class ContentItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    categoryId: Optional[str] = None
    interestIds: Optional[list[str]] = None

# category.py
class CategoryCreate(BaseModel):
    name: str
    parentId: Optional[str] = None
    sortOrder: int = 0

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    parentId: Optional[str] = None
    sortOrder: Optional[int] = None

# interest.py
class InterestCreate(BaseModel):
    name: str
```

---

## 7. Service-Layer Rules

The denormalized schema pushes some integrity into the service layer. These rules are mandatory.

### 7.1 `CatalogService`

Responsibilities:
- Validate `categoryId` if provided
- Validate every UUID in `interestIds`
- Ensure every `interestId` exists in `interests`
- Dedupe and normalize `interestIds` before persistence
- Serialize DB rows into the public DTO shape (`categoryId`, `interestIds`)

Suggested helper:

```python
def normalize_interest_ids(raw_ids: list[str], existing_ids: set[str]) -> list[uuid.UUID]:
    canonical = {str(uuid.UUID(value)) for value in raw_ids}
    missing = canonical - existing_ids
    if missing:
        raise HTTPException(422, f"invalid interest_ids: {sorted(missing)}")
    return [uuid.UUID(value) for value in sorted(canonical)]
```

### 7.2 `InterestService.delete()`

Delete is a two-step transaction:
1. Remove the interest UUID from every matching `content_items.interest_ids`
2. Delete the row from `interests`

Recommended SQLAlchemy pattern:

```python
from sqlalchemy import update, func

db.execute(
    update(ContentItem)
    .where(ContentItem.interest_ids.any(interest_id))
    .values(interest_ids=func.array_remove(ContentItem.interest_ids, interest_id))
)
db.delete(interest)
db.commit()
```

**Rule:** Do not delete the `Interest` row first. The cleanup must happen in the same transaction.

### 7.3 `CategoryService.delete()`

No manual content cleanup required. PostgreSQL handles `ON DELETE SET NULL` on `content_items.category_id`.

---

## 8. Alembic Workflow

### 8.1 Initial setup (run once per dev machine)

```bash
cd server
pip install -r requirements.txt   # includes alembic, sqlalchemy, psycopg2-binary
alembic init alembic
```

Wire `alembic/env.py`:

```python
import os
from app.db.base import Base

config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])
target_metadata = Base.metadata
```

Set filename template in `alembic.ini`:

```ini
file_template = %%(year)d%%(month).2d%%(day).2d_%%(hour).2d%%(minute).2d_%%(slug)s
```

### 8.2 Daily commands

| Action | Command |
|--------|---------|
| Create migration from model diff | `alembic revision --autogenerate -m "describe_change"` |
| Apply all pending | `alembic upgrade head` |
| Roll back one | `alembic downgrade -1` |
| Roll back to empty | `alembic downgrade base` |
| Show current revision | `alembic current` |
| Show history | `alembic history --verbose` |

**Rule (DG5):** Every schema change must be an Alembic migration file. No raw `ALTER TABLE` on the database, ever.

---

## 9. Migration Plan — Initial Schema

Apply in this exact order. Do not merge or reorder.

| File | Creates | Notes |
|------|---------|-------|
| `0001_enable_uuid_extension` | `uuid-ossp` extension | Run `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"` |
| `0002_create_core_tables` | `content_items`, `categories`, `interests` | Includes all columns, PKs, ENUM `content_type_enum`, `category_id` FK, `interest_ids UUID[]`, UNIQUE on category sibling names |
| `0003_add_indexes` | Indexes only | `idx_content_type`, `idx_content_updated`, `idx_content_category`, `idx_content_interest_ids`, `idx_content_search`, `idx_category_parent`, `idx_category_sort` |

Seed data (categories + interests) belongs in `app/db/seed.py`, **not** in migrations. Migrations are schema-only.

### 9.1 `0002_create_core_tables` details

`content_items` must include:
- `category_id UUID NULL REFERENCES categories(id) ON DELETE SET NULL`
- `interest_ids UUID[] NOT NULL DEFAULT '{}'::uuid[]`

### 9.2 `0003_add_indexes` details

- `idx_content_category` = btree on `content_items(category_id)`
- `idx_content_interest_ids` = GIN on `content_items(interest_ids)`

For GIN index migration:

```python
op.create_index(
    "idx_content_interest_ids",
    "content_items",
    ["interest_ids"],
    postgresql_using="gin",
)
```

---

## 10. Seed Data Spec

Script: `server/app/db/seed.py`
Run: `python -m app.db.seed` (after `alembic upgrade head`)
Idempotent: check for existence before inserting; safe to re-run.

### 10.1 Demo categories

| Name | Parent | sort_order |
|------|--------|-----------|
| Weapons | — | 1 |
| Rifle Systems | Weapons | 1 |
| Anti-tank | Weapons | 2 |
| Communications | — | 2 |
| Radio Comms | Communications | 1 |
| Tactical Procedures | — | 3 |

### 10.2 Demo interests

- Small Arms
- Field Communications
- Urban Warfare
- Combat Medicine
- Navigation
- Logistics

### 10.3 Idempotency pattern

```python
from sqlalchemy.orm import Session
from app.models.interest import Interest

def seed_interests(db: Session) -> None:
    names = ["Small Arms", "Field Communications", "Urban Warfare",
             "Combat Medicine", "Navigation", "Logistics"]
    for name in names:
        if not db.query(Interest).filter_by(name=name).first():
            db.add(Interest(name=name))
    db.commit()
```

---

## 11. Constraints & Invariants

### 11.1 DB-level (PostgreSQL enforces)

| Constraint | Location | Mechanism |
|-----------|----------|-----------|
| PK uniqueness | All tables | `PRIMARY KEY` |
| `content_items.type` value | `content_items` | PostgreSQL ENUM `content_type_enum` |
| `interests.name` globally unique | `interests` | `UNIQUE` column |
| Category name unique within parent | `categories` | `UniqueConstraint("parent_id", "name")` |
| `content_items.category_id` references a valid category or null | `content_items` | FK with `ON DELETE SET NULL` |
| Cascade delete parent category → children | `categories.parent_id` | `ON DELETE CASCADE` |
| `interest_ids` column is always an array | `content_items` | `UUID[] NOT NULL DEFAULT '{}'::uuid[]` |

### 11.2 App-level (service layer enforces)

| Constraint | File | Response on violation |
|-----------|------|-----------------------|
| Category max depth = 2 | `app/services/category_service.py` | `HTTPException(400, "max category depth is 2")` |
| File MIME (MP4 or PDF) — magic-byte check | `app/services/content_file_service.py` | `HTTPException(415, "unsupported media type")` |
| File size ≤ 100 MB | `app/services/content_file_service.py` | `HTTPException(413, "file too large")` |
| Video duration ≤ 180 s | `app/services/content_file_service.py` (optional MVP) | `HTTPException(422, "video exceeds 3 min limit")` |
| `categoryId` references valid UUID | `app/services/catalog_service.py` | `HTTPException(422, "invalid category_id")` |
| `interestIds` reference valid UUIDs | `app/services/catalog_service.py` | `HTTPException(422, "invalid interest_id")` |
| `interestIds` deduped + sorted | `app/services/catalog_service.py` | Normalize before save; no error |
| Interest delete cleans all arrays before row delete | `app/services/interest_service.py` | Single DB transaction |

---

## 12. Query Patterns

Maps queries from `05_data-model.md §13.1` to SQLAlchemy implementation. All queries live in the service layer (`app/services/`), not in route handlers.

| Query | SQLAlchemy expression | Service method |
|-------|----------------------|----------------|
| Full catalog (all items + categories + interests) | `db.query(ContentItem).order_by(ContentItem.updated_at.desc()).all()` plus separate category + interest queries | `CatalogService.get_full_catalog()` |
| Search title + description | `db.query(ContentItem).filter(or_(ContentItem.title.ilike(f"%{q}%"), ContentItem.description.ilike(f"%{q}%")))` | `CatalogService.search(q)` |
| Filter type = video | `.filter(ContentItem.type == "video")` | `CatalogService.get_by_type("video")` |
| Filter by interest IDs | `.filter(ContentItem.interest_ids.overlap(ids))` | `CatalogService.get_by_interests(ids)` |
| Filter by category ID | `.filter(ContentItem.category_id == cat_id)` | `CatalogService.get_by_category(cat_id)` |
| Get uncategorized items | `.filter(ContentItem.category_id.is_(None))` | `CatalogService.get_uncategorized()` |
| Category tree | `db.query(Category).order_by(Category.sort_order).all()` → build tree in Python | `CategoryService.get_tree()` |
| Admin content list | `db.query(ContentItem).order_by(ContentItem.updated_at.desc()).all()` | `CatalogService.list_all_admin()` |

**Note:** `overlap()` compiles to PostgreSQL array overlap (`&&`). This is the canonical interest filter for MVP.

---

## 13. Test Fixtures

### 13.1 Test DB session (`server/tests/db/conftest.py`)

Use a real PostgreSQL instance — not SQLite. ARRAY columns, ENUM types, and `ON DELETE SET NULL` must be tested against Postgres.

```python
import os, pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.db.base import Base

@pytest.fixture(scope="session")
def engine():
    e = create_engine(os.environ["TEST_DATABASE_URL"])
    Base.metadata.create_all(e)
    yield e
    Base.metadata.drop_all(e)

@pytest.fixture
def db(engine):
    with Session(engine) as session:
        yield session
        session.rollback()
```

### 13.2 Factories (`server/tests/db/factories.py`)

```python
import uuid
from app.models.content_item import ContentItem
from app.models.category import Category
from app.models.interest import Interest

def make_content_item(db, **kwargs) -> ContentItem:
    item = ContentItem(**(dict(
        id=uuid.uuid4(),
        title="Test Video",
        description="",
        type="video",
        filename="test.mp4",
        file_path="./data/content/test.mp4",
        file_size=1024,
        mime_type="video/mp4",
        version=1,
        interest_ids=[],
    ) | kwargs))
    db.add(item); db.flush(); return item

def make_category(db, **kwargs) -> Category:
    cat = Category(**(dict(id=uuid.uuid4(), name="Test Category", sort_order=0) | kwargs))
    db.add(cat); db.flush(); return cat

def make_interest(db, **kwargs) -> Interest:
    interest = Interest(**(dict(id=uuid.uuid4(), name="Test Interest") | kwargs))
    db.add(interest); db.flush(); return interest
```

### 13.3 Smoke tests (`server/tests/db/test_models.py`)

```python
def test_content_item_with_single_category_and_multiple_interests(db):
    cat = make_category(db, name="Weapons")
    i1 = make_interest(db, name="Small Arms")
    i2 = make_interest(db, name="Urban Warfare")
    item = make_content_item(
        db,
        title="Rifle Handling",
        category_id=cat.id,
        interest_ids=[i1.id, i2.id],
    )
    db.flush()

    fetched = db.get(ContentItem, item.id)
    assert fetched.title == "Rifle Handling"
    assert fetched.category_id == cat.id
    assert len(fetched.interest_ids) == 2

def test_category_delete_sets_content_category_id_to_null(db):
    cat = make_category(db, name="Weapons")
    item = make_content_item(db, category_id=cat.id)
    db.delete(cat)
    db.flush()
    db.refresh(item)
    assert item.category_id is None
```

---

## 14. Out of Scope (Deferred)

Do not build these in MVP. UUID PKs and `snake_case` column names are already in place to avoid future schema rewrites.

| Feature | Why deferred | Continuation path |
|---------|-------------|------------------|
| `users` table | No user identity in MVP | Add `users(id, email, password_hash, role)` + `created_by` FK on `content_items` |
| Soft delete (`deleted_at`) | Hard delete is sufficient | Add `deleted_at TIMESTAMP NULLABLE`; filter `WHERE deleted_at IS NULL` everywhere |
| `content_versions` table | Version counter sufficient for badge | Add `(id, content_id, version, file_path, created_at)`; update increments instead of overwrites |
| `analytics_events` table | No server analytics without user identity | Add `(id, device_id, content_id, event_type, timestamp)` |
| `sync_state` / delta sync | Full pull fine at ≤15 items | Add monotonic counter; `GET /api/catalog?since=` returns only changed items |
| Dedicated normalized interest-assignment table | Array column is simpler for MVP | Add a separate interest-assignment table later if needed |
| `tenant_id` on all tables | Single-tenant for MVP | Add UUID column defaulting to fixed constant; partition all queries later |
| `tsvector` GIN index | `ILIKE` sufficient for demo | `ADD COLUMN search_vector tsvector` + GIN index + trigger on `content_items` |

---

## 15. Definition of Done

- [ ] All 3 server SQLAlchemy model files exist under `server/app/models/`
- [ ] `alembic upgrade head` from an empty PostgreSQL database produces all tables, columns, indexes, constraints, and FK rules with zero errors
- [ ] `alembic downgrade base` cleanly reverses all migrations
- [ ] `python -m app.db.seed` inserts demo categories and interests; re-running does not duplicate rows
- [ ] `pytest server/tests/db/` passes — smoke test creates a ContentItem with 1 Category + 2 Interests and reads it back correctly
- [ ] Category delete sets `content_items.category_id` to `NULL`
- [ ] Interest delete removes the UUID from all `content_items.interest_ids` arrays in one transaction
- [ ] All Pydantic schemas exist in `server/app/schemas/` matching shapes in `05_data-model.md` and `06-api-contract.md`
- [ ] `get_db()` FastAPI dependency is wired and used in at least one route (catalog sync endpoint)
- [ ] No raw `ALTER TABLE` outside Alembic migration files

---

## 16. Open Questions

Resolve before coding the affected module.

| # | Question | Affects | Recommended default |
|---|---------|---------|-------------------|
| Q24 | Thumbnails in `./data/content/` or `./data/thumbnails/`? | `ContentItem.thumbnail_path` format, `ContentFileService` | Separate `./data/thumbnails/{uuid}.jpg` for clarity |
| Q25 | Can content be assigned to zero categories? | `CatalogService.create()` validation | Allow zero; show under "All" / "Uncategorized" in library |
| Q38 | Python 3.11 or 3.12? | `Dockerfile`, `requirements.txt`, local dev | 3.11 (LTS stability, broader library support) |

---

## 17. Continuation Notes

Leave these hooks in place so future work does not require schema rewrites:

- **UUID PKs** — in place on all entities. Enables multi-source sync without collision risk.
- **`version` counter on ContentItem** — already tracked. Drives "updated" badge; seed for future `content_versions` table.
- **`updated_at` indexed** (`idx_content_updated`) — basis for future `?since=` delta sync.
- **`CatalogResponse.syncedAt`** — edge client stores this; maps to future delta sync param.
- **`category_id` as nullable FK** — already supports uncategorized content; continuation can add stronger taxonomy rules without breaking the column.
- **`interest_ids` as `UUID[]`** — simplest MVP choice; future migrations can expand it into a dedicated normalized assignment table if richer link semantics are needed.
- **`device_id` in DeviceProfile** — UUIDv4 already used in IndexedDB. Maps to future `users.id` when auth is added.

---

## 18. Assumptions

| # | Assumption | Impact if wrong |
|---|-----------|----------------|
| A1 | PostgreSQL 15+ available on cloud VM | Older versions may lack some ARRAY or index features |
| A2 | `psycopg2-binary` acceptable (not `asyncpg`) | If async DB is required, switch to `asyncpg` + SQLAlchemy async session |
| A3 | `TEST_DATABASE_URL` points to a real Postgres instance in CI | SQLite substitute will miss ARRAY + FK behavior |
| A4 | Seed category/interest names match the 15 demo content items the team prepares | Mismatch means admin must re-tag content after upload |
| A5 | Sorting normalized `interest_ids` is acceptable to the UI and admin workflows | If order becomes user-visible, preserve client order in a future schema change |

---

## 19. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| R1 | Alembic autogenerate misses the PostgreSQL ENUM `content_type_enum` on downgrade | Low | Medium | Manually verify ENUM drop in `0002` downgrade; test `downgrade base` in CI |
| R2 | `MutableList` omitted from `interest_ids`, causing silent missed updates | Medium | High | Use `MutableList.as_mutable(ARRAY(...))`; add a test for in-place list mutation |
| R3 | Interest delete cleanup uses `array_remove` incorrectly or outside a transaction | Medium | High | Centralize delete in `InterestService.delete()`; add integration test |
| R4 | UUID[] query syntax is unfamiliar to the team | Medium | Low | Keep array filtering inside `CatalogService`; document `.overlap()` as the one canonical pattern |
| R5 | Seed data out of sync with demo content items | Medium | Demo quality | Confirm seed names match actual demo content by week 8 |

---

## 20. De-scope Levers

Applied in this order if time runs short.

| Priority | Simplification | Effect |
|----------|---------------|--------|
| 1st | Seed categories + interests as Alembic migration (remove `seed.py`) | Saves ~2 hours; lose idempotency |
| 2nd | Drop thumbnail support entirely — remove `thumbnail_path` from model | Simplifies admin upload; UI uses type-based placeholder |
| 3rd | Make interests read-only seed data | Remove InterestService admin write API |
| 4th | Skip GIN index initially | Array overlap queries still work for the small demo dataset; add the index later |
| 5th | Use SQLite instead of PostgreSQL | Removes Docker Compose setup; loses ARRAY type, ENUM parity, and concurrency safety |

---

*This document is the eighth in the TactiTok document set. Implement in Sprint 1, Week 1–2. Validate with `alembic upgrade head` + `pytest server/tests/db/` before any API route development.*
