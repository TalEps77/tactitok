<!-- RTL -->
# חוזה API — TactiTok

> **גרסה:** 0.2
> **סטטוס:** טיוטה
> **עדכון אחרון:** 2026-03-07
> **יומן שינויים:** v0.2 — נוסף endpoint ‏`GET /api/health` (תיקון N1); שונה URL קובץ תוכן לכלול `?v={version}` לביטול מטמון ה-proxy (תיקון N2); תוקנה הערת ETag (ETag מטפל במטמון הדפדפן בלבד, לא במטמון ה-proxy); עודכן מספר ה-endpoints ל-21.
> **מסמך קודם:** `product/05_data-model.md`
> **מסמך הבא:** `product/07_delivery-plan.md`

---

## 1. מטרת המסמך

מסמך זה מגדיר את חוזה ה-HTTP API של TactiTok MVP. הוא מפרט:

- את כל ה-endpoints, פורמטי הבקשות וצורות התגובות
- את מודל האימות
- את מעטפת השגיאות
- את התנהגות ה-HTTP caching וה-streaming
- את מה שמוחרג בכוונה מה-API של ה-MVP

מסמך זה הוא ההתייחסות המחייבת לצורך מימוש השרת ואינטגרציית הלקוח. סוגי TypeScript משותפים ב-`packages/shared` חייבים להתאים לכל DTO המוגדר כאן. אם קיימת סתירה בין מסמך זה לבין מסמך מודל הנתונים — יש להעלות שאלה פתוחה ולא לסטות בשקט.

---

## 2. עקרונות ה-API

| עיקרון | פרטים |
|--------|--------|
| **REST over JSON** | כל ה-endpoints מחזירים JSON (פרט ל-endpoints של קבצים בינאריים). שיטות HTTP וקודי סטטוס סטנדרטיים. |
| **פיצול ציבורי / ניהול** | שתי משטחי גישה: ציבורי (פונה למכשיר הקצה, ללא אימות) וניהול (מוגן בסיסמה). |
| **משיכת קטלוג מלא** | אין סנכרון דלתא ב-MVP. קטלוג מלא בכל בקשת סנכרון (כ-15 פריטים ≈ פחות מ-10 KB). |
| **תמיכה בבקשות Range** | ה-endpoints של קבצי תוכן תומכים ב-header ‏`Range` (HTTP 206) לצורך streaming וידאו הדרגתי. |
| **מעטפת שגיאות אחידה** | כל השגיאות מחזירות `{ "error": "...", "code": "..." }`. |
| **ללא גרסאות ב-URL** | נתיבי `/api/...` בלבד. ניתן להוסיף גרסאות כ-`/api/v2/...` בהמשך מבלי לשנות נתיבי ה-MVP. |
| **`?since` מתקבל, מתעלמים ממנו** | ‏`GET /api/catalog?since={ISO_timestamp}` מתקבל אך מחזיר קטלוג מלא ב-MVP. מאפשר סנכרון דלתא עתידי מבלי לשבור לקוחות. |

---

## 3. כתובות בסיס

| סביבה | כתובת בסיס |
|--------|------------|
| Edge SPA → Edge proxy (Chrome on Windows) | `http://localhost:8080` |
| Admin SPA → שרת ענן (מחשב מטה) | `https://{CLOUD_DOMAIN}` |
| Edge proxy → שרת ענן (פנימי) | `https://{CLOUD_DOMAIN}` |

ה-Edge SPA שולח **את כל** הבקשות אל `localhost:8080`. ה-edge proxy מטפל בניתוב לענן. ה-Admin SPA מתחבר ישירות לשרת הענן.

---

## 4. אימות

### 4.1 אימות ניהולי

ה-endpoints הניהוליים מוגנים בטוקן סשן שמונפק בעת ההתחברות.

| היבט | פרטים |
|------|--------|
| **התחברות** | `POST /api/admin/login` עם `{ password: string }` |
| **סוג טוקן** | JWT (stateless; אין צורך ב-session store בצד השרת) |
| **מסירת טוקן** | גוף התגובה: `{ token: string; expiresAt: string }` |
| **שימוש בטוקן** | Header ‏`Authorization: Bearer {token}` בכל הבקשות הניהוליות |
| **אחסון טוקן** | ה-Admin SPA שומר את הטוקן ב-`sessionStorage` (נמחק בסגירת הטאב) |
| **תפוגת טוקן** | 8 שעות (קבוע ניתן להגדרה בשרת) |
| **סיסמה יחידה** | סיסמת ניהול משותפת אחת; נשמרת כמשתנה סביבה בשרת; לא בקוד |

### 4.2 ‏Endpoints ציבוריים (קצה)

ה-endpoints הפונים לקצה (`/api/catalog`, `/api/content/:id/*`) **אינם דורשים אימות**. הם לקריאה בלבד ומסתמכים על בידוד רשת לצורך בקרת גישה (ה-edge proxy מנתב לענן בלבד; שרת הענן אינו ממוין ציבורית).

---

## 5. פורמט שגיאות

כל תגובות השגיאה (4xx, 5xx) משתמשות במעטפת JSON הבאה:

```json
{
  "error": "הודעת שגיאה קריאה לאדם",
  "code": "MACHINE_READABLE_CODE"
}
```

| קוד HTTP | מתי משתמשים |
|----------|-------------|
| `400 Bad Request` | כשל אימות (שדות חסרים, סוג קובץ לא תקין, הפרת אילוץ) |
| `401 Unauthorized` | טוקן אימות חסר או לא תקין ב-endpoint ניהולי |
| `404 Not Found` | המשאב אינו קיים |
| `409 Conflict` | משאב כפול (לדוג', שם עניין כבר קיים) |
| `413 Payload Too Large` | העלאה חורגת ממגבלת גודל הקובץ |
| `415 Unsupported Media Type` | סוג קובץ לא מורשה (לא MP4 או PDF) |
| `500 Internal Server Error` | שגיאת שרת בלתי צפויה |

---

## 6. API ציבורי (פונה לקצה, ללא אימות)

### 6.0 GET /api/health

מחזיר סטטוס שרת. משמש את ה-Edge SPA לאיתור האם שרת הענן נגיש דרך ה-edge proxy.

**משמש את:** Edge SPA (ספרינט 4 שבוע 8) לסקר נגישות ולהנעת מחוון אונליין/אופליין. תגובת `200` מוצלחת כאשר `X-Cache-Status` נעדר או `HIT` פירושה שה-proxy הגיע לענן. תגובת `STALE` או כשל פירושם שהענן אינו נגיש.

**בקשה:**

```
GET /api/health
```

**תגובה: 200 OK**

```json
{
  "status": "ok",
  "timestamp": "2026-03-07T10:00:00.000Z"
}
```

**תגובה: 500** — שגיאת שרת (נדיר; מציין שתהליך השרת פועל אך שבור פנימית).

**מטמון Edge proxy:**

```nginx
# ה-endpoint של בריאות אינו נשמר במטמון — חייב לשקף נגישות אמיתית לענן
proxy_cache off;
```

ה-edge proxy **אסור** שישמור תגובה זו במטמון. אם הענן אינו נגיש, הבקשה חייבת להיכשל (לא להחזיר תגובה ממטמון). כשל זה הוא האות שה-SPA משתמש בו לאיתור מצב אופליין.

---

### 6.1 GET /api/catalog

מחזיר תמונת מצב של הקטלוג המלא: כל פריטי התוכן עם מטה-נתונים, עץ הקטגוריות המלא, וכל העניינים.

**משמש את:** Edge SPA בפתיחת האפליקציה ובריענון ידני. ה-edge proxy שומר תגובה זו במטמון למשך 5 דקות.

**בקשה:**

```
GET /api/catalog
GET /api/catalog?since=2026-03-01T00:00:00.000Z   (מתקבל; מחזיר קטלוג מלא ב-MVP)
```

**תגובה: 200 OK**

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

**הערות שדות:**
- ‏`syncedAt` הוא חותמת הזמן של השרת ברגע יצירת התגובה.
- ‏`thumbnailUrl` הוא נתיב יחסי; ה-Edge SPA מוסיף את כתובת ה-proxy כבסיס. ‏`null` אם לא הועלתה תמונה ממוזערת.
- ‏`duration` בשניות; ‏`null` לקובצי PDF.
- פריטים מוחזרים לפי `updatedAt` יורד (החדשים ביותר ראשונים).
- כל המערכים עשויים להיות ריקים.

**תגובה: 500** — שגיאת מסד נתונים או שרת.

**מטמון Edge proxy:**

```nginx
proxy_cache_valid 200 5m;
proxy_cache_use_stale error timeout updating http_502 http_503 http_504;
proxy_ignore_headers Cache-Control;   # מטמן למרות no-store של השרת
```

*(השרת מגדיר `Cache-Control: no-store` למניעת מטמון דפדפן. ה-edge proxy מוגדר לשמור במטמון בכל זאת דרך `proxy_ignore_headers` עבור בלוק location ‏`/api/catalog` בלבד.)*

---

### 6.2 GET /api/content/:id/file

מחזיר קובץ תוכן בינארי גולמי (MP4 או PDF). תומך בבקשות HTTP range לצורך streaming וידאו הדרגתי וטעינה מוקדמת.

**משמש את:** Edge SPA להפעלת וידאו (`<video src="...">`), אחזור PDF, אתחול הורדה, וטעינה מוקדמת של ריילס.

**בקשה:**

```
GET /api/content/{id}/file?v={version}
Range: bytes=0-499999        (אופציונלי — עבור range/טעינה מוקדמת)
```

**הפרמטר `?v={version}` הוא חובה עבור בקשות Edge SPA.** ה-Edge SPA תמיד בונה את ה-URL בשימוש בשדה `version` מרשומת הקטלוג שבמטמון (לדוג', `?v=1`, `?v=2`). השרת מתעלם מפרמטר ה-`v` — קיומו נועד אך ורק לביטול מטמון ה-edge proxy כאשר התוכן מתעדכן. nginx כולל את מחרוזת השאילתה במפתח המטמון כברירת מחדל, כך שהגדלת גרסה מייצרת cache miss ומאלצת אחזור רענן.

**תגובה: 200 OK** (קובץ מלא, ללא header Range שנשלח)

```
Content-Type: video/mp4
Content-Length: 52428800
Accept-Ranges: bytes
Cache-Control: max-age=2592000, immutable
ETag: "1-{id}"
Content-Disposition: inline; filename="briefing.mp4"
```

**תגובה: 206 Partial Content** (בקשת range)

```
Content-Type: video/mp4
Content-Range: bytes 0-499999/52428800
Content-Length: 500000
Accept-Ranges: bytes
```

**תגובה: 404 Not Found** — פריט תוכן אינו קיים.

**הערות headers:**
- פורמט `ETag` הוא `"{version}-{id}"`. זה מטפל בבקשות מותנות ברמת הדפדפן (מטמון אלמנט `<video>` של Chrome). הוא **אינו** מבטל את רשומת `proxy_cache` של nginx, שמשתמשת ב-URL הבקשה כמפתח מטמון שלה.
- ביטול מטמון ברמת ה-proxy מטופל על ידי פרמטר `?v={version}`: כשאדמין מחליף קובץ (`version++`), סנכרון הקטלוג הבא מספק את הגרסה החדשה, ה-SPA בונה URL חדש (`?v=2`), וה-proxy רואה cache miss.
- ‏`Accept-Ranges: bytes` נדרש כדי שאלמנט `<video>` של Chrome יוכל לשלוח בקשות range.
- ‏`Cache-Control: max-age=2592000, immutable` = 30 יום; תואם לתוקף מטמון ה-edge proxy עבור URL+גרסה נתונים.
- ‏`Content-Disposition: inline` אומר ל-Chrome לרנדר (לא לשמור) את הקובץ.

**מטמון Edge proxy:**

```nginx
proxy_cache_valid 200 206 30d;
proxy_cache_use_stale error timeout updating http_502 http_503 http_504;
# nginx שומר במטמון לפי $scheme$proxy_host$request_uri (כולל מחרוזת שאילתה) כברירת מחדל
# פרמטר ?v={version} גורם ל-cache miss כאשר הגרסה משתנה — זה מכוון
```

---

### 6.3 GET /api/content/:id/thumbnail

מחזיר תמונה ממוזערת עבור פריט תוכן. מחזיר 404 אם לא הועלתה תמונה ממוזערת; ה-SPA מציג placeholder מבוסס-סוג במקרה זה.

**משמש את:** Edge SPA עבור תמונות ממוזערות של כרטיסי ספרייה וריילס.

**בקשה:**

```
GET /api/content/{id}/thumbnail
```

**תגובה: 200 OK**

```
Content-Type: image/jpeg
Content-Length: 102400
Cache-Control: max-age=2592000, immutable
ETag: "1-{id}-thumb"
```

**תגובה: 404 Not Found** — אין תמונה ממוזערת עבור פריט תוכן זה.

**מטמון Edge proxy:**

```nginx
proxy_cache_valid 200 30d;
```

---

## 7. API ניהולי (נדרש אימות)

כל ה-endpoints הניהוליים דורשים:

```
Authorization: Bearer {token}
```

טוקן חסר או לא תקין → `401 Unauthorized`.

---

### 7.1 אימות

#### POST /api/admin/login

**בקשה:** `Content-Type: application/json`

```json
{
  "password": "string"
}
```

**תגובה: 200 OK**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-03-07T18:00:00.000Z"
}
```

**תגובה: 401 Unauthorized** — סיסמה שגויה. גוף: `{ "error": "Invalid password" }`.

---

#### POST /api/admin/logout

מנקה את הטוקן בצד הלקוח. JWT stateless פירושו שאין לשרת סשן לבטל; endpoint זה הוא no-op בשרת אך נכלל לצורך עקביות ה-API וביטול סשן עתידי.

**בקשה:** ללא גוף.

**תגובה: 204 No Content**

---

### 7.2 תוכן

#### GET /api/admin/content

מחזיר את כל פריטי התוכן. ממוין לפי `createdAt` יורד.

**תגובה: 200 OK**

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

*(אותה צורת `ContentItemDTO` כמו פריטי קטלוג.)*

---

#### POST /api/admin/content

העלאת פריט תוכן חדש. קובץ ומטה-נתונים מוגשים יחד כ-`multipart/form-data`.

**בקשה:** `Content-Type: multipart/form-data`

| שדה | סוג | נדרש | אילוצים |
|-----|-----|-------|---------|
| `file` | בינארי | כן | MP4 או PDF; ≤ 100 MB |
| `title` | מחרוזת | כן | מקסימום 255 תווים; לא ריק |
| `description` | מחרוזת | לא | ברירת מחדל: `""` |
| `categoryIds` | מחרוזת (מערך JSON) | לא | מערך של category UUIDs; ברירת מחדל `[]` |
| `interestIds` | מחרוזת (מערך JSON) | לא | מערך של interest UUIDs; ברירת מחדל `[]` |

**תגובה: 201 Created** — `ContentItemDTO` מלא עבור הפריט שנוצר.

**שגיאות אימות (400):**
- ‏`file` חסר
- סוג MIME אינו `video/mp4` או `application/pdf`
- סיומת קובץ אינה תואמת לסוג MIME
- גודל קובץ > 100 MB
- ‏`title` חסר או ריק
- ‏`categoryIds` / `interestIds` מכילים UUIDs שאינם קיימים

**אימות ספציפי לוידאו:**
- משך > 180 שניות → `400` (אם ניתוח משך ממומש; יש להתייחס כאילוץ רך אם אינו מוכן בספרינט)

---

#### GET /api/admin/content/:id

מחזיר פריט תוכן יחיד לפי ID.

**תגובה: 200 OK** — `ContentItemDTO`.

**תגובה: 404 Not Found**

---

#### PUT /api/admin/content/:id

עדכון מטה-נתוני תוכן בלבד. אינו מחליף את הקובץ. כל השדות אופציונליים; רק שדות שסופקו מתעדכנים.

**בקשה:** `Content-Type: application/json`

```json
{
  "title": "string",
  "description": "string",
  "categoryIds": ["uuid"],
  "interestIds": ["uuid"]
}
```

**תגובה: 200 OK** — `ContentItemDTO` מעודכן.

**שגיאות אימות (400):**
- ‏`title` הוא מחרוזת ריקה (אם סופק)
- ‏`categoryIds` / `interestIds` מכילים UUIDs שאינם קיימים

**תגובה: 404 Not Found**

---

#### PUT /api/admin/content/:id/file

החלפת הקובץ הבינארי עבור פריט תוכן קיים. מגדיל את `version` ומעדכן את `updatedAt`. קובץ ההחלפה חייב להיות מאותו סוג תוכן כמו הפריט הקיים.

**בקשה:** `Content-Type: multipart/form-data`

| שדה | סוג | נדרש | אילוצים |
|-----|-----|-------|---------|
| `file` | בינארי | כן | חייב להתאים לסוג פריט קיים; ≤ 100 MB |

**תגובה: 200 OK**

```json
{
  "id": "uuid",
  "version": 2,
  "fileSize": 48234567,
  "updatedAt": "2026-03-07T12:00:00.000Z"
}
```

**שגיאות אימות (400):**
- קובץ חסר
- סוג MIME אינו תואם לסוג פריט קיים
- גודל קובץ > 100 MB

**תגובה: 404 Not Found**

---

#### PUT /api/admin/content/:id/thumbnail

העלאה או החלפה של תמונה ממוזערת עבור פריט תוכן.

**בקשה:** `Content-Type: multipart/form-data`

| שדה | סוג | נדרש | אילוצים |
|-----|-----|-------|---------|
| `thumbnail` | בינארי | כן | JPEG, PNG, או WebP; ≤ 5 MB |

**תגובה: 200 OK**

```json
{
  "id": "uuid",
  "thumbnailUrl": "/api/content/{id}/thumbnail",
  "updatedAt": "2026-03-07T12:00:00.000Z"
}
```

**שגיאות אימות (400):**
- קובץ חסר
- סוג MIME אינו `image/jpeg`, `image/png`, או `image/webp`
- גודל קובץ > 5 MB

**תגובה: 404 Not Found**

---

#### DELETE /api/admin/content/:id

מחיקת פריט תוכן. מחיקה קשה — מסיר את רשומת מסד הנתונים, את קובץ התוכן ממערכת הקבצים, ואת התמונה הממוזערת (אם קיימת). שורות junction ‏(`content_categories`, `content_interests`) נמחקות בcascade על ידי מסד הנתונים.

**תגובה: 204 No Content**

**תגובה: 404 Not Found**

---

### 7.3 קטגוריות

#### GET /api/admin/categories

מחזיר את כל הקטגוריות כרשימה שטוחה. הלקוח בונה את העץ מ-`parentId`.

**תגובה: 200 OK**

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

יצירת קטגוריה חדשה.

**בקשה:** `Content-Type: application/json`

```json
{
  "name": "string",
  "parentId": "uuid or null",
  "sortOrder": 0
}
```

**תגובה: 201 Created** — `CategoryAdminDTO` מלא.

**שגיאות אימות (400):**
- ‏`name` חסר או ריק
- ‏`parentId` מפנה לקטגוריה שאינה קיימת
- ‏`parentId` מפנה לקטגוריה ילד (יחרוג מעומק מקסימלי של 2 רמות)
- ‏`name` אינו ייחודי בין אחים (אותו `parentId`)

---

#### PUT /api/admin/categories/:id

עדכון קטגוריה. כל השדות אופציונליים.

**בקשה:** `Content-Type: application/json`

```json
{
  "name": "string",
  "parentId": "uuid or null",
  "sortOrder": 0
}
```

**תגובה: 200 OK** — `CategoryAdminDTO` מעודכן.

**שגיאות אימות (400):**
- שינוי הורה יחרוג מעומק מקסימלי של 2 רמות
- ‏`name` אינו ייחודי בין האחים החדשים

**תגובה: 404 Not Found**

---

#### DELETE /api/admin/categories/:id

מחיקת קטגוריה. **מוחק בcascade** את כל הקטגוריות הילד ומסיר את כל שורות junction ‏`content_categories` עבור הקטגוריה שנמחקה וילדיה. פריטי התוכן עצמם אינם נמחקים — הם הופכים לבלתי מסווגים.

**תגובה: 204 No Content**

**תגובה: 404 Not Found**

---

### 7.4 עניינים

#### GET /api/admin/interests

מחזיר את כל העניינים כרשימה שטוחה.

**תגובה: 200 OK**

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

יצירת עניין חדש.

**בקשה:** `Content-Type: application/json`

```json
{
  "name": "string"
}
```

**תגובה: 201 Created** — `InterestAdminDTO` מלא.

**שגיאות אימות (400):** ‏`name` חסר או ריק.

**תגובה: 409 Conflict** — השם כבר קיים (ייחודי גלובלית).

---

#### PUT /api/admin/interests/:id

שינוי שם עניין.

**בקשה:** `Content-Type: application/json`

```json
{
  "name": "string"
}
```

**תגובה: 200 OK** — `InterestAdminDTO` מעודכן.

**תגובה: 404 Not Found**

**תגובה: 409 Conflict** — השם החדש כבר קיים.

---

#### DELETE /api/admin/interests/:id

מחיקת עניין. מסיר את כל שורות junction ‏`content_interests`. פרופילי מכשיר קצה עם הפניות `selectedInterestIds` ישנות מנוקים על ידי ה-SPA בסנכרון הבא (מסנן IDs נעדרים מהקטלוג).

**תגובה: 204 No Content**

**תגובה: 404 Not Found**

---

## 8. סוגי TypeScript משותפים

מוגדרים ב-`packages/shared/src/types.ts`. משמשים את כל החבילות. שרת ולקוח חייבים לייבא מכאן — אין הגדרות מחדש מקומיות.

```typescript
// ---- סוגי דומיין ----

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

// ---- קטלוג ----

export interface CatalogResponse {
  syncedAt: string;
  items: ContentItemDTO[];
  categories: CategoryDTO[];
  interests: InterestDTO[];
}

// ---- אימות ----

export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;             // ISO 8601
}

// ---- תגובות עדכון קובץ ----

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

// ---- שגיאות ----

export interface ApiError {
  error: string;
  code?: string;
}
```

---

## 9. סיכום מטמון HTTP

| Endpoint | `Cache-Control` של השרת | מטמון Edge proxy | הערות |
|----------|------------------------|-----------------|-------|
| `GET /api/health` | `no-store` | **לא נשמר במטמון** | חייב לשקף נגישות אמיתית לענן; `proxy_cache off` ב-edge proxy |
| `GET /api/catalog` | `no-store` | 5 דקות | ה-proxy עוקף דרך `proxy_ignore_headers Cache-Control` |
| `GET /api/content/:id/file?v={version}` | `max-age=2592000, immutable` | 30 יום לכל גרסה | מפתח מטמון כולל `?v=` — גרסה חדשה = cache miss = אחזור רענן |
| `GET /api/content/:id/thumbnail` | `max-age=2592000, immutable` | 30 יום | ETag כולל גרסה |
| כל ה-endpoints הניהוליים | `no-store` | לא נשמר במטמון | ל-Admin SPA יש רשת יציבה |

**הערת מטמון קטלוג:** השרת מגדיר `Cache-Control: no-store` כדי למנוע ממטמון Chrome לשמור את הקטלוג (ה-SPA מנהל עותק IndexedDB משלו). ה-edge proxy שומר במטמון בכל זאת תוך שימוש ב-`proxy_ignore_headers Cache-Control` עבור בלוק location ‏`/api/catalog` בלבד.

**ביטול מטמון קובץ תוכן:** כאשר אדמין מחליף קובץ תוכן (`version++`), ה-Edge SPA בונה URL חדש (`?v={new_version}`) מהקטלוג המעודכן. ה-proxy רואה cache miss עבור ה-URL החדש ומביא את הקובץ הרענן. הרשומה הישנה במטמון (`?v={old_version}`) כבר אינה מבוקשת ופגה באופן טבעי לאחר 30 יום. אין צורך בניקוי מטמון ידני.

---

## 10. התנהגות סנכרון ואופליין

### 10.1 הפעלת סנכרון

סנכרון מטה-נתונים מאותחל על ידי ה-Edge SPA בשני מקרים:
1. **בפתיחת האפליקציה** — ה-SPA מביא `GET /api/catalog` מיד לאחר הטעינה.
2. **ריענון ידני** — המשתמש מקיש על כפתור הריענון בממשק.

אין סנכרון ברקע או תקופתי ב-MVP.

### 10.2 זרימת סנכרון

```
Edge SPA → GET /api/catalog → localhost:8080 (edge proxy)

  Cache HIT (< 5 דקות): הגשת תגובה ממטמון מיידית
  Cache MISS או STALE: העברה לענן → שמירה במטמון → החזרה
  ענן לא נגיש: הגשת תגובה ישנה (proxy_cache_use_stale)

Edge SPA מקבל CatalogResponse:
  → החלפת singleton CachedCatalog ב-IndexedDB
  → עדכון חותמת "סונכרן לאחרונה" בממשק
  → הסרת DownloadRecords / LocalActions יתומים (contentId לא בקטלוג)
  → עיבוד מחדש של הפיד והספרייה מנתוני קטלוג חדשים
```

### 10.3 איתור עדכון תוכן (תג "מעודכן")

בסנכרון, ה-Edge SPA משווה את `DownloadRecord.version` עם `CatalogResponse.items[].version` עבור כל פריט שהורד. אם `catalog.version > downloadRecord.version`, הפריט מציג תג "מעודכן" בטאב ההורדות.

### 10.4 ניקוי עזובים

לאחר סנכרון קטלוג מוצלח, ה-Edge SPA חייב:
1. להסיר רשומות `DownloadRecord` שה-`contentId` שלהן אינו עוד בקטלוג.
2. להסיר רשומות `LocalAction` שה-`contentId` שלהן אינו עוד בקטלוג.
3. להסיר IDs של עניינים ישנים מ-`DeviceProfile.selectedInterestIds` שאינם עוד קיימים בקטלוג.

---

## 11. אילוצי העלאת קבצים

| אילוץ | ערך | אכיפה |
|-------|-----|-------|
| גודל קובץ תוכן מקסימלי | 100 MB | הגדרת Multer בשרת + בדיקה מקדימה בצד הלקוח |
| MIME וידאו מורשה | `video/mp4` | שרת: בדיקת סוג MIME + בדיקת magic bytes |
| MIME מסמך מורשה | `application/pdf` | שרת: בדיקת סוג MIME + בדיקת magic bytes |
| משך וידאו מקסימלי | 180 ש' (3 דקות) | שרת: אילוץ רך (לאמת אם ניתן לביצוע בספרינט) |
| גודל תמונה ממוזערת מקסימלי | 5 MB | שרת: הגדרת Multer + בדיקה מקדימה בצד הלקוח |
| MIME מורשים לתמונה ממוזערת | `image/jpeg`, `image/png`, `image/webp` | שרת: בדיקת סוג MIME + בדיקת סיומת |

**גישת אימות MIME:** יש לבדוק גם את header ה-`Content-Type` מהלקוח וגם את magic bytes של הקובץ תוך שימוש בספרייה כמו `file-type`. בדיקת magic bytes היא הבדיקה הסמכותית — סוג ה-MIME שהלקוח מספק לבדו אינו מספיק.

---

## 12. סיכום עיון ב-Endpoints

| שיטה | נתיב | אימות | תיאור |
|------|------|-------|-------|
| `GET` | `/api/health` | ללא | בדיקת תקינות / נגישות שרת |
| `GET` | `/api/catalog` | ללא | סנכרון קטלוג מלא |
| `GET` | `/api/content/:id/file?v={version}` | ללא | קובץ תוכן בינארי (מודע ל-range; `?v` לביטול מטמון) |
| `GET` | `/api/content/:id/thumbnail` | ללא | תמונה ממוזערת |
| `POST` | `/api/admin/login` | ללא | הנפקת טוקן סשן |
| `POST` | `/api/admin/logout` | Bearer | השלכת טוקן בצד הלקוח (no-op בשרת) |
| `GET` | `/api/admin/content` | Bearer | רשימת כל פריטי התוכן |
| `POST` | `/api/admin/content` | Bearer | העלאת פריט תוכן חדש |
| `GET` | `/api/admin/content/:id` | Bearer | קבלת פריט תוכן יחיד |
| `PUT` | `/api/admin/content/:id` | Bearer | עדכון מטה-נתוני תוכן |
| `PUT` | `/api/admin/content/:id/file` | Bearer | החלפת קובץ תוכן |
| `PUT` | `/api/admin/content/:id/thumbnail` | Bearer | העלאה/החלפה של תמונה ממוזערת |
| `DELETE` | `/api/admin/content/:id` | Bearer | מחיקת פריט תוכן |
| `GET` | `/api/admin/categories` | Bearer | רשימת כל הקטגוריות |
| `POST` | `/api/admin/categories` | Bearer | יצירת קטגוריה |
| `PUT` | `/api/admin/categories/:id` | Bearer | עדכון קטגוריה |
| `DELETE` | `/api/admin/categories/:id` | Bearer | מחיקת קטגוריה (cascade) |
| `GET` | `/api/admin/interests` | Bearer | רשימת כל העניינים |
| `POST` | `/api/admin/interests` | Bearer | יצירת עניין |
| `PUT` | `/api/admin/interests/:id` | Bearer | שינוי שם עניין |
| `DELETE` | `/api/admin/interests/:id` | Bearer | מחיקת עניין |

**סה"כ: 21 endpoints.** 4 ציבוריים, 17 ניהוליים.

---

## 13. הנחות

| # | הנחה | השפעה אם שגויה |
|---|------|----------------|
| AC1 | משיכת קטלוג מלא מספקת עבור כ-15 פריטים (פחות מ-10 KB JSON) | נדרש סנכרון דלתא אם הקטלוג גדל ל-100+ פריטים |
| AC2 | nginx proxy שומר במטמון את קובץ התוכן המלא בגישת בקשת range ראשונה | ייתכן שנדרש טריגר לאחזור קובץ מלא לפני שמירה במטמון; יש לבדוק מוקדם (ראה סיכון CR1) |
| AC3 | אימות MIME + magic bytes מספיק לאבטחת קבצים בסביבת דמו מבוקרת | מתקפת תוכן מובנה עדיין אפשרית; מקובל ל-MVP |
| AC4 | JWT stateless; התנתקות ניהולית היא השלכת טוקן בצד הלקוח בלבד | אם נדרש ביטול, יש להוסיף רשימת חסימה בצד השרת |
| AC5 | אדמין פועל תמיד ברשת יציבה; העלאת multipart ללא chunking מקובלת | העלאות קבצים גדולים עלולות לפוג בזמן; יש להוסיף העלאה מקוטעת אם נדרש |
| AC6 | תפוגת טוקן של 8 שעות מתאימה לסשן ניהולי טיפוסי | יש להתאים אם נדרשים סשנים ארוכים יותר; להוסיף endpoint רענון בהמשך |
| AC7 | ‏`proxy_ignore_headers Cache-Control` בנתיב הקטלוג עובד ללא תופעות לוואי | יש לבדוק התנהגות nginx; חלופה: השרת מגדיר `Cache-Control: public, max-age=0` |

---

## 14. סיכונים

| # | סיכון | סבירות | השפעה | הפחתה |
|---|-------|--------|-------|-------|
| CR1 | ‏`proxy_cache` של nginx אינו שומר תוכן במטמון כאשר בקשת ה-Chrome הראשונה כוללת header ‏`Range` | בינונית | גבוהה | יש לבדוק בספרינט 1; להגדיר `proxy_cache_key` להתעלם מ-header ‏`Range`; או לאלץ pre-fetch קובץ מלא לחימום המטמון |
| CR2 | רשומות מטמון `?v={version}` ישנות מצטברות בדיסק מטמון ה-proxy (רשומה אחת לכל גרסה לכל קובץ) | נמוכה | נמוכה | רשומות פגות לאחר פסק זמן `inactive` של 30 יום; מקובל ל-MVP עם ≤15 פריטים ועדכונים נדירים |
| CR3 | העלאת multipart של 100 MB פוגת בזמן תחת הגדרת Express/Multer ברירת המחדל | נמוכה | בינונית | יש לקבוע פסק זמן נדיב להעלאה (לדוג', 10 דקות) בנתיבי העלאה; לבדוק עם קובץ של 100 MB |
| CR4 | עקיפת אימות סוג MIME (שינוי שם `.exe` ל-`.mp4`) | בינונית | בינונית | יש להשתמש בבדיקת magic bytes (ספריית `file-type`) בנוסף ל-header MIME |
| CR5 | ה-JSON של הקטלוג גדל באופן בלתי צפוי עם עלייה במספר התוכן | נמוכה (MVP) | נמוכה | פרמטר `?since` מתקבל מהיום הראשון; יש להוסיף pagination לפי הצורך |
| CR6 | מחיקת עניין משאירה `selectedInterestIds` ישן בקצה DeviceProfile | בינונית | נמוכה | ה-Edge SPA מסנן עניינים נבחרים מול הקטלוג בכל סנכרון |

---

## 15. שאלות פתוחות / החלטות ממתינות

| # | שאלה | משפיע על | ברירת מחדל מומלצת | מועד אחרון |
|---|------|---------|-----------------|-----------|
| APC1 | JWT (stateless) לעומת טוקן אטום (דורש store בצד השרת)? | אימות, התנהגות התנתקות | JWT — המסמך מניח זאת | לפני המימוש |
| APC2 | האם `GET /api/content/:id/file` יוגש על ידי streaming Node.js או nginx ‏`X-Accel-Redirect`? | ביצועים | Node.js ב-MVP; מעבר ל-nginx אם העומס בעייתי | ספרינט 2 לאחר בדיקת עומס |
| APC3 | האם `DELETE /api/admin/categories/:id` צריך למחוק ילדים בcascade, או לדחות אם קיימים ילדים? | חוויית משתמש ניהולית | מחיקת cascade — המסמך מניח זאת | לפני המימוש |
| APC4 | ‏`multipart/form-data` לעומת העלאה מקוטעת (פרוטוקול `tus`) להעלאת קבצים? | אמינות העלאה | `multipart/form-data` — לאדמין יש רשת יציבה | לפני המימוש |
| APC5 | השרת מגדיר `Cache-Control: no-store` או `Cache-Control: public, max-age=0` על `/api/catalog`? | הגדרת nginx | `no-store` + `proxy_ignore_headers` ב-proxy; יש לבדוק ולהתאים | ספרינט 1 |

---

## 16. מנופי צמצום היקף

| עדיפות | פישוט | Endpoints שהוסרו | השפעה |
|--------|-------|-----------------|-------|
| 1 | ביטול תמיכה בתמונות ממוזערות לחלוטין | `PUT /api/admin/content/:id/thumbnail`, `GET /api/content/:id/thumbnail` | placeholders מבוסס-סוג בלבד; חוסך כ-2 ימים |
| 2 | ביטול החלפת קובץ | `PUT /api/admin/content/:id/file` | אדמין חייב למחוק + להעלות מחדש להחלפת תוכן; תג "מעודכן" עדיין עובד דרך `updatedAt` |
| 3 | קטגוריות לקריאה בלבד (נתוני seed) | `POST /PUT /DELETE /api/admin/categories` | קטגוריות ממיגרציית DB; אין CRUD ניהולי; חוסך כ-2–3 ימים |
| 4 | עניינים לקריאה בלבד (נתוני seed) | `POST /PUT /DELETE /api/admin/interests` | עניינים ממיגרציית DB; אין CRUD ניהולי; חוסך כ-1–2 ימים |
| 5 | ביטול רשימת תוכן ניהולית | `GET /api/admin/content` | לאדמין אין תצוגת רשימה; מסתמך על העלאה/מחיקה בלבד |

---

## 17. הערות להמשך

- **סנכרון דלתא:** להוסיף תמיכת שרת עבור `GET /api/catalog?since={ISO_timestamp}` המחזיר רק פריטים שבהם `updatedAt > since`, בתוספת מערך `deleted: string[]` של IDs שנמחקו לצמיתות. ה-Edge SPA ממזג שינויים ל-IndexedDB במקום להחליף את התמונה המלאה.
- **Pagination:** להוסיף `?page={n}&limit={n}` ל-`GET /api/admin/content` כאשר הקטלוג גדל מעבר לכ-50 פריטים.
- **העלאה מקוטעת:** להחליף `multipart/form-data` בפרוטוקול העלאה ניתן-לחידוש `tus` באותו URL endpoint. מחלפים את ה-handler בצד השרת מבלי לשנות את חוזה ה-API של הלקוח.
- **כתובות העלאה presigned:** בעת מעבר לאחסון S3, להוסיף `POST /api/admin/content/presign` המחזיר כתובת S3 presigned. הלקוח מעלה ישירות ל-S3; השרת שומר מטה-נתונים בלבד. ה-endpoints של קטלוג ותוכן נשארים ללא שינוי.
- **חיפוש בצד השרת:** להוסיף `GET /api/catalog/search?q={term}` לחיפוש טקסט מלא דרך PostgreSQL ‏`tsvector`. MVP מבצע סינון בצד הלקוח על הקטלוג הממטומן.
- **סנכרון פעולות:** להוסיף `POST /api/actions` להעלאה אצווה של רשומות `LocalAction` מהקצה. גוף בקשה: `{ deviceId: string; actions: LocalAction[] }`.
- **סנכרון Push:** להוסיף `GET /api/sync/stream` (Server-Sent Events) כדי שהשרת יוכל לדחוף התראות עדכון קטלוג. ה-edge proxy מעביר SSE ללא שמירה במטמון.
- **ניהול משתמשי ניהול:** להחליף סיסמה משותפת באימות לכל משתמש. להוסיף CRUD ‏`POST /api/admin/users` ושדה `role` בתגובת ההתחברות. להוסיף middleware RBAC לנתיבי ניהול.
- **רענון טוקן:** להוסיף `POST /api/admin/token/refresh` המקבל את הטוקן הנוכחי ומחזיר חדש עם תפוגה מרוענות.

---

*מסמך זה הוא השישי בסט מסמכי TactiTok. המשך ל-`product/07_delivery-plan.md`.*
