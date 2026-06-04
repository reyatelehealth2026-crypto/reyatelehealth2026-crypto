# ระบบโพสต์ Facebook Page อัตโนมัติด้วย Gemini

Single-admin Next.js (App Router) app that drafts Thai Facebook Page content with
Google Gemini (structured output), lets the admin review/approve/schedule, and
publishes to a Facebook Page on a Vercel Cron — idempotently.

> หมายเหตุ: `README.md` และ `index.html` เดิมเป็นพอร์ตโฟลิโอ ไม่เกี่ยวกับแอปนี้

## Stack
- Next.js 15 + TypeScript (App Router)
- Prisma + Vercel Postgres
- Vercel Blob (image storage)
- `@google/genai` (Gemini, default `gemini-2.5-flash`)
- Lightweight signed session cookie (jose) for the single admin
- Tailwind CSS

## Setup
```bash
npm install
cp .env.example .env        # fill in values
npx prisma migrate dev      # create tables
npm run dev
```

### Generate secrets
```bash
# AUTH_SECRET / CRON_SECRET
openssl rand -base64 32
# TOKEN_ENCRYPTION_KEY (32-byte base64 — used for AES-256-GCM)
openssl rand -base64 32
# ADMIN_PASSWORD_HASH
node -e "console.log(require('bcryptjs').hashSync('yourpassword',10))"
```

## Workflow
AI draft → admin edit → approve → schedule → cron publish → published/failed.
Supports text, link, and 1 image per post (v1).

- `/login` — admin login
- `/dashboard` — status counts + recent posts + connection status
- `/compose` — generate Gemini draft, edit, upload image, save draft
- `/posts/[id]` — approve / schedule / cancel; shows Facebook post id or error
- `/calendar` — scheduled/published timeline
- `/settings/facebook` — connect a Page via Meta OAuth and select it

## Cron
`vercel.json` runs `/api/cron/publish-due` every minute. Vercel sends
`Authorization: Bearer $CRON_SECRET`. Locally you can trigger it:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/publish-due
```
The job reaps stale locks, atomically claims due posts
(`FOR UPDATE SKIP LOCKED`), publishes each, and retries with backoff up to 3
attempts before marking `FAILED`.

## Tests
```bash
npm run test       # vitest unit/integration (mocked Gemini + Meta)
npm run typecheck
npm run build
```

## Env vars
See `.env.example`: `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `GEMINI_API_KEY`,
`GEMINI_MODEL`, `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`,
`TOKEN_ENCRYPTION_KEY`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`,
`CRON_SECRET`.
