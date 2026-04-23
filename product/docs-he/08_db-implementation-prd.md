# PRD מימוש DB — TactiTok

> **גרסה:** 1.1
> **סטטוס:** טיוטה
> **תאריך:** 2026-04-23
> **מסמך מקור:** `product/docs-he/05_data-model.md`
> **מסמכים מקבילים:** `product/docs-he/04_system-architecture.md`, `product/docs-he/06_api-contract.md`
> **קהל יעד:** Dev A (בקאנד ראשי), Dev B + Dev C (לעיון)

---

## 1. מטרה וקהל יעד

זהו מסמך handoff למפתחים עבור שכבת מסד הנתונים. הוא מתרגם את `05_data-model.md` מה-*מה* אל ה-*איך*.

לאחר הקריאה, Dev A אמור להיות מסוגל:
- ליצור את קבצי מודלי ה-SQLAlchemy תחת `server/app/models/`
- לחבר את Alembic ולהריץ `alembic upgrade head` על PostgreSQL ריק
- לזרוע קטגוריות ותחומי עניין לדמו
- לכתוב שאילתות שירות שמשרתות את `06_api-contract.md`
- לממש את ה-cleanup הנדרש עבור `interest_ids` כמערך denormalized

מסמך זה **לא** מגדיר מחדש ישויות או עמודות; `05_data-model.md` הוא מקור האמת המחייב.

---

## 2. מקור האמת

| מסמך | מה הוא קובע |
|------|-------------|
| `product/docs-he/05_data-model.md` | ישויות, עמודות, אינדקסים, קשרים, אינווריאנטים |
| `product/docs-he/06_api-contract.md` | צורות תגובה ושאילתות שה-schema חייב לשרת |
| `product/docs-he/04_system-architecture.md` | Stack, פריסת repo, קונפיגורציה |

החלטות בתוקף:
- **D26** — PostgreSQL
- **D38** — UUID לכל PK
- **D39** — Hard delete בלבד
- **D40** — קובץ בינארי אחד לכל פריט תוכן
- **D64** — Python + FastAPI
- **D68** — SQLAlchemy 2.x + Alembic
- **D69** — סכמת שרת בת 3 טבלאות בלבד
- **D70** — `content_items.category_id` הוא FK יחיד ו-nullable
- **D71** — `content_items.interest_ids` הוא `UUID[]` ונבדק בשכבת השירות

---

## 3. פריסת repo — קוד DB

```
server/
├── app/
│   ├── db/
│   │   ├── base.py
│   │   ├── session.py
│   │   └── seed.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── content_item.py
│   │   ├── category.py
│   │   └── interest.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── content_item.py
│   │   ├── category.py
│   │   ├── interest.py
│   │   └── catalog.py
│   └── services/
│       ├── catalog_service.py
│       ├── category_service.py
│       └── interest_service.py
├── alembic/
│   ├── env.py
│   ├── alembic.ini
│   └── versions/
│       ├── 0001_enable_uuid_extension.py
│       ├── 0002_create_core_tables.py
│       └── 0003_add_indexes.py
└── tests/
    └── db/
        ├── conftest.py
        ├── factories.py
        └── test_models.py
```

**כלל:** `app/db/base.py` חייב לייבא את כל המודלים כדי ש-Alembic autogenerate יראה את כל ה-schema.

---

## 4. חיבור וקונפיגורציה

### 4.1 משתני סביבה

| משתנה | דוגמה | הערות |
|-------|-------|-------|
| `DATABASE_URL` | `postgresql+psycopg2://tactitok:secret@localhost:5432/tactitok` | חובה |
| `DB_POOL_SIZE` | `5` | אופציונלי |
| `DB_POOL_MAX_OVERFLOW` | `10` | אופציונלי |

### 4.2 Docker Compose לפיתוח

```yaml
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

### 4.3 דפוס `session.py`

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

---

## 5. מפרט מודלי SQLAlchemy

### 5.1 Base (`app/db/base.py`)

```python
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

from app.models.content_item import ContentItem  # noqa: F401
from app.models.category import Category         # noqa: F401
from app.models.interest import Interest         # noqa: F401
```

### 5.2 ContentItem (`app/models/content_item.py`)

טבלה: `content_items`

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

**הערה חשובה:** חייבים להשתמש ב-`MutableList.as_mutable(...)`, אחרת שינויים in-place ב-`interest_ids` עלולים לא להישמר.

### 5.3 Category (`app/models/category.py`)

טבלה: `categories`

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

### 5.4 Interest (`app/models/interest.py`)

טבלה: `interests`

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

**הערת מימוש:** במכוון אין relationship ORM בין `Interest` ל-`ContentItem`; הקישור נשמר במערך UUIDs.

---

## 6. מפרט סכמות Pydantic

### 6.1 DTOs לקריאה (`catalog.py`)

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

class CatalogResponse(BaseModel):
    items: list[ContentItemDTO]
    categories: list[CategoryDTO]
    interests: list[InterestDTO]
    syncedAt: str
```

### 6.2 סכמות write לאדמין

```python
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

class CategoryCreate(BaseModel):
    name: str
    parentId: Optional[str] = None
    sortOrder: int = 0

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    parentId: Optional[str] = None
    sortOrder: Optional[int] = None

class InterestCreate(BaseModel):
    name: str
```

---

## 7. כללי שכבת שירות

### 7.1 `CatalogService`

חייב:
- לבדוק `categoryId` אם סופק
- לבדוק כל UUID בתוך `interestIds`
- לוודא שכל ID קיים בטבלת `interests`
- לבצע dedupe ונרמול לפני שמירה
- לסריאל את DB row אל `categoryId` + `interestIds`

Helper מומלץ:

```python
def normalize_interest_ids(raw_ids: list[str], existing_ids: set[str]) -> list[uuid.UUID]:
    canonical = {str(uuid.UUID(value)) for value in raw_ids}
    missing = canonical - existing_ids
    if missing:
        raise HTTPException(422, f"invalid interest_ids: {sorted(missing)}")
    return [uuid.UUID(value) for value in sorted(canonical)]
```

### 7.2 `InterestService.delete()`

המחיקה היא דו-שלבית ובטרנזקציה אחת:
1. להסיר את ה-UUID מכל `content_items.interest_ids`
2. למחוק את השורה מטבלת `interests`

דפוס מומלץ:

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

### 7.3 `CategoryService.delete()`

אין צורך ב-cleanup ידני של תוכן. PostgreSQL מטפל ב-`ON DELETE SET NULL` עבור `content_items.category_id`.

---

## 8. Workflow של Alembic

### 8.1 Initial setup

```bash
cd server
pip install -r requirements.txt
alembic init alembic
```

חיבור `alembic/env.py`:

```python
import os
from app.db.base import Base

config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])
target_metadata = Base.metadata
```

### 8.2 פקודות יומיומיות

| פעולה | פקודה |
|-------|-------|
| יצירת migration | `alembic revision --autogenerate -m "describe_change"` |
| החלת כל המיגרציות | `alembic upgrade head` |
| חזרה אחת אחורה | `alembic downgrade -1` |
| חזרה לבסיס | `alembic downgrade base` |

---

## 9. תכנית מיגרציות — schema ראשוני

| קובץ | יוצר | הערות |
|------|------|-------|
| `0001_enable_uuid_extension` | `uuid-ossp` | `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"` |
| `0002_create_core_tables` | `content_items`, `categories`, `interests` | כולל `category_id`, `interest_ids UUID[]`, ENUM, UNIQUE על sibling names |
| `0003_add_indexes` | אינדקסים בלבד | `idx_content_type`, `idx_content_updated`, `idx_content_category`, `idx_content_interest_ids`, `idx_content_search`, `idx_category_parent`, `idx_category_sort` |

### 9.1 פרטי `0002_create_core_tables`

`content_items` חייבת לכלול:
- `category_id UUID NULL REFERENCES categories(id) ON DELETE SET NULL`
- `interest_ids UUID[] NOT NULL DEFAULT '{}'::uuid[]`

### 9.2 פרטי `0003_add_indexes`

- `idx_content_category` = btree על `content_items(category_id)`
- `idx_content_interest_ids` = GIN על `content_items(interest_ids)`

```python
op.create_index(
    "idx_content_interest_ids",
    "content_items",
    ["interest_ids"],
    postgresql_using="gin",
)
```

---

## 10. מפרט seed data

Script: `server/app/db/seed.py`
Run: `python -m app.db.seed`
Idempotent: כן.

### 10.1 קטגוריות דמו

| Name | Parent | sort_order |
|------|--------|-----------|
| Weapons | — | 1 |
| Rifle Systems | Weapons | 1 |
| Anti-tank | Weapons | 2 |
| Communications | — | 2 |
| Radio Comms | Communications | 1 |
| Tactical Procedures | — | 3 |

### 10.2 תחומי עניין לדמו

- Small Arms
- Field Communications
- Urban Warfare
- Combat Medicine
- Navigation
- Logistics

---

## 11. אילוצים ואינווריאנטים

### 11.1 נאכף ב-DB

| אילוץ | מיקום | מנגנון |
|-------|-------|--------|
| PK uniqueness | כל הטבלאות | `PRIMARY KEY` |
| `content_items.type` | `content_items` | ENUM |
| `interests.name` ייחודי | `interests` | `UNIQUE` |
| שם קטגוריה ייחודי בין אחים | `categories` | `UniqueConstraint("parent_id", "name")` |
| `content_items.category_id` תקף או null | `content_items` | FK + `ON DELETE SET NULL` |
| cascade של הורה לקטגוריות ילד | `categories.parent_id` | `ON DELETE CASCADE` |
| `interest_ids` תמיד מערך | `content_items` | `UUID[] NOT NULL DEFAULT '{}'::uuid[]` |

### 11.2 נאכף בשכבת השירות

| אילוץ | קובץ | תגובה בהפרה |
|-------|------|-------------|
| עומק קטגוריה = 2 | `category_service.py` | `HTTPException(400, "max category depth is 2")` |
| סוג קובץ MP4/PDF | `content_file_service.py` | `HTTPException(415, "unsupported media type")` |
| גודל קובץ ≤ 100 MB | `content_file_service.py` | `HTTPException(413, "file too large")` |
| אורך וידאו ≤ 180s | `content_file_service.py` | `HTTPException(422, "video exceeds 3 min limit")` |
| `categoryId` חוקי | `catalog_service.py` | `HTTPException(422, "invalid category_id")` |
| `interestIds` חוקיים | `catalog_service.py` | `HTTPException(422, "invalid interest_id")` |
| `interestIds` ללא כפילויות וממוינים | `catalog_service.py` | נרמול, לא שגיאה |
| delete של interest מנקה את כל המערכים | `interest_service.py` | טרנזקציה אחת |

---

## 12. דפוסי שאילתות

| שאילתה | ביטוי SQLAlchemy | שירות |
|--------|------------------|-------|
| קטלוג מלא | `db.query(ContentItem).order_by(ContentItem.updated_at.desc()).all()` + שאילתות נפרדות לקטגוריות ותחומי עניין | `CatalogService.get_full_catalog()` |
| חיפוש title + description | `ilike` על `title` ו-`description` | `CatalogService.search(q)` |
| `type = video` | `.filter(ContentItem.type == "video")` | `CatalogService.get_by_type("video")` |
| סינון לפי `interestIds` | `.filter(ContentItem.interest_ids.overlap(ids))` | `CatalogService.get_by_interests(ids)` |
| סינון לפי קטגוריה | `.filter(ContentItem.category_id == cat_id)` | `CatalogService.get_by_category(cat_id)` |
| פריטים לא מסווגים | `.filter(ContentItem.category_id.is_(None))` | `CatalogService.get_uncategorized()` |
| עץ קטגוריות | query + בניית עץ ב-Python | `CategoryService.get_tree()` |

---

## 13. Fixtures ובדיקות

### 13.1 Test DB session

להשתמש ב-PostgreSQL אמיתי — לא SQLite.

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

### 13.2 Factories

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
```

### 13.3 Smoke tests

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

## 14. מחוץ לסקופ (Deferred)

| פיצ'ר | למה נדחה | מסלול המשך |
|-------|----------|------------|
| `users` table | אין זהות משתמש ב-MVP | להוסיף `users` + `created_by` |
| Soft delete | Hard delete מספיק | להוסיף `deleted_at` |
| `content_versions` | מונה גרסה מספיק | להוסיף טבלת גרסאות |
| `analytics_events` | אין אנליטיקה שרתית | להוסיף טבלת אירועים |
| `sync_state` / delta sync | full pull מספיק | להוסיף monotonic counter |
| טבלת שיוכי תחומי עניין מנורמלת ייעודית | מערך פשוט יותר ל-MVP | להחזיר טבלה בעתיד |
| `tenant_id` | single-tenant ב-MVP | להוסיף UUID בהמשך |
| `tsvector` GIN | `ILIKE` מספיק | להוסיף search_vector בעתיד |

---

## 15. Definition of Done

- [ ] קיימים 3 קובצי מודלים תחת `server/app/models/`
- [ ] `alembic upgrade head` יוצר את כל ה-schema ללא שגיאות
- [ ] `alembic downgrade base` מתבצע נקי
- [ ] `python -m app.db.seed` זורע categories + interests בצורה idempotent
- [ ] `pytest server/tests/db/` עובר
- [ ] מחיקת category מאפסת `content_items.category_id`
- [ ] מחיקת interest מנקה את כל `interest_ids` בטרנזקציה אחת
- [ ] סכמות Pydantic תואמות ל-`05` ול-`06`
- [ ] אין `ALTER TABLE` מחוץ ל-Alembic

---

## 16. שאלות פתוחות

| # | שאלה | משפיע על | ברירת מחדל |
|---|------|----------|------------|
| Q24 | Thumbnails ב-`./data/content/` או `./data/thumbnails/`? | `thumbnail_path` | ספריה נפרדת |
| Q25 | האם תוכן יכול להיות ללא קטגוריה? | `CatalogService.create()` | כן |
| Q38 | Python 3.11 או 3.12? | Dockerfile / env | 3.11 |

---

## 17. הערות המשך

- **UUID PKs** כבר קיימים ומתאימים להמשך.
- **`version` ב-ContentItem** נשמר ומהווה בסיס ל-`content_versions`.
- **`updated_at`** מהווה בסיס ל-delta sync.
- **`CatalogResponse.syncedAt`** נשמר בצד הקצה.
- **`category_id` nullable** כבר מאפשר תוכן לא מסווג.
- **`interest_ids` כ-`UUID[]`** היא בחירת MVP; בהמשך אפשר להחליף לטבלת שיוכים מנורמלת ייעודית.
- **`device_id`** מתאים למיפוי עתידי ל-`users.id`.

---

## 18. הנחות

| # | הנחה | השפעה אם שגויה |
|---|------|----------------|
| A1 | PostgreSQL 15+ זמין | גרסאות ישנות עלולות לחסר תכונות ARRAY |
| A2 | `psycopg2-binary` מספיק | אם נדרש async DB — לעבור ל-`asyncpg` |
| A3 | `TEST_DATABASE_URL` מצביע ל-Postgres אמיתי | SQLite לא יבדוק ARRAY/FK נכון |
| A4 | שמות ה-seed מתאימים לתוכן הדמו | יידרש retagging |
| A5 | מיון `interest_ids` מקובל ב-UI | אם סדר יהיה user-visible בעתיד, נשמר סדר קלט |

---

## 19. סיכונים

| # | סיכון | סבירות | השפעה | מיתון |
|---|-------|--------|--------|-------|
| R1 | Alembic autogenerate יפספס את הורדת ENUM ב-downgrade | נמוכה | בינונית | לבדוק downgrade ב-CI |
| R2 | שכחת `MutableList` תגרום לאיבוד שינויים במערך | בינונית | גבוהה | להוסיף test ל-in-place mutation |
| R3 | `array_remove` ישומש לא נכון במחיקת interest | בינונית | גבוהה | לרכז בלוגיקת `InterestService.delete()` |
| R4 | הצוות לא מכיר מספיק טוב שאילתות UUID[] | בינונית | נמוכה | לתעד את `.overlap()` כ-pattern קנוני |
| R5 | נתוני seed לא יתאימו לתוכן דמו | בינונית | איכות דמו | לאשר שמות בשבוע 8 |

---

## 20. מנופי צמצום

| עדיפות | פישוט | השפעה |
|--------|--------|-------|
| 1 | לזרוע categories + interests כמיגרציית Alembic | חוסך `seed.py` |
| 2 | להסיר thumbnail support | UI ישתמש ב-placeholder |
| 3 | להפוך interests ל-read-only seed data | להסיר API write ל-interests |
| 4 | לדחות את אינדקס ה-GIN | השאילתות עדיין עובדות ב-dataset קטן |
| 5 | להשתמש ב-SQLite במקום PostgreSQL | חוסך setup; מאבד ARRAY/ENUM/parity |

---

*זהו המסמך השמיני בסט המסמכים של TactiTok. לממש בספרינט 1 שבועות 1–2, ולאמת עם `alembic upgrade head` ו-`pytest server/tests/db/`.*
