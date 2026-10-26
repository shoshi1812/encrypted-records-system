# מדריך API לקליינט

המסמך מתאר את כל מה שהקליינט צריך כדי לעבוד מול השרת. אין בו קוד React.
המקור המחייב הוא Swagger (`/api-docs`). כל JSON הוא camelCase, וערכי enum באותיות גדולות.

## Base URL

| סביבה | כתובת |
|---|---|
| מקומית | `http://localhost:4000` |
| פרוסה | `https://<שם-השירות>.onrender.com` (הכתובת שמתקבלת מ-Render בזמן הפריסה) |

בקליינט הכתובת מוגדרת במקום אחד בלבד, במשתנה `VITE_API_URL`. כל הנתיבים מתחילים ב-`/api`.

## Authentication

- מקבלים טוקן מ-`POST /api/auth/register` או מ-`POST /api/auth/login`. התשובה כוללת `accessToken` ופרטי המשתמש.
- הטוקן הוא JWT ותקף ל-**60 דקות** (`expiresIn: 3600` שניות). אין refresh token. אחרי שפג התוקף, הקריאה הבאה מחזירה 401 וצריך להתחבר מחדש.
- הטוקן נשמר ב-localStorage. בעליית האתר, אם יש טוקן, קוראים ל-`GET /api/auth/me` כדי לשחזר את המשתמשת.

### שליחת ה-Bearer Token

כל בקשה מוגנת נושאת את הכותרת:

```
Authorization: Bearer <accessToken>
```

## תשעת ה-Endpoints

| # | Method | URL | הרשאות |
|---|---|---|---|
| 1 | GET | `/api/health` | פתוח |
| 2 | POST | `/api/auth/register` | פתוח |
| 3 | POST | `/api/auth/login` | פתוח |
| 4 | GET | `/api/auth/me` | מחובר |
| 5 | GET | `/api/cipher-records` | מחובר |
| 6 | POST | `/api/cipher-records` | מחובר |
| 7 | GET | `/api/cipher-records/{id}` | מחובר |
| 8 | PUT | `/api/cipher-records/{id}` | בעלים בלבד |
| 9 | GET | `/api/admin/users` | מנהל בלבד (ללא מסך בקליינט) |

## איזה endpoint משמש כל מסך

```
מסך / רכיב        | Endpoint                          | סוג        | מה נשלח                    | מה חוזר
------------------|-----------------------------------|------------|----------------------------|---------------------------
עליית האתר        | GET /api/auth/me                  | Query      | טוקן בלבד                  | id, email, role
Register          | POST /api/auth/register           | Mutation   | email, password            | טוקן + משתמש
Login             | POST /api/auth/login              | Mutation   | email, password            | טוקן + משתמש
Records list      | GET /api/cipher-records           | Query      | search, category,          | items, page, pageSize,
                  |                                   |            | sortDirection, pageSize    | totalCount
Record form (יצירה)| POST /api/cipher-records         | Mutation   | title, description,        | מטא־נתונים של הרשומה
                  |                                   |            | recipientEmail, category,  | שנוצרה (בלי תוכן)
                  |                                   |            | visibility, content        |
Record form (עריכה)| GET /api/cipher-records/{id}     | Query      | מזהה בנתיב                 | הרשומה המלאה, לטעינת
                  |                                   |            |                            | הטופס
Record form (עריכה)| PUT /api/cipher-records/{id}     | Mutation   | title, description,        | מטא־נתונים מעודכנים
                  |                                   |            | category, visibility,      | (בלי תוכן)
                  |                                   |            | content (אופציונלי)        |
Record details    | GET /api/cipher-records/{id}      | Query      | מזהה בנתיב                 | מטא־נתונים + content,
                  |                                   |            |                            | או content=null
Header / Logout   | —                                 | —          | —                          | פעולה מקומית בלבד
```

אין בטבלה שורה עבור `/api/admin/users` ועבור `/api/health`. הראשון מודגם מ-Swagger, השני משמש את ספק הענן.

## בקשות ותשובות

### 1. GET /api/health

```json
{ "status": "ok", "timestamp": "2026-10-26T12:00:00.000Z" }
```

### 2. POST /api/auth/register

בקשה:

```json
{ "email": "dana@example.com", "password": "Example123" }
```

תשובה 201:

```json
{
  "accessToken": "eyJhbGciOi...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": { "id": "a1b2...", "email": "dana@example.com", "role": "USER" }
}
```

שגיאות: 400 VALIDATION_ERROR, 409 EMAIL_ALREADY_EXISTS.

> **שדה אימות הסיסמה הוא שדה קליינט בלבד ואינו נשלח לשרת.** הוא נבדק בטופס מול שדה הסיסמה. השרת מקבל `email` ו-`password` בלבד, ומתעלם מכל שדה נוסף.

### 3. POST /api/auth/login

בקשה זהה להרשמה. תשובה 200 זהה במבנה לתשובת ההרשמה.

שגיאות: 400 VALIDATION_ERROR, 401 INVALID_CREDENTIALS, 429 TOO_MANY_REQUESTS.

```json
{ "errorCode": "INVALID_CREDENTIALS", "message": "אימייל או סיסמה שגויים." }
```

אותה תשובה בדיוק לאימייל שאינו קיים ולסיסמה שגויה.

### 4. GET /api/auth/me

תשובה 200:

```json
{ "id": "a1b2...", "email": "dana@example.com", "role": "USER" }
```

שגיאות: 401 UNAUTHORIZED.

### 5. GET /api/cipher-records

פרמטרי query, כולם אופציונליים:

| פרמטר | ערכים | ברירת מחדל |
|---|---|---|
| `search` | טקסט, חיפוש חלקי בכותרת, לא תלוי רישיות | — |
| `category` | `DOCUMENT` / `NOTE` / `CODE` / `OTHER` | — |
| `sortDirection` | `ASC` / `DESC` (לפי תאריך יצירה) | `DESC` |
| `page` | מספר שלם, 1 ומעלה | 1 |
| `pageSize` | 1 עד 100. מעל 100 מחזיר 400 | 20 |

הקליינט שולח `pageSize=100` קבוע ומציג "מוצגות N רשומות" לפי `totalCount`.

דוגמה: `GET /api/cipher-records?search=חוזה&category=DOCUMENT&sortDirection=DESC&pageSize=100`

תשובה 200:

```json
{
  "items": [
    {
      "id": "e5f6...",
      "title": "חוזה שכירות",
      "description": "טיוטה ראשונה לבדיקה",
      "category": "DOCUMENT",
      "visibility": "PRIVATE",
      "createdAt": "2026-10-26T10:00:00.000Z",
      "senderEmail": "dana@example.com"
    }
  ],
  "page": 1,
  "pageSize": 100,
  "totalCount": 1
}
```

שגיאות: 400 VALIDATION_ERROR, 401 UNAUTHORIZED.

היקף: משתמשת רגילה רואה את הרשומות שלה, רשומות שנשלחו אליה וכל הרשומות הציבוריות. מנהל רואה הכול. הרשימה לעולם אינה כוללת `content` או `recipientEmail`. `description` שאינו קיים מוחזר כ-`null`.

### 6. POST /api/cipher-records

בקשה:

```json
{
  "title": "חוזה שכירות",
  "description": "טיוטה ראשונה לבדיקה",
  "recipientEmail": "rivka@example.com",
  "category": "DOCUMENT",
  "visibility": "PRIVATE",
  "content": "מספר החשבון הוא 12-345-6789"
}
```

תשובה 201: אובייקט מטא־נתונים במבנה של פריט ברשימה (בלי `content`). כדי להציג את התוכן אחרי היצירה, יש לנווט למסך הפרטים.

שגיאות: 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 404 RECIPIENT_NOT_FOUND, 413 PAYLOAD_TOO_LARGE.

```json
{ "errorCode": "RECIPIENT_NOT_FOUND", "message": "לא ניתן לשלוח רשומה למשתמש המבוקש." }
```

### 7. GET /api/cipher-records/{id}

תשובה 200 לשולח או לנמען:

```json
{
  "id": "e5f6...",
  "title": "חוזה שכירות",
  "description": "טיוטה ראשונה לבדיקה",
  "category": "DOCUMENT",
  "visibility": "PRIVATE",
  "createdAt": "2026-10-26T10:00:00.000Z",
  "senderEmail": "dana@example.com",
  "recipientEmail": "rivka@example.com",
  "content": "מספר החשבון הוא 12-345-6789"
}
```

למנהל שאינו צד לרשומה, או למשתמשת אחרת ברשומה ציבורית: אותו מבנה, אבל `recipientEmail` ו-`content` הם `null`. במקרה כזה יש להציג "התוכן זמין לשולח ולנמען בלבד", ולא אזור תוכן ריק.

שגיאות: 401 UNAUTHORIZED, 404 RECORD_NOT_FOUND.

### 8. PUT /api/cipher-records/{id}

בקשה:

```json
{
  "title": "חוזה שכירות מעודכן",
  "description": "גרסה סופית",
  "category": "NOTE",
  "visibility": "PRIVATE",
  "content": "מספר החשבון המעודכן הוא 98-765-4321"
}
```

- `title`, `category`, `visibility` חובה.
- `description`: מחרוזת ריקה או `null` מנקים את התיאור.
- `content` **אופציונלי**. אם נשלח, השרת מצפין אותו מחדש והתוכן הקודם נדרס (אין היסטוריה). אם לא נשלח, התוכן נשאר כפי שהוא. מחרוזת ריקה אינה תקפה (400).
- הנמען אינו ניתן לשינוי. אין לכלול אותו בטופס העריכה כשדה פעיל.

תשובה 200: מטא־נתונים מעודכנים, בלי `content`. אחרי עריכה יש לבטל את ה-cache של הרשימה ושל הרשומה, אחרת מסך הפרטים יציג את התוכן הישן.

שגיאות: 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 FORBIDDEN, 404 RECORD_NOT_FOUND, 413 PAYLOAD_TOO_LARGE.

```json
{ "errorCode": "FORBIDDEN", "message": "רק יוצר הרשומה רשאי לערוך אותה." }
```

### 9. GET /api/admin/users

אין לו מסך בקליינט. מודגם מ-Swagger. תשובה 200 למנהל:

```json
[
  { "id": "a1b2...", "email": "dana@example.com", "role": "USER", "createdAt": "2026-10-20T08:00:00.000Z" },
  { "id": "c3d4...", "email": "admin@example.com", "role": "ADMIN", "createdAt": "2026-10-19T08:00:00.000Z" }
]
```

משתמשת רגילה מקבלת 403:

```json
{ "errorCode": "FORBIDDEN", "message": "הפעולה מותרת למנהל בלבד." }
```

## מבני נתונים (DTO) בצד הקליינט

תיאור השדות והטיפוסים, לבניית קובץ ה-types בקליינט:

| מבנה | שדות |
|---|---|
| `Role` | `"USER"` או `"ADMIN"` |
| `Category` | `"DOCUMENT"`, `"NOTE"`, `"CODE"`, `"OTHER"` |
| `Visibility` | `"PRIVATE"`, `"PUBLIC"` |
| `User` | `id: string`, `email: string`, `role: Role` |
| `AuthResponse` | `accessToken: string`, `tokenType: "Bearer"`, `expiresIn: number`, `user: User` |
| `RecordListItem` | `id`, `title`, `description: string \| null`, `category`, `visibility`, `createdAt` (ISO), `senderEmail` |
| `RecordDetails` | כל שדות `RecordListItem`, ובנוסף `recipientEmail: string \| null`, `content: string \| null` |
| `RecordPage` | `items: RecordListItem[]`, `page`, `pageSize`, `totalCount` |
| `CreateRecordRequest` | `title`, `description?`, `recipientEmail`, `category`, `visibility`, `content` |
| `UpdateRecordRequest` | `title`, `description?`, `category`, `visibility`, `content?` |
| `ApiError` | `errorCode: string`, `message: string`, `details?: { field: string; message: string }[]` |

## שדות חובה ומגבלות בטפסים

הכללים בטופס זהים לאלה שבשרת. בדיקת הקליינט אינה תחליף לבדיקת השרת.

| טופס | שדה | חובה | מגבלה |
|---|---|---|---|
| הרשמה | email | כן | פורמט אימייל תקין, עד 255 תווים |
| הרשמה | password | כן | 8 תווים לפחות, לפחות אות אחת ומספר אחד |
| הרשמה | אימות סיסמה | כן | זהה לסיסמה. **קליינט בלבד, לא נשלח** |
| התחברות | email, password | כן | — |
| רשומה | title | כן | 1 עד 150 תווים |
| רשומה | description | לא | עד 300 תווים |
| רשומה (יצירה) | recipientEmail | כן | פורמט אימייל תקין, של משתמש קיים |
| רשומה | category | כן | אחד מארבעת הערכים |
| רשומה | visibility | כן | `PRIVATE` או `PUBLIC` (ברירת מחדל `PRIVATE`) |
| רשומה | content | ביצירה כן, בעריכה לא | 1 עד 20,000 תווים. כדאי מונה תווים |

שלוש בדיקות שרק השרת יכול לבצע, כי הן מול מסד הנתונים: אימייל תפוס (409), סיסמה נכונה בהתחברות (401), ונמען קיים (404).

## קודי שגיאה

כל שגיאה חוזרת במבנה אחיד: `{ "errorCode": "...", "message": "..." }`. בשגיאת ולידציה נוסף `details` עם השדות שנכשלו.

| קוד | HTTP | מתי | מה הקליינט עושה |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | נתונים שאינם תקינים, כולל תוכן ארוך מ-20,000 תווים | הצגת השגיאות ליד השדות |
| `INVALID_CREDENTIALS` | 401 | אימייל או סיסמה שגויים | הודעה כללית בטופס ההתחברות |
| `UNAUTHORIZED` | 401 | טוקן חסר, פגום או שפג תוקפו | ניקוי הטוקן וה-Context, מעבר ל-Login (במקום אחד מרכזי) |
| `FORBIDDEN` | 403 | פעולה אסורה על משאב שהפונה רואה | הודעה שאין הרשאה |
| `RECORD_NOT_FOUND` | 404 | רשומה שאינה קיימת או שאין לפונה זכות לדעת עליה | הודעת "לא נמצא" |
| `RECIPIENT_NOT_FOUND` | 404 | אימייל נמען שאינו קיים | הודעה ליד שדה הנמען |
| `ROUTE_NOT_FOUND` | 404 | נתיב API שאינו קיים | — |
| `EMAIL_ALREADY_EXISTS` | 409 | הרשמה עם אימייל קיים | הודעה ליד שדה האימייל |
| `PAYLOAD_TOO_LARGE` | 413 | גוף בקשה מעל 1mb | הודעה כללית |
| `TOO_MANY_REQUESTS` | 429 | יותר מדי ניסיונות התחברות | הודעה לנסות שוב מאוחר יותר |
| `INTERNAL_ERROR` | 500 | שגיאה לא צפויה | הודעה כללית |

**ההבחנה בין 400 ל-413:** תוכן ארוך מ-20,000 תווים מחזיר **400** (ולידציה רגילה, וזה מה שיקרה בפועל). 413 מוחזר רק כשגוף הבקשה כולו כבד מ-1mb, הגנת תשתית שבשימוש רגיל לא תופעל.

## הרשאות ומה מוחזר בהצלחה

| הפונה | ברשימה | GET פרטים | PUT |
|---|---|---|---|
| בעלים | מופיעה | 200 עם content | 200 |
| נמען | מופיעה | 200 עם content | 403 |
| מנהל שאינו צד לרשומה | מופיעה | 200, content=null | 403 |
| משתמשת אחרת, רשומה PUBLIC | מופיעה | 200, content=null | 403 |
| משתמשת אחרת, רשומה PRIVATE | לא מופיעה | 404 | 404 |
| מזהה שאינו קיים | — | 404 | 404 |

הכלל: אם הפונה יכול לראות שהרשומה קיימת, הסירוב הוא 403. אם אינו אמור לדעת שהיא קיימת, התשובה היא 404.
הגנת נתיבים בקליינט היא לנוחות בלבד. השרת הוא סמכות ההרשאה.
