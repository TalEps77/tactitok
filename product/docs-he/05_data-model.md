<!-- RTL -->
# מודל נתונים — TactiTok

> **גרסה:** 0.2
> **סטטוס:** טיוטה
> **עדכון אחרון:** 2026-03-07
> **מסמך קודם:** `product/04_system-architecture.md`
> **מסמך הבא:** `product/06_api-contract.md`
> **יומן שינויים:** v0.2 — יושר עם ארכיטקטורה v0.2 (טופולוגיית פרוקסי קצה): הוסרו התייחסויות Cache API / Service Worker; DownloadRecord פושט; שמירת תוכן במטמון מטופלת כעת על ידי פרוקסי קצה.

---

## 1. מטרת מסמך זה

מסמך זה מגדיר את מודל הנתונים המינימלי ל-MVP. הוא עונה על:

- מהן ישויות הדומיין המרכזיות
- אילו מטה-נתונים נדרשים לפריטי תוכן
- כיצד קטגוריות, עניינים ותוכן קשורים
- איזה מצב נשמר בצד-שרת לעומת מקומי-דפדפן
- אילו אילוצי תקינות חשובים ל-MVP
- אילו חלקי המודל נדחים בכוונה

כל מסמך נגזר (חוזה API → תכנית משלוח) חייב להיות עקבי עם מודל זה.

---

## 2. יעדי מודל נתונים

| # | יעד | נימוק |
|---|-----|-------|
| DG1 | **מספר ישויות מינימלי** | 3 מפתחים, 10 שבועות; כל טבלה חייבת להרוויח את מקומה |
| DG2 | **טיפוסים משותפים** | שרת ולקוח משתפים טיפוסי TypeScript מ-`packages/shared` |
| DG3 | **מוכן-להמשך** | שדות לתכונות עתידיות (user-id, view-count) כלולים אך nullable/לא-בשימוש ב-MVP |
| DG4 | **הפרדה נקייה** | מתמידות בצד-שרת (PostgreSQL) לעומת מטמון פרוקסי קצה (nginx) לעומת מצב מקומי-דפדפן (IndexedDB) מוגדרת בבירור |
| DG5 | **schema מבוסס-migration** | כל שינוי הוא migration בגרסה; ללא ALTER TABLE אד-הוק |

---

## 3. הגדרות / מונחים

| מונח | הגדרה |
|------|-------|
| **ישות שרת** | רשומה שנשמרת ב-PostgreSQL על VM הענן |
| **ישות מקומית** | רשומה שנשמרת ב-IndexedDB על דפדפן מכשיר הקצה |
| **פריט תוכן** | חתיכת תוכן הדרכה בודדת (וידאו או PDF) עם מטה-נתונים |
| **קובץ תוכן** | נכס בינארי (קובץ MP4 או PDF) נשמר במערכת קבצים השרת |
| **קטגוריה** | צומת בהיררכיה 2-רמתית לארגון תוכן בספרייה |
| **עניין** | תג שטוח לסינון פיד ריילס וספרייה; מנוהל על ידי אדמין |
| **פרופיל מכשיר** | תצורה מקומית-בלבד (עניינים שנבחרו); ללא זהות שרת |
| **רשומת הורדה** | רשומת מטה-נתונים מקומית-בלבד המעקבת אחר קובץ תוכן שהמשתמש הוריד במפורש לגישה אופליין (הקובץ עצמו שמור על ידי פרוקסי הקצה) |
| **טבלת קישור** | טבלת קשר רבים-לרבים (למשל, תוכן ↔ עניין) |

---

## 4. עקרונות מידול

1. **קובץ אחד לפריט תוכן** — לפריט תוכן יש בדיוק קובץ בינארי אחד (MP4 או PDF). ללא פריטים רב-קבצים ב-MVP.
2. **עניינים וקטגוריות עצמאיים** — לפריט תוכן יכול להיות כל שילוב של עניינים וקטגוריות. הם אינם מקושרים היררכית.
3. **השרת סמכותי** — כל נתוני הקטלוג חיים ב-PostgreSQL. הקצה שומר סנפשוט ב-IndexedDB.
4. **ללא זהות משתמש** — אין טבלת `User`. מצב קצה הוא device-scoped (IndexedDB), auth אדמין הוא סיסמה משותפת יחידה (ללא רשומת משתמש).
5. **מונה גרסאות, לא היסטוריית גרסאות** — עדכון תוכן מגדיל מונה ומחליף את הקובץ. גרסאות ישנות אינן נשמרות.
6. **תמונות ממוזערות אופציונליות** — אדמין עשוי להעלות תמונה ממוזערת; אם הושמט, הממשק מציג placeholder מבוסס-סוג.
7. **מחיקה רכה לא נדרשת** — MVP משתמש במחיקה קשיחה. מחיקת תוכן מסירה את הרשומה והקובץ.
8. **UUIDs למפתחות ראשיים** — מאפשר סנכרון עתידי רב-מקור ומונע דליפת sequential-id.

---

## 5. סקירת ישויות

### 5.1 דיאגרמת קשרי ישויות (טקסט)

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

### 5.2 ספירת ישויות

| מיקום | ישות | ספירה |
|-------|------|-------|
| שרת (PostgreSQL) | ContentItem, Category, Interest, ContentCategory, ContentInterest | 5 |
| קצה (IndexedDB) | DeviceProfile, CachedCatalog, DownloadRecord, LocalAction | 4 |
| **סך הכל** | | **9** |

---

## 6. ישויות מרכזיות

### 6.1 ContentItem (שרת)

הישות המרכזית המייצגת חתיכת תוכן הדרכה.

| שדה | סוג | אילוצים | הערות |
|-----|-----|---------|-------|
| `id` | UUID | PK, נוצר אוטומטית | מזהה יציב בסנכרון |
| `title` | VARCHAR(255) | NOT NULL | מוצג בפיד, ספרייה, הורדות |
| `description` | TEXT | NOT NULL, ברירת מחדל '' | ניתן-לחיפוש; מוצג ב-overlay/פרטים |
| `type` | ENUM('video','pdf') | NOT NULL | קובע מציג וזכאות לפיד |
| `filename` | VARCHAR(255) | NOT NULL | שם קובץ ההעלאה המקורי (לתצוגה) |
| `filePath` | VARCHAR(500) | NOT NULL | נתיב בצד שרת: `./data/content/{id}.{ext}` |
| `fileSize` | BIGINT | NOT NULL | בתים; משמש בממשק הורדות ומגבלה עתידית |
| `mimeType` | VARCHAR(100) | NOT NULL | `video/mp4` או `application/pdf` |
| `duration` | INTEGER | NULLABLE | שניות; לוידאו בלבד; NULL ל-PDF |
| `thumbnailPath` | VARCHAR(500) | NULLABLE | תמונה ממוזערת שהועלתה על ידי אדמין; NULL = placeholder |
| `version` | INTEGER | NOT NULL, ברירת מחדל 1 | מוגדל בעדכון תוכן; מניע תג "עודכן" |
| `createdAt` | TIMESTAMP | NOT NULL, אוטומטי | זמן העלאה ראשון |
| `updatedAt` | TIMESTAMP | NOT NULL, אוטומטי | זמן שינוי אחרון; משמש לסנכרון ותג "עודכן" |

**אינדקסים:**
- `idx_content_type` על `type` (סינון וידאו לפיד ריילס)
- `idx_content_updated` על `updatedAt` (סדר סנכרון)
- טקסט מלא: `idx_content_search` על `title, description` (PostgreSQL `tsvector` או `ILIKE`)

---

### 6.2 Category (שרת)

צומת בהיררכיה 2-רמתית לארגון תוכן ספרייה.

| שדה | סוג | אילוצים | הערות |
|-----|-----|---------|-------|
| `id` | UUID | PK, נוצר אוטומטית | |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE בין אחים | שם תצוגה |
| `parentId` | UUID | NULLABLE, FK → Category.id | NULL = רמה עליונה; non-NULL = ילד |
| `sortOrder` | INTEGER | NOT NULL, ברירת מחדל 0 | שולט בסדר תצוגה ברמה |
| `createdAt` | TIMESTAMP | NOT NULL, אוטומטי | |
| `updatedAt` | TIMESTAMP | NOT NULL, אוטומטי | |

**אילוצים:**
- עומק מקסימלי אכוף בלוגיקת אפליקציה (לא DB): `parentId` חייב להפנות לקטגוריה עליונה (כאשר `parentId IS NULL`)
- מחיקת קטגוריה עם ילדים: cascade delete ילדים, ניתוק תוכן (הסרת שורות junction)

**אינדקסים:**
- `idx_category_parent` על `parentId`
- `idx_category_sort` על `parentId, sortOrder`

---

### 6.3 Interest (שרת)

תג שטוח לסינון פיד ריילס וספרייה. מנוהל על ידי אדמין.

| שדה | סוג | אילוצים | הערות |
|-----|-----|---------|-------|
| `id` | UUID | PK, נוצר אוטומטית | |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | שם תצוגה; משמש בפרופיל מכשיר |
| `createdAt` | TIMESTAMP | NOT NULL, אוטומטי | |

**הערות:**
- ללא היררכיה — רשימה שטוחה
- מחיקת עניין: הסרת שורות junction (ContentInterest); פרופילי מכשיר קצה עם הפניות `selectedInterestIds` ישנות מנוקים בסנכרון הבא

---

### 6.4 ContentCategory (שרת — Junction)

רבים-לרבים: פריטי תוכן שייכים לקטגוריות.

| שדה | סוג | אילוצים | הערות |
|-----|-----|---------|-------|
| `contentId` | UUID | FK → ContentItem.id, ON DELETE CASCADE | |
| `categoryId` | UUID | FK → Category.id, ON DELETE CASCADE | |

**PK:** מורכב `(contentId, categoryId)`

---

### 6.5 ContentInterest (שרת — Junction)

רבים-לרבים: פריטי תוכן מתויגים בעניינים.

| שדה | סוג | אילוצים | הערות |
|-----|-----|---------|-------|
| `contentId` | UUID | FK → ContentItem.id, ON DELETE CASCADE | |
| `interestId` | UUID | FK → Interest.id, ON DELETE CASCADE | |

**PK:** מורכב `(contentId, interestId)`

---

### 6.6 DeviceProfile (קצה — IndexedDB)

תצורת מכשיר מקומית. רשומה אחת לכל מכשיר.

| שדה | סוג | הערות |
|-----|-----|-------|
| `deviceId` | string | UUID שנוצר אוטומטית בפתיחה ראשונה; יציב בין הפעלות |
| `selectedInterestIds` | string[] | מערך של UUIDs של Interest שנבחרו על ידי המשתמש |
| `createdAt` | ISO timestamp | הגדרה ראשונה |
| `updatedAt` | ISO timestamp | שינוי עניינים אחרון |

**אחסון:** רשומה יחידה ב-IndexedDB object store (`deviceProfile`).

**הערת המשך:** `deviceId` ניתן להחלפה מאוחר יותר ב-`userId` או לקישור אליו כשאימות יתווסף.

---

### 6.7 CachedCatalog (קצה — IndexedDB)

סנפשוט של קטלוג השרת, נשמר מקומית לעיון אופליין.

| שדה | סוג | הערות |
|-----|-----|-------|
| `items` | ContentItemDTO[] | רשימה מלאה של מטה-נתוני תוכן (ללא קבצים בינאריים) |
| `categories` | CategoryDTO[] | עץ קטגוריות מלא |
| `interests` | InterestDTO[] | רשימת עניינים מלאה |
| `lastSyncedAt` | ISO timestamp | מתי סנפשוט זה נמשך מהשרת |

**אחסון:** רשומה יחידה ב-IndexedDB object store (`catalogCache`). מוחלפת לחלוטין בכל סנכרון.

**צורות DTO** (טיפוסי TypeScript משותפים ב-`packages/shared`):

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

### 6.8 DownloadRecord (קצה — IndexedDB)

רשומת מטה-נתונים בלבד המעקבת אחר פריטי תוכן שהמשתמש הוריד במפורש לגישה אופליין. הקובץ בפועל שמור על ידי פרוקסי הקצה (nginx `proxy_cache`), לא על ידי Chrome.

| שדה | סוג | הערות |
|-----|-----|-------|
| `contentId` | string | הפניה דמוית-FK ל-ContentItem.id |
| `title` | string | סנפשוט כותרת בזמן ההורדה (לתצוגה אופליין) |
| `type` | 'video' \| 'pdf' | סנפשוט סוג |
| `fileSize` | number | בתים |
| `downloadedAt` | ISO timestamp | מתי הקובץ הורד |
| `version` | number | גרסה בזמן ההורדה; השוואה עם קטלוג לתג "עודכן" |

**אחסון:** IndexedDB object store (`downloads`), מפתח לפי `contentId`.

**מה השתנה (v0.2):** הוסרו שדות `cacheKey` ו-`mimeType`. הקובץ אינו עוד נשמר ב-Cache API של Chrome — הוא שמור על ידי פרוקסי הקצה. ה-DownloadRecord הוא כעת רשומת מטה-נתונים טהורה בשימוש ממשק לשונית הורדות. כשמשתמש מנגן פריט שהורד, ה-SPA מבקש את הקובץ מפרוקסי הקצה (localhost), שמגיש אותו ממטמונו.

**התנהגות מחיקה:** הסרת רשומת הורדה מסירה רק את מטה-נתוני IndexedDB. מטמון הפרוקסי עשוי עדיין להחזיק את הקובץ (מנוהל על ידי פינוי מטמון nginx, לא על ידי ה-SPA).

---

### 6.9 LocalAction (קצה — IndexedDB)

עוקב אחר פעולות לייק/שמירה מקומית. ללא סנכרון שרת ב-MVP.

| שדה | סוג | הערות |
|-----|-----|-------|
| `contentId` | string | הפניה דמוית-FK ל-ContentItem.id |
| `action` | 'like' \| 'save' | סוג פעולה |
| `active` | boolean | true = לייק/שמירה נוכחית; false = הוחלף |
| `timestamp` | ISO timestamp | זמן החלפה אחרון |

**אחסון:** IndexedDB object store (`localActions`), מפתח לפי מורכב `(contentId, action)`.

**הערת המשך:** כשזהות משתמש ואנליטיקה יתווספו, רשומות אלו ניתנות לסנכרון-אצווה לשרת תוך שימוש ב-`deviceId` + `contentId` + `timestamp`.

---

## 7. קשרים

| קשר | סוג | תיאור |
|-----|-----|-------|
| ContentItem ↔ Category | M:N דרך ContentCategory | פריט תוכן יכול לשייך לקטגוריות מרובות; קטגוריה יכולה להכיל פריטים רבים |
| ContentItem ↔ Interest | M:N דרך ContentInterest | פריט תוכן יכול להיות מתויג בעניינים מרובים; עניין יכול לתייג פריטים רבים |
| Category → Category (עצמי) | 1:N דרך parentId | קטגוריות עליונות יש להן ילדים; עומק מקסימלי 2 רמות |
| DeviceProfile → Interest | הפניה מקומית | `selectedInterestIds` מפנה ל-UUIDs של Interest מ-CachedCatalog |
| DownloadRecord → ContentItem | הפניה מקומית | `contentId` מפנה ל-ContentItem.id מ-CachedCatalog |
| LocalAction → ContentItem | הפניה מקומית | `contentId` מפנה ל-ContentItem.id מ-CachedCatalog |

**הערה:** הפניות חוצות-גבולות (קצה → שרת) הן לפי UUID, לא לפי foreign key. תקינות מתוחזקת על ידי תהליך הסנכרון: אם פריט תוכן בצד-שרת נמחק, הסנכרון הבא מסיר אותו מ-CachedCatalog; לקוח הקצה צריך לנקות DownloadRecords ו-LocalActions יתומים.

---

## 8. סיכום מאפיינים מרכזיים

### 8.1 בצד-שרת (PostgreSQL)

| ישות | שדות מרכזיים ל-MVP | שדות מרכזיים להמשך |
|------|------------------|-------------------|
| ContentItem | id, title, description, type, filePath, fileSize, mimeType, version, updatedAt | duration, thumbnailPath (עתידי: viewCount, likeCount, userId) |
| Category | id, name, parentId, sortOrder | (עתידי: description, iconUrl) |
| Interest | id, name | (עתידי: description, sortOrder) |

### 8.2 מקומי-דפדפן (IndexedDB)

| ישות | שדות מרכזיים ל-MVP | שדות מרכזיים להמשך |
|------|------------------|-------------------|
| DeviceProfile | deviceId, selectedInterestIds | (עתידי: userId, displayName) |
| CachedCatalog | items[], categories[], interests[], lastSyncedAt | (עתידי: syncVersion לסנכרון דלתא) |
| DownloadRecord | contentId, title, type, fileSize, downloadedAt, version | (עתידי: expiresAt לניהול מגבלה) |
| LocalAction | contentId, action, active, timestamp | (עתידי: synced flag, syncedAt) |

---

## 9. שדות מחזור חיים / מצב

### 9.1 מחזור חיים תוכן

```
העלאה (אדמין) → נוצר (version=1) → עודכן (version++) → נמחק (מחיקה קשיחה)
```

| מצב | מה קורה |
|-----|---------|
| **נוצר** | קובץ נשמר; רשומת מטה-נתונים מוכנסת; `version=1`; `createdAt` = `updatedAt` = עכשיו |
| **עודכן** | קובץ מוחלף; מטה-נתונים מעודכנים; `version++`; `updatedAt` = עכשיו |
| **נמחק** | רשומת מטה-נתונים נמחקת; קובץ נמחק ממערכת הקבצים; שורות junction cascade-deleted |

ללא הבחנה draft/publish ב-MVP — העלאה = פרסום מיידי.

### 9.2 מחזור חיים הורדה (קצה)

```
לא-הורד → בהורדה (בזיכרון) → הורד (שמור בפרוקסי) → נמחק (פעולת משתמש)
```

| מצב | אחסון |
|-----|-------|
| **לא-הורד** | ללא DownloadRecord; קובץ עשוי להיות או לא להיות במטמון פרוקסי (שמירה שקופה) |
| **בהורדה** | התקדמות בזיכרון; SPA שולף קובץ מלא מפרוקסי (מפעיל שמירת פרוקסי) |
| **הורד** | DownloadRecord ב-IndexedDB (מטה-נתונים בלבד); קובץ במטמון פרוקסי קצה |
| **נמחק** | DownloadRecord הוסר מ-IndexedDB; מטמון פרוקסי עשוי עדיין להחזיק קובץ (מנוהל על ידי פינוי nginx) |

**מה השתנה (v0.2):** מחזור חיים הורדה אינו עוד כולל Cache API של Chrome. הקובץ שמור על ידי פרוקסי הקצה באופן שקוף. ה-SPA מנהל רק את רשומת המטה-נתונים ב-IndexedDB.

### 9.3 לוגיקת תג "עודכן"

לקוח הקצה משווה `DownloadRecord.version` עם `CachedCatalog.items[].version`. אם גרסת הקטלוג גבוהה יותר, הפריט מציג תג "עודכן". זה חל גם על פריטים בספרייה (השוואת גרסת `CachedCatalog` הנוכחית עם הגרסה שהמשתמש ראה לאחרונה — אך לפשטות MVP, התג מוצג רק על פריטים שהורדו שבהם חוסר-התאמה בגרסה ברור).

---

## 10. מתמידות בצד-שרת

### 10.1 סקירת schema PostgreSQL

| טבלה | ספירת שורות (דמו) | דפוס גדילה |
|------|-----------------|------------|
| `content_items` | 15 | גדל עם העלאות; ~10–100 בייצור |
| `categories` | ~8–12 | גדילה איטית; מנוהל-אדמין |
| `interests` | ~5–8 | גדילה איטית; מנוהל-אדמין |
| `content_categories` | ~20–30 | פרופורציונלי לתוכן × קטגוריות |
| `content_interests` | ~20–30 | פרופורציונלי לתוכן × עניינים |

### 10.2 מוסכמות שמות

- שמות טבלאות: `snake_case`, רבים (`content_items`, `categories`)
- שמות עמודות: `snake_case` (`file_size`, `parent_id`, `created_at`)
- טיפוסי TypeScript: `PascalCase` (`ContentItem`, `Category`)
- Prisma/ORM ממפה בין מוסכמות אוטומטית

### 10.3 אחסון תוכן בינארי

קבצים בינאריים (MP4, PDF, תמונות ממוזערות אופציונליות) **אינם** נשמרים ב-PostgreSQL. הם נשמרים במערכת הקבצים של השרת:

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

השדות `filePath` ו-`thumbnailPath` ב-`content_items` מפנים לנתיבים אלו. הפשטת האחסון (`ContentFileService`) מתווכת את כל הגישות.

---

## 11. מתמידות מקומית-דפדפן

### 11.1 IndexedDB Stores

| שם store | מפתח | סוג ערך | רשומות |
|----------|------|---------|--------|
| `deviceProfile` | `'default'` (singleton) | אובייקט DeviceProfile | 1 |
| `catalogCache` | `'current'` (singleton) | אובייקט CachedCatalog | 1 |
| `downloads` | `contentId` | אובייקט DownloadRecord | 0–15+ |
| `localActions` | `[contentId, action]` | אובייקט LocalAction | 0–30+ |

### 11.2 מטמון פרוקסי קצה (nginx `proxy_cache`)

קבצי תוכן ותגובות API שמורים על ידי פרוקסי הקצה (nginx ב-Docker), לא על ידי Chrome.

| תוכן שמור | מפתח מטמון (אוטומטי) | גודל טיפוסי | פינוי |
|-----------|---------------------|------------|-------|
| קבצי תוכן (וידאו/PDF) | מבוסס-URL: `/api/content/{id}/file` | 1–100 MB לקובץ | 30 יום לא-פעיל |
| תמונות ממוזערות | מבוסס-URL: `/api/content/{id}/thumbnail` | 10–200 KB לתמונה | 30 יום לא-פעיל |
| מטה-נתוני קטלוג | מבוסס-URL: `/api/catalog` | <10 KB | תוקף 5 דקות |
| קבצים סטטיים SPA | לא רלוונטי — מוגש ישירות מתמונת Docker | ~5–10 MB סך הכל | אף פעם (חלק מהתמונה) |

**מה השתנה (v0.2):** Cache API של Chrome ו-Service Worker cache אינם בשימוש עוד. כל שמירת תוכן במטמון מטופלת על ידי `proxy_cache` של פרוקסי הקצה במערכת קבצים Linux VM. קבצי SPA הסטטיים ארוזים בתמונת Docker ומוגשים על ידי nginx ישירות.

### 11.3 ציפיות גדלים

| store | גודל טיפוסי לכניסה | סך הכל ל-15 פריטים |
|-------|-------------------|-------------------|
| IndexedDB (כל ה-stores) | <1 KB לרשומה | <50 KB |
| מטמון פרוקסי קצה (קבצי תוכן) | 1–100 MB לקובץ | 15–1500 MB |
| מטמון פרוקסי קצה (תמונות ממוזערות) | 10–200 KB לתמונה | <3 MB |
| חבילת SPA (בתמונת Docker) | ~5–10 MB סך הכל | ~5–10 MB |

---

## 12. אילוצים ואינווריאנטים

### 12.1 בצד-שרת

| אילוץ | אכיפה | הערות |
|-------|-------|-------|
| ContentItem.id הוא ייחודי | PK (מסד נתונים) | UUID נוצר אוטומטית |
| ContentItem.type ∈ {'video', 'pdf'} | ENUM (מסד נתונים) + אימות (API) | |
| עומק Category מקסימלי = 2 | לוגיקת אפליקציה | `parentId` חייב להפנות לשורה שבה `parentId IS NULL` |
| Category.name ייחודי בין אחים | לוגיקת אפליקציה + UNIQUE(parentId, name) | |
| Interest.name ייחודי גלובלית | אילוץ UNIQUE (מסד נתונים) | |
| ContentCategory: ללא זוגות כפולים | PK מורכב (מסד נתונים) | |
| ContentInterest: ללא זוגות כפולים | PK מורכב (מסד נתונים) | |
| העלאת קובץ: MP4 או PDF בלבד | אימות API | בדיקת MIME type + סיומת |
| העלאת קובץ: ≤100 MB | אימות API | קבוע ניתן-לתצורה |
| משך וידאו: ≤3 דקות (180 שניות) | אימות API (אם מיושם) | עדיפות "צריך"; לא חוסם קשיח |

### 12.2 מקומי-דפדפן

| אילוץ | אכיפה | הערות |
|-------|-------|-------|
| DeviceProfile אחד לכל מכשיר | מפתח singleton ב-IndexedDB | |
| סנפשוט CachedCatalog אחד | מפתח singleton ב-IndexedDB | החלפה מלאה בסנכרון |
| DownloadRecord.contentId הוא ייחודי | מפתח לפי contentId | לא ניתן להוריד אותו פריט פעמיים |
| LocalAction ייחודי לכל (contentId, action) | מפתח מורכב | החלף/כבה, לא צבור |

---

## 13. שיקולי Query / אחזור

### 13.1 Queries שרת מרכזיים

| Query | בשימוש על ידי | יישום |
|-------|--------------|-------|
| קבלת קטלוג מלא (כל פריטים + קטגוריות + עניינים) | סנכרון מטה-נתונים (קצה) | JOIN content_items עם content_categories, content_interests; כלול כל קטגוריות ועניינים |
| חיפוש תוכן לפי כותרת/תיאור | חיפוש ספרייה (קצה) | PostgreSQL `ILIKE '%term%'` על title + description; שדרוג ל-`tsvector` אם נדרש |
| סינון תוכן לפי type='video' | פיד ריילס (קצה) | WHERE clause על `type` |
| סינון תוכן לפי מזהי עניין | סינון פיד (קצה) | JOIN content_interests WHERE interest_id IN (...) |
| סינון תוכן לפי מזהה קטגוריה | עיון ספרייה (קצה) | JOIN content_categories WHERE category_id = ... |
| קבלת עץ קטגוריות | ספרייה (קצה) | SELECT כל קטגוריות; בניית עץ באפליקציה (מערכת נתונים קטנה) |
| רשימת תוכן אדמין | פורטל ניהול | SELECT עם מיון/סינון אופציונלי; עמוד אם >50 פריטים |

### 13.2 Queries קצה מרכזיים (IndexedDB)

| Query | בשימוש על ידי | יישום |
|-------|--------------|-------|
| קבלת עניינים מכשיר | סינון פיד, מסך עניינים | קריאת DeviceProfile singleton |
| קבלת קטלוג שמור | ספרייה, ריילס, חיפוש | קריאת CachedCatalog singleton; סינון/מיון ב-JS |
| קבלת כל הורדות | לשונית הורדות | קריאת כל כניסות DownloadRecord |
| בדיקה אם תוכן הורד | מצב כפתור הורדה | קבלת DownloadRecord לפי contentId |
| קבלת מצב לייק/שמירה לתוכן | מצב כפתורי ממשק | קבלת LocalAction לפי (contentId, action) |

### 13.3 הערות ביצועים

- **שרת:** עם ~15 פריטים, כל ה-queries מהירים טריוויאלית. ללא צורך ב-pagination ל-MVP. הוסף `LIMIT/OFFSET` ל-catalog API לגדילה עתידית.
- **קצה:** CachedCatalog הוא אובייקט JSON יחיד; כל הסינון (לפי עניין, קטגוריה, חיפוש) קורה בזיכרון ב-JavaScript. זה בסדר ל-~15 פריטים. ל-100+ פריטים, שקול אינדקסי IndexedDB.

---

## 14. חלופות שנשקלו או נדחו בכוונה

| חלופה | מדוע נדחתה |
|-------|-----------|
| **ישות ContentAsset נפרדת** (אחד-לרבים: פריט יש קבצים מרובים) | ה-MVP הוא קובץ אחד לפריט; אם נדרש רב-איכות או רב-פורמט, הוסף טבלת ContentAsset מאוחר יותר |
| **טבלת משתמש** | ללא זהות משתמש ב-MVP; פרופיל מכשיר מקומי-בלבד |
| **היסטוריית גרסאות תוכן** (שמירת קבצים ישנים) | MVP מחליף; מונה גרסאות מספיק; הוסף טבלת `content_versions` מאוחר יותר אם נדרש rollback |
| **ישות Tag** (נפרדת מ-Interest) | עניינים משמשים כמנגנון התיוג היחיד; אם נדרשות תגיות מפורטות יותר, הוסף טבלת Tag נפרדת |
| **PublishState / Draft** | MVP מפרסם מיידית בהעלאה; הוסף `status` ENUM ל-content_items אם נדרשת זרימת draft/review |
| **טבלת AnalyticsEvent** | ללא אנליטיקה בצד-שרת ב-MVP; הוסף טבלת event log כשזהות משתמש קיימת |
| **אינדקס חיפוש טקסט מלא** (tsvector) | `ILIKE` מספיק ל-~15 פריטים; שדרוג ל-tsvector ל-100+ פריטים |
| **מחיקה רכה** (flag isDeleted) | מחיקה קשיחה ב-MVP; הוסף מחיקה רכה אם נדרש trail ביקורת |
| **תפוגת תוכן / TTL** | ללא תפוגה אוטומטית; הוסף `expiresAt` ל-content_items אם נדרש ניהול מחזור חיים תוכן |

---

## 15. הנחות

| # | הנחה | השפעה אם שגויה |
|---|------|----------------|
| DA1 | UUIDs מקובלים כמפתחות ראשיים (ללא צורך ב-IDs רציפים) | שולי: כמה דפוסי query איטיים יותר עם UUIDs; אך מערכת הנתונים זעירה |
| DA2 | CachedCatalog JSON blob יחיד יעיל ל-~15 פריטים | נדרשים אינדקסי IndexedDB או pagination אם הקטלוג גדל ל-100+ |
| DA3 | מחיקה קשיחה מקובלת ל-MVP (ללא צורך בהתאוששות) | אובדן נתונים במחיקה בשוגג; אדמין חייב להעלות מחדש |
| DA4 | עניינים וקטגוריות עצמאיים (ללא מיפוי ביניהם) | אם משתמשים מצפים לעניינים שיתאימו לקטגוריות, UX עלול להיות מבלבל |
| DA5 | העלאת תמונה ממוזערת אופציונלית; placeholder מקובל | הדמו עלול להראות פחות מלוטש ללא תמונות ממוזערות |
| DA6 | ללא צורך בשדה `status` על פריטי תוכן (כולם מפורסמים מיידית) | אם נדרשת זרימת אישור, חייבים להוסיף status ENUM |

---

## 16. סיכונים

| # | סיכון | סבירות | השפעה | הפחתה |
|---|-------|---------|-------|-------|
| DR1 | רשומות הורדה יתומות אם שרת מוחק תוכן בין סנכרונים | בינונית | נמוכה | ניקוי לקוח קצה: בסנכרון, הסר DownloadRecords/LocalActions שבהם contentId לא בקטלוג |
| DR2 | CachedCatalog גדל גדול אם ספירת תוכן עולה משמעותית | נמוכה (MVP) | בינונית | עיצוב API לתמוך ב-pagination; מעבר לרשומות IndexedDB לפריט אם נדרש |
| DR3 | בלבול קשר עניין/קטגוריה — משתמשים מצפים שיהיו מקושרים | בינונית | בינונית | הנחיית ממשק אדמין ברורה; תיעוד ההבחנה; שקול קישור post-MVP |
| DR4 | ניהול תמונות ממוזערות מוסיף מורכבות העלאה | נמוכה | נמוכה | הפוך תמונה ממוזערת לאופציונלית; אדמין יכול לדלג; ממשק מציג placeholder מבוסס-סוג |
| DR5 | התנגשות יצירת UUID | זניחה | גבוהה | שימוש ב-crypto.randomUUID() — הסתברות התנגשות אפקטיבית אפס |

---

## 17. שאלות פתוחות / החלטות ממתינות

| # | שאלה | משפיעה על | ברירת מחדל מומלצת | מועד אחרון |
|---|------|-----------|-------------------|-----------|
| DQ1 | האם תג "עודכן" צריך להופיע על כל הפריטים בספרייה, או רק על פריטים שהורדו? | UX קצה, מורכבות לוגיקה | כל פריטים: השוואת גרסת `CachedCatalog` עם "גרסה שנראתה לאחרונה" ב-LocalAction; פשוט יותר: רק על הורדות שחוסר-התאמה בגרסה ברור | לפני יישום ממשק |
| DQ2 | האם תמונות ממוזערות צריכות להיות נשמרות באותה ספרייה `./data/content/` או נפרדת `./data/thumbnails/`? | ארגון קבצים | `./data/thumbnails/` נפרדת לבהירות | לפני יישום |
| DQ3 | האם האדמין צריך להיות מסוגל להקצות פריט תוכן לאפס קטגוריות? | תקינות נתונים | אפשר אפס (לא-מקוטלג); הצג בספרייה תחת "הכל" או "לא-מקוטלג" | לפני יישום |

---

## 18. מנופי צמצום היקף

| עדיפות | פישוט | השפעה |
|--------|-------|-------|
| 1 | השמטת תמונות ממוזערות לחלוטין (שימוש ב-placeholders מבוסס-סוג בלבד) | הסרת העלאה, אחסון והגשת תמונות ממוזערות; חיסכון ~2 ימים |
| 2 | השמטת ישות LocalAction (לייק/שמירה) | הסרת כפתורי לייק/שמירה מממשק; משתמשים מסתמכים על הורדות בלבד |
| 3 | הפיכת עניינים לרשימת seed קבועה (ללא CRUD אדמין) | הסרת InterestService admin API; עניינים הם seeds של מסד נתונים |
| 4 | השמטת junction ContentCategory (תוכן שייך לאפס או קטגוריה אחת דרך FK ישיר) | פישוט ל-1:N; אובדן הקצאת קטגוריה-מרובה |
| 5 | השמטת CachedCatalog (דרישת רשת לכל העיון) | הסרת מראה קטלוג IndexedDB; ספרייה/ריילס עובדים רק אונליין |

---

## 19. הערות להמשך

- **ישות משתמש:** כשauth מתווסף, צור טבלת `users` עם `id (UUID)`, `email`, `passwordHash`, `role`. קשר לתוכן דרך `createdBy` FK על `content_items`. החלף `deviceId` ב-DeviceProfile ב-`userId`.
- **ספירות צפייה/לייק (שרת):** הוסף עמודות `viewCount` ו-`likeCount` ל-`content_items`. אכלס דרך סנכרון-אצווה מרשומות LocalAction. השתמש למנוע המלצות עתידי.
- **טבלת גרסאות תוכן:** הוסף `content_versions` (id, contentId, version, filePath, createdAt) לשמירת הפניות קבצים ישנות. עדכון תוכן מכניס שורת גרסה חדשה במקום החלפה.
- **אירועי אנליטיקה:** הוסף `analytics_events` (id, deviceId/userId, contentId, eventType, timestamp) לעקיבה אחר צפיות, הורדות, לייקים ברמת שרת.
- **מחיקה רכה:** הוסף `deletedAt` TIMESTAMP NULLABLE ל-`content_items` ו-`categories`. סנן `WHERE deletedAt IS NULL` בכל ה-queries. הוסף תצוגת "אשפה" לאדמין.
- **סנכרון דלתא:** הוסף `syncVersion` (מונה מונוטוני) לטבלת `sync_state`. כל מוטציה מגדילה את המונה. הקצה שולח גרסה ידועה אחרונה; השרת מחזיר רק שינויים מאז.
- **ריבוי-שוכרים:** הוסף `tenantId` UUID ל-`content_items`, `categories`, `interests`. ה-MVP מגדיר לקבוע. עתידי: פרטציה של כל ה-queries לפי שוכר.
- **חיפוש טקסט מלא:** צור עמודת PostgreSQL `tsvector` על `content_items` עם אינדקס GIN. עדכן בהכנסה/עדכון דרך trigger. החלף queries `ILIKE`.

---

*מסמך זה הוא החמישי במערכת מסמכי TactiTok. המשך ל-`product/06_api-contract.md`.*
