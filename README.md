# מערכת רשומות מוצפנות

מערכת שמאפשרת למשתמשת רשומה ליצור רשומת מידע רגיש ולשתף אותה עם נמען אחד. **תוכן הרשומה נשמר במסד הנתונים מוצפן בלבד** (AES-256-GCM בשרת), ולא כטקסט קריא.

| תיקייה | תוכן |
|---|---|
| [`server/`](server/) | שרת Node.js + Express + TypeScript + Prisma + PostgreSQL. ראי [server/README.md](server/README.md) |
| `client/` | קליינט React + TypeScript (Vite) |

- תיעוד ה-API: Swagger בנתיב `/api-docs` של השרת, ו-[server/FRONTEND-API-GUIDE.md](server/FRONTEND-API-GUIDE.md).
- העלאה לאינטרנט צעד אחר צעד: [server/START-HERE.md](server/START-HERE.md).

> ⚠️ שינוי או אובדן של `ENCRYPTION_KEY` פירושו אובדן בלתי הפיך של כל התוכן הקיים במסד.
