# מודל נתונים — TactiTok

> **גרסה:** 0.4
> **סטטוס:** טיוטה
> **עודכן לאחרונה:** 2026-04-23
> **מסמך קודם:** `product/04_system-architecture.md`
> **מסמך הבא:** `product/06_api-contract.md`
> **יומן שינויים:** v0.2 — יושר מול Architecture v0.2 (טופולוגיית edge proxy): הוסרו הפניות ל-Cache API / Service Worker; DownloadRecord פושט; קבצי תוכן נשמרים כעת דרך edge proxy. v0.3 (2026-03-25): ה-ORM הוחלף מ-Prisma ל-SQLAlchemy. כלי המיגרציות הוחלף מ-Prisma migrate ל-Alembic. דוגמאות TypeScript הוחלפו ב-Python/Pydantic. v0.4 (2026-04-23): סכמת השרת פושטה ל-3 טבלאות. `content_items` שומר כעת `categoryId` יחיד ו-`interestIds` כמערך UUID; טבלאות שיוך נפרדות הוסרו.

---

## 1. מטרת המסמך

מסמך זה מגדיר את מודל הנתונים המינימלי ל-MVP. הוא עונה על:

- מהן הישויות המרכזיות בדומיין
- איזה מטה-דאטה נדרש לפריטי תוכן
- איך קטגוריות, תחומי עניין ותוכן קשורים זה לזה
- איזה מצב נשמר בשרת לעומת מקומית בדפדפן
- אילו אילוצי שלמות חשובים ל-MVP
- אילו חלקים במודל נדחו בכוונה

כל מסמך המשך (API Contract → Delivery Plan) חייב להיות עקבי עם מודל זה.

---

## 2. מטרות מודל הנתונים

| # | מטרה | רציונל |
|---|------|---------|
| DG1 | **מספר ישויות מינימלי** | 3 מפתחים, 10 שבועות; כל טבלה צריכה להצדיק את עצמה |
| DG2 | **צורות wire משותפות** | תגובות השרת והמטמון המקומי בדפדפן משתמשים באותה צורת DTO של הקטלוג |
| DG3 | **מוכן להמשך** | אפשר להוסיף בעתיד שדות כמו user-id או view-count בלי לשכתב את המודל |
| DG4 | **הפרדה נקייה** | שרת PostgreSQL מול מטמון edge proxy ב-nginx מול מצב דפדפן מקומי ב-IndexedDB |
| DG5 | **Schema מבוסס מיגרציות** | כל שינוי הוא קובץ Alembic בגרסה; אין ALTER TABLE אד-הוק |

---

## 3. הגדרות / מונחים

| מונח | הגדרה |
|------|--------|
| **ישות שרת** | רשומה שנשמרת ב-PostgreSQL על גבי ה-cloud VM |
| **ישות מקומית** | רשומה שנשמרת ב-IndexedDB בדפדפן על מכשיר הקצה |
| **פריט תוכן** | יחידת תוכן הדרכה אחת (וידאו או PDF) עם מטה-דאטה |
| **קובץ תוכן** | הנכס הבינארי (MP4 או PDF) שנשמר במערכת הקבצים של השרת |
| **קטגוריה** | צומת בהיררכיה דו-רמתית לארגון תוכן בספרייה |
| **תחום עניין** | תגית שטוחה לסינון פיד הרילס והספרייה; מנוהלת על ידי אדמין |
| **פרופיל מכשיר** | תצורה מקומית בלבד (בחירת תחומי עניין); ללא זהות שרת |
| **רשומת הורדה** | רשומת מטה-דאטה מקומית העוקבת אחרי קובץ שהמשתמש הוריד ביוזמתו (הקובץ עצמו נשמר במטמון ה-edge proxy) |
| **עמודת מערך** | עמודת PostgreSQL ששומרת כמה ערכים בשדה אחד; כאן משמשת עבור `content_items.interest_ids` |

---

## 4. עקרונות מידול

1. **קובץ אחד לכל פריט תוכן** — לכל פריט תוכן יש בדיוק קובץ בינארי אחד (MP4 או PDF). אין פריטים מרובי קבצים ב-MVP.
2. **קטגוריה אופציונלית יחידה לכל פריט תוכן** — פריט תוכן יכול להשתייך לאפס או לקטגוריה אחת. זה מפשט את ארגון הספרייה.
3. **כמה תחומי עניין לכל פריט תוכן** — פריט תוכן יכול לשאת אפס או הרבה תחומי עניין, הנשמרים כ-`UUID[]` על שורת התוכן עצמה.
4. **קטגוריות ותחומי עניין עצמאיים** — פריט תוכן יכול להיות בכל קטגוריה ובכל קבוצת תחומי עניין. אין ביניהם היררכיה או מיפוי קשיח.
5. **השרת סמכותי** — כל נתוני הקטלוג נשמרים ב-PostgreSQL. הקצה שומר Snapshot ב-IndexedDB.
6. **ללא זהות משתמש** — אין טבלת `User`. מצב הקצה הוא ברמת מכשיר, ואימות אדמין הוא סיסמה משותפת אחת.
7. **מונה גרסה, לא היסטוריית גרסאות** — עדכון תוכן מגדיל מונה ומחליף את הקובץ. גרסאות קודמות אינן נשמרות.
8. **תמונות ממוזערות אופציונליות** — אדמין יכול להעלות thumbnail; אם לא, הממשק מציג Placeholder לפי סוג התוכן.
9. **אין Soft Delete ב-MVP** — מחיקת תוכן היא Hard Delete של הרשומה והקובץ.
10. **UUID כמפתחות ראשיים** — מאפשר הרחבה עתידית וסנכרון ממקורות מרובים בלי דליפת IDs סדרתיים.

---

## 5. סקירת ישויות

### 5.1 דיאגרמת קשרים (טקסט)

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

### 5.2 ספירת ישויות

| מיקום | ישות | כמות |
|-------|------|------|
| שרת (PostgreSQL) | ContentItem, Category, Interest | 3 |
| קצה (IndexedDB) | DeviceProfile, CachedCatalog, DownloadRecord, LocalAction | 4 |
| **סה"כ** | | **7** |

---

## 6. הישויות המרכזיות

### 6.1 ContentItem (שרת)

הישות המרכזית המייצגת פריט תוכן.

| שדה | סוג | אילוצים | הערות |
|-----|-----|---------|-------|
| `id` | UUID | PK, נוצר אוטומטית | מזהה יציב לאורך סנכרון |
| `title` | VARCHAR(255) | NOT NULL | מוצג בפיד, בספרייה ובהורדות |
| `description` | TEXT | NOT NULL, ברירת מחדל `''` | ניתן לחיפוש; מוצג בפרטי התוכן |
| `type` | ENUM('video','pdf') | NOT NULL | קובע Viewer והתאמה לפיד |
| `filename` | VARCHAR(255) | NOT NULL | שם הקובץ המקורי להצגה |
| `filePath` | VARCHAR(500) | NOT NULL | נתיב בשרת: `./data/content/{id}.{ext}` |
| `fileSize` | BIGINT | NOT NULL | גודל בבייטים |
| `mimeType` | VARCHAR(100) | NOT NULL | `video/mp4` או `application/pdf` |
| `duration` | INTEGER | NULLABLE | שניות; לוידאו בלבד |
| `thumbnailPath` | VARCHAR(500) | NULLABLE | Thumbnail אופציונלי |
| `version` | INTEGER | NOT NULL, ברירת מחדל 1 | גדל בכל עדכון תוכן |
| `categoryId` | UUID | NULLABLE, FK → Category.id, ON DELETE SET NULL | קטגוריית ספרייה יחידה; `NULL` = לא מסווג |
| `interestIds` | UUID[] | NOT NULL, ברירת מחדל `{}` | אפס או יותר UUIDs של תחומי עניין; נבדקים בשכבת השירות |
| `createdAt` | TIMESTAMP | NOT NULL, אוטומטי | זמן העלאה ראשון |
| `updatedAt` | TIMESTAMP | NOT NULL, אוטומטי | זמן עדכון אחרון |

**אינדקסים:**
- `idx_content_type` על `type`
- `idx_content_updated` על `updatedAt`
- `idx_content_category` על `categoryId`
- `idx_content_interest_ids` כאינדקס GIN על `interestIds`
- `idx_content_search` על `title, description` (`ILIKE` או `tsvector`)

**הערות:**
- `interestIds` עובר dedupe ונרמול בשכבת השירות לפני שמירה.
- כלל הנרמול ב-MVP: המרה לייצוג UUID קנוני, הסרת כפילויות, ואז מיון עולה לצורכי השוואה יציבה.

---

### 6.2 Category (שרת)

צומת בהיררכיה דו-רמתית לארגון תוכן בספרייה.

| שדה | סוג | אילוצים | הערות |
|-----|-----|---------|-------|
| `id` | UUID | PK, נוצר אוטומטית | |
| `name` | VARCHAR(100) | NOT NULL, ייחודי בין אחים | שם תצוגה |
| `parentId` | UUID | NULLABLE, FK → Category.id | `NULL` = קטגוריית שורש |
| `sortOrder` | INTEGER | NOT NULL, ברירת מחדל 0 | סדר תצוגה |
| `createdAt` | TIMESTAMP | NOT NULL, אוטומטי | |
| `updatedAt` | TIMESTAMP | NOT NULL, אוטומטי | |

**אילוצים:**
- עומק מקסימלי 2 נאכף בלוגיקת האפליקציה: `parentId` חייב להפנות לקטגוריית שורש
- מחיקת קטגוריה עם ילדים: הילדים נמחקים ב-cascade, וכל `content_items.category_id` מתאים נהיה `NULL`

**אינדקסים:**
- `idx_category_parent` על `parentId`
- `idx_category_sort` על `parentId, sortOrder`

---

### 6.3 Interest (שרת)

תגית שטוחה לסינון פיד הרילס והספרייה. מנוהלת על ידי אדמין.

| שדה | סוג | אילוצים | הערות |
|-----|-----|---------|-------|
| `id` | UUID | PK, נוצר אוטומטית | |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | שם תצוגה |
| `createdAt` | TIMESTAMP | NOT NULL, אוטומטי | |

**הערות:**
- אין היררכיה — רשימה שטוחה
- אין קשר DB ישיר אל `content_items`; הקישור נשמר בתוך `content_items.interest_ids`
- מחיקת עניין מחייבת cleanup בשכבת השירות: להסיר את ה-UUID מכל מערכי `interest_ids` ורק אז למחוק את השורה בטבלת `interests`

---

### 6.4 DeviceProfile (קצה — IndexedDB)

תצורת מכשיר מקומית. רשומה אחת לכל מכשיר.

| שדה | סוג | הערות |
|-----|-----|-------|
| `deviceId` | string | UUID אוטומטי בפתיחה ראשונה |
| `selectedInterestIds` | string[] | מערך UUIDs של תחומי עניין שנבחרו |
| `createdAt` | ISO timestamp | זמן הגדרה ראשוני |
| `updatedAt` | ISO timestamp | זמן שינוי אחרון |

**אחסון:** רשומה יחידה ב-object store בשם `deviceProfile`.

**הערת המשך:** בעת הוספת אימות, אפשר להחליף או לקשר את `deviceId` ל-`userId`.

---

### 6.5 CachedCatalog (קצה — IndexedDB)

Snapshot של קטלוג השרת, הנשמר מקומית לצורך גלישה אופליין.

| שדה | סוג | הערות |
|-----|-----|-------|
| `items` | ContentItemDTO[] | רשימת מטה-דאטה מלאה (ללא קבצים בינאריים) |
| `categories` | CategoryDTO[] | עץ קטגוריות מלא |
| `interests` | InterestDTO[] | רשימת תחומי עניין מלאה |
| `lastSyncedAt` | ISO timestamp | זמן הסנכרון האחרון |

**אחסון:** רשומה יחידה ב-object store בשם `catalogCache`. מוחלפת בשלמותה בכל סנכרון.

**צורות DTO** (מסורבלות ל-JSON עבור לקוח הקצה):

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

### 6.6 DownloadRecord (קצה — IndexedDB)

רשומת מטה-דאטה בלבד עבור תוכן שהמשתמש הוריד לשימוש אופליין. הקובץ עצמו נשמר ב-edge proxy, לא ב-Chrome.

| שדה | סוג | הערות |
|-----|-----|-------|
| `contentId` | string | הפניה לוגית ל-ContentItem.id |
| `title` | string | Snapshot של הכותרת בזמן ההורדה |
| `type` | 'video' \| 'pdf' | Snapshot של סוג התוכן |
| `fileSize` | number | גודל בבייטים |
| `downloadedAt` | ISO timestamp | זמן ההורדה |
| `version` | number | גרסה בזמן ההורדה |

**אחסון:** object store בשם `downloads`, ממופה לפי `contentId`.

**התנהגות מחיקה:** מחיקת DownloadRecord מסירה רק את המטה-דאטה מ-IndexedDB. קובץ המטמון עשוי להישאר בפרוקסי עד פינוי אוטומטי.

---

### 6.7 LocalAction (קצה — IndexedDB)

מעקב מקומי אחר Like/Save. אין סנכרון לשרת ב-MVP.

| שדה | סוג | הערות |
|-----|-----|-------|
| `contentId` | string | הפניה לוגית ל-ContentItem.id |
| `action` | 'like' \| 'save' | סוג פעולה |
| `active` | boolean | האם הפעולה פעילה כרגע |
| `timestamp` | ISO timestamp | זמן שינוי אחרון |

**אחסון:** object store בשם `localActions`, ממופה לפי `(contentId, action)`.

**הערת המשך:** בהמשך, רשומות אלו יוכלו להישלח לשרת יחד עם `deviceId`.

---

## 7. קשרים

| קשר | סוג | תיאור |
|-----|-----|-------|
| Category → Category | 1:N דרך `parentId` | קטגוריות שורש מחזיקות ילדים; עומק מקסימלי 2 |
| Category → ContentItem | 1:N דרך `categoryId` | קטגוריה יכולה להכיל פריטים רבים; פריט תוכן שייך לאפס או לקטגוריה אחת |
| ContentItem ↔ Interest | M:N לוגי דרך `interestIds[]` | פריט תוכן יכול לשאת כמה תחומי עניין; אותו עניין יכול להופיע על פריטים רבים |
| DeviceProfile → Interest | הפניה מקומית | `selectedInterestIds` מפנה ל-Interest UUIDs מתוך CachedCatalog |
| DownloadRecord → ContentItem | הפניה מקומית | `contentId` מפנה ל-ContentItem.id מתוך CachedCatalog |
| LocalAction → ContentItem | הפניה מקומית | `contentId` מפנה ל-ContentItem.id מתוך CachedCatalog |

**הערה:** הפניות בין הקצה לשרת הן לפי UUID, לא לפי FK. השלמות נשמרת דרך תהליך הסנכרון.

---

## 8. סיכום מאפיינים מרכזיים

### 8.1 צד שרת (PostgreSQL)

| ישות | שדות מפתח ל-MVP | שדות מפתח להמשך |
|------|-----------------|-----------------|
| ContentItem | id, title, description, type, filePath, fileSize, mimeType, version, categoryId, interestIds, updatedAt | duration, thumbnailPath (בעתיד: viewCount, likeCount, userId) |
| Category | id, name, parentId, sortOrder | (בעתיד: description, iconUrl) |
| Interest | id, name | (בעתיד: description, sortOrder, color) |

### 8.2 צד קצה (IndexedDB)

| ישות | שדות מפתח ל-MVP | שדות מפתח להמשך |
|------|-----------------|-----------------|
| DeviceProfile | deviceId, selectedInterestIds | (בעתיד: userId, displayName) |
| CachedCatalog | items[], categories[], interests[], lastSyncedAt | (בעתיד: syncVersion) |
| DownloadRecord | contentId, title, type, fileSize, downloadedAt, version | (בעתיד: expiresAt) |
| LocalAction | contentId, action, active, timestamp | (בעתיד: synced, syncedAt) |

---

## 9. מחזורי חיים / שדות מצב

### 9.1 מחזור חיי תוכן

```
Upload (admin) → Created (version=1) → Updated (version++) → Deleted (hard delete)
```

| מצב | מה קורה |
|-----|---------|
| **Created** | הקובץ נשמר; הרשומה נוצרת; `version=1`; `createdAt` = `updatedAt` = עכשיו |
| **Updated** | הקובץ מוחלף; המטה-דאטה מתעדכן; `version++`; `updatedAt` = עכשיו |
| **Deleted** | הרשומה נמחקת; הקובץ נמחק; שיוכי קטגוריה/תחומי עניין נעלמים יחד עם השורה |

אין מצב draft/publish ב-MVP — העלאה = פרסום.

### 9.2 מחזור חיי הורדה (קצה)

```
Not Downloaded → Downloading → Downloaded → Deleted
```

| מצב | אחסון |
|-----|-------|
| **Not Downloaded** | אין DownloadRecord; ייתכן שהקובץ כבר במטמון הפרוקסי |
| **Downloading** | התקדמות בזיכרון; ה-SPA מושך את כל הקובץ דרך הפרוקסי |
| **Downloaded** | DownloadRecord ב-IndexedDB; הקובץ במטמון הפרוקסי |
| **Deleted** | DownloadRecord נמחק; ייתכן שהקובץ יישאר זמנית במטמון הפרוקסי |

### 9.3 לוגיקת תג "Updated"

לקוח הקצה משווה בין `DownloadRecord.version` לבין `CachedCatalog.items[].version`. אם הגרסה בקטלוג גבוהה יותר — מוצג תג "updated". ב-MVP התג מוצג רק עבור פריטים שהורדו.

---

## 10. התמדה בצד השרת

### 10.1 סקמת PostgreSQL

| טבלה | כמות שורות בדמו | דפוס גידול |
|------|------------------|------------|
| `content_items` | 15 | גדלה עם העלאות |
| `categories` | ~8–12 | גדילה איטית |
| `interests` | ~5–8 | גדילה איטית |

### 10.2 מוסכמות שמות

- שמות טבלאות: `snake_case`, ברבים
- שמות עמודות: `snake_case`
- שמות מודלים ב-Python: `PascalCase`
- שמות JSON/API: `camelCase`

### 10.3 אחסון קבצים בינאריים

קבצי MP4, PDF ו-thumbnail **אינם** נשמרים ב-PostgreSQL. הם נשמרים במערכת הקבצים של השרת:

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

`filePath` ו-`thumbnailPath` מצביעים על נתיבים אלו.

---

## 11. התמדה בדפדפן המקומי

### 11.1 IndexedDB stores

| Store | מפתח | סוג ערך | רשומות |
|-------|------|---------|--------|
| `deviceProfile` | `'default'` | DeviceProfile | 1 |
| `catalogCache` | `'current'` | CachedCatalog | 1 |
| `downloads` | `contentId` | DownloadRecord | 0–15+ |
| `localActions` | `[contentId, action]` | LocalAction | 0–30+ |

### 11.2 מטמון edge proxy

| תוכן מטומן | מפתח מטמון | גודל טיפוסי | פינוי |
|------------|------------|-------------|-------|
| קבצי תוכן | `/api/content/{id}/file?v={version}` | 1–100 MB | 30 יום חוסר שימוש |
| Thumbnails | `/api/content/{id}/thumbnail` | 10–200 KB | 30 יום |
| מטה-דאטה של קטלוג | `/api/catalog` | <10 KB | 5 דקות |
| קבצי SPA | מתוך Docker image | ~5–10 MB | לא מפונה |

### 11.3 צפי גדלים

| Store | גודל טיפוסי לרשומה | סה"כ ל-15 פריטים |
|-------|--------------------|------------------|
| IndexedDB | <1 KB לרשומה | <50 KB |
| Proxy cache | 1–100 MB לקובץ | 15–1500 MB |
| מטמון thumbnails | 10–200 KB לתמונה | <3 MB |
| SPA bundle | ~5–10 MB | ~5–10 MB |

---

## 12. אילוצים ואינווריאנטים

### 12.1 צד שרת

| אילוץ | אכיפה | הערות |
|-------|-------|-------|
| ContentItem.id ייחודי | PK (DB) | UUID אוטומטי |
| ContentItem.type ∈ {'video', 'pdf'} | ENUM + API validation | |
| ContentItem.categoryId מפנה לקטגוריה תקפה או `NULL` | FK (DB) | `ON DELETE SET NULL` |
| ContentItem.interestIds מכיל רק UUIDs קיימים | לוגיקת אפליקציה | אין FK טבעי לתוך `UUID[]` |
| ContentItem.interestIds מנוקה מכפילויות וממויין | לוגיקת אפליקציה | מיון עולה אחרי dedupe |
| עומק קטגוריות = 2 | לוגיקת אפליקציה | `parentId` חייב להצביע על שורש |
| Category.name ייחודי בין אחים | UNIQUE + לוגיקת אפליקציה | |
| Interest.name ייחודי גלובלית | UNIQUE | |
| קובץ העלאה הוא MP4 או PDF בלבד | API validation | |
| גודל קובץ ≤ 100 MB | API validation | |
| וידאו ≤ 180 שניות | API validation | soft constraint |

### 12.2 צד קצה

| אילוץ | אכיפה | הערות |
|-------|-------|-------|
| DeviceProfile יחיד למכשיר | Singleton key | |
| Snapshot קטלוג יחיד | Singleton key | מוחלף בשלמותו |
| DownloadRecord ייחודי לפי contentId | Key ב-IndexedDB | |
| LocalAction ייחודי לפי `(contentId, action)` | Composite key | |

---

## 13. שיקולי שליפה / Query

### 13.1 שאילתות שרת עיקריות

| שאילתה | שימוש | מימוש |
|--------|-------|-------|
| קטלוג מלא | סנכרון מטה-דאטה | `SELECT` על `content_items`, `categories`, `interests` ללא join tables |
| חיפוש לפי כותרת/תיאור | חיפוש ספרייה | `ILIKE '%term%'` |
| סינון `type='video'` | פיד רילס | WHERE על `type` |
| סינון לפי תחומי עניין | סינון פיד | `interest_ids && ARRAY[...]::uuid[]` |
| סינון לפי קטגוריה | ספרייה | `WHERE category_id = ...` |
| פריטים לא מסווגים | ספרייה / QA | `WHERE category_id IS NULL` |
| עץ קטגוריות | ספרייה | `SELECT` על כל הקטגוריות ובניית עץ באפליקציה |
| רשימת תוכן לאדמין | פורטל אדמין | `SELECT` עם sort/filter |

### 13.2 שאילתות קצה עיקריות

| שאילתה | שימוש | מימוש |
|--------|-------|-------|
| קבלת תחומי העניין של המכשיר | סינון פיד | קריאת DeviceProfile |
| קבלת הקטלוג המטמון | ספרייה, רילס, חיפוש | קריאת CachedCatalog |
| כל ההורדות | לשונית Downloads | קריאת כל DownloadRecord |
| בדיקת סטטוס הורדה | מצב כפתור | קריאת DownloadRecord לפי `contentId` |
| מצב Like/Save | מצב כפתור | קריאת LocalAction לפי `(contentId, action)` |

### 13.3 הערות ביצועים

- **שרת:** עם ~15 פריטים כל השאילתות מהירות מאוד. אין צורך ב-pagination ב-MVP.
- **שרת / interests:** אינדקס GIN על `interest_ids` מספק מספיק ביצועים ל-MVP ולגידול ראשוני.
- **קצה:** כל הסינון קורה בזיכרון ב-JavaScript על Blob יחיד של הקטלוג.

---

## 14. חלופות שנשקלו / נדחו בכוונה

| חלופה | למה נדחתה |
|-------|------------|
| **ContentAsset נפרד** | ה-MVP הוא קובץ אחד לפריט |
| **טבלת User** | אין זהות משתמש ב-MVP |
| **היסטוריית גרסאות** | מונה גרסה מספיק ל-MVP |
| **טבלאות junction ל-content-category/content-interest** | הוסרו במכוון כדי לפשט את ה-schema של ה-MVP |
| **JSONB עבור `interestIds`** | `UUID[]` מדויק יותר ובטוח טיפוסית |
| **Draft / Publish state** | העלאה = פרסום |
| **AnalyticsEvent** | אין אנליטיקה שרתית ב-MVP |
| **Full-text index `tsvector`** | `ILIKE` מספיק לקטלוג קטן |
| **Soft delete** | Hard delete מספיק |
| **Content expiry / TTL** | לא נדרש ב-MVP |

---

## 15. הנחות

| # | הנחה | השפעה אם לא נכונה |
|---|------|-------------------|
| DA1 | UUID מתאים כמפתח ראשי | השפעה קטנה ב-MVP |
| DA2 | Blob יחיד של CachedCatalog יעיל ל-~15 פריטים | נדרשים אינדקסים אם הקטלוג יגדל |
| DA3 | Hard delete מתקבל ל-MVP | אובדן נתונים במקרה מחיקה שגויה |
| DA4 | קטגוריות ותחומי עניין עצמאיים | UX עלול להיות מבלבל אם יצפו למיפוי |
| DA5 | קטגוריה אחת לפריט מספיקה ל-MVP | אם יידרש שיוך מרובה — יהיה צורך להחזיר junction table |
| DA6 | `UUID[]` מתאים לשיוך תחומי עניין ב-MVP | אם השאילתות יסתבכו — נחזיר מודל מנורמל |
| DA7 | Thumbnail אופציונלי מספיק לדמו | המראה עלול להיות פחות polished |

---

## 16. סיכונים

| # | סיכון | סבירות | השפעה | מיתון |
|---|-------|--------|--------|-------|
| DR1 | רשומות הורדה יתייתמו אם תוכן נמחק בין סנכרונים | בינונית | נמוכה | ניקוי orphaned records בסנכרון |
| DR2 | מחיקת עניין דורשת cleanup אפליקטיבי על `interest_ids` | בינונית | בינונית | לבצע cleanup ומחיקה בטרנזקציה אחת |
| DR3 | בלבול בין קטגוריות לתחומי עניין | בינונית | בינונית | הנחיה ברורה בממשק האדמין |
| DR4 | סינון מערכי interests פחות אינטואיטיבי למפתחים מטבלאות junction | בינונית | נמוכה | לתעד את Query pattern בצורה ברורה |
| DR5 | ניהול thumbnails מוסיף מורכבות | נמוכה | נמוכה | להשאיר אופציונלי |
| DR6 | התנגשות UUID | זניחה | גבוהה | שימוש ב-uuid4 / crypto.randomUUID |

---

## 17. שאלות פתוחות / החלטות ממתינות

| # | שאלה | משפיע על | ברירת מחדל מומלצת | דדליין |
|---|------|----------|-------------------|--------|
| DQ1 | האם thumbnails יישמרו ב-`./data/content/` או `./data/thumbnails/`? | ארגון קבצים | ספריה נפרדת `./data/thumbnails/` | לפני מימוש |
| DQ2 | האם אדמין יכול להעלות תוכן בלי קטגוריה? | שלמות נתונים | כן; יוצג כ-Uncategorized | לפני מימוש |
| DQ3 | מתי נכון להחזיר מודל interests מנורמל עם junction table? | ארכיטקטורת המשך | רק אם נדרש metadata על הקשר או scale גדול יותר | אחרי ה-MVP |

---

## 18. מנופי צמצום (De-scope)

| עדיפות | פישוט | השפעה |
|--------|--------|-------|
| 1 | להסיר thumbnails | חוסך העלאה/אחסון/הגשה |
| 2 | להסיר LocalAction | להסיר Like/Save |
| 3 | להפוך interests לרשימת seed קבועה | להסיר CRUD של interests |
| 4 | לזרוע categories קבועות ולהסיר CRUD | להשאיר `categoryId` אבל בלי ניהול עץ באדמין |
| 5 | להסיר CachedCatalog | ספרייה ורילס יעבדו רק אונליין |

---

## 19. הערות המשך

- **v0.4 (2026-04-23):** סכמת השרת פושטה ל-3 טבלאות. `categoryId` כעת יחיד; `interestIds` הוא `UUID[]`.
- **ישות משתמש:** בעת הוספת auth, ליצור `users` ולקשר ל-`content_items`.
- **מונה צפיות/לייקים:** להוסיף `viewCount` ו-`likeCount` ל-`content_items`.
- **טבלת גרסאות תוכן:** להוסיף `content_versions`.
- **אירועי אנליטיקה:** להוסיף `analytics_events`.
- **Soft delete:** להוסיף `deletedAt`.
- **Delta sync:** להוסיף `syncVersion` וטבלת `sync_state`.
- **Normalized interests (future):** אם יידרש metadata עשיר על שיוך תחומי עניין, להחליף את `interest_ids` בטבלת שיוכים מנורמלת ייעודית.
- **Multi-tenancy:** להוסיף `tenantId`.
- **Full-text search:** להוסיף `tsvector` ו-GIN.

---

*זהו המסמך החמישי בסט המסמכים של TactiTok. ממשיכים ל-`product/06_api-contract.md`.*
