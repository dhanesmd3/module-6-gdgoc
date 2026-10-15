# Portfolio — Module 6: Authentication & Security

Continuation of the Module 5 full-stack app (React + Vite frontend, Express +
Drizzle + Supabase PostgreSQL backend). Module 6 adds user accounts, JWT
authentication, and owner-only write access to projects.

## What was added

| Requirement | Where |
|---|---|
| `users` table in the Drizzle schema | [backend/src/db/schema.ts](backend/src/db/schema.ts), migration [0001_auth_users.sql](backend/drizzle/0001_auth_users.sql) |
| `POST /api/auth/register`, `POST /api/auth/login` | [backend/src/controllers/auth.controller.ts](backend/src/controllers/auth.controller.ts) |
| `requireAuth` JWT middleware | [backend/src/middleware/requireAuth.ts](backend/src/middleware/requireAuth.ts) |
| POST / PATCH / DELETE projects are owner-only | [backend/src/routes/projects.routes.ts](backend/src/routes/projects.routes.ts), `findOwnedProject` in [projects.controller.ts](backend/src/controllers/projects.controller.ts) |
| Login form + token handling on the frontend | [src/pages/LoginPage.tsx](src/pages/LoginPage.tsx), [src/store/useAuthStore.ts](src/store/useAuthStore.ts) |
| Bonus 1 — Login with GitHub (OAuth 2.0) | `githubStart` / `githubCallback` in auth.controller.ts |
| Bonus 2 — Refresh token (15 min / 7 days) | [backend/src/utils/tokens.ts](backend/src/utils/tokens.ts) |
| Bonus 3 — Helmet security headers | [backend/src/index.ts](backend/src/index.ts) |

## Setup

```bash
# backend
cd backend
npm install
cp .env.example .env        # fill in DATABASE_URL and JWT_SECRET
npm run db:migrate          # creates users + refresh_tokens, adds projects.owner_id
npm run dev                 # http://localhost:4000, docs at /api-docs

# frontend (separate terminal, project root)
npm install
npm run dev                 # http://localhost:5173
```

Generate a `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## API

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | — | `{ name, email, password }` → `201 { user, accessToken }` + refresh cookie |
| POST | `/api/auth/login` | — | `{ email, password }` → `200 { user, accessToken }` + refresh cookie |
| POST | `/api/auth/refresh` | refresh cookie | Rotates the cookie, returns a new access token |
| POST | `/api/auth/logout` | refresh cookie | Revokes the refresh token, clears the cookie |
| GET | `/api/auth/me` | Bearer | Current user |
| GET | `/api/auth/github` | — | Starts "Login with GitHub" |
| GET | `/api/projects`, `/api/projects/:id` | — | Public |
| POST | `/api/projects` | Bearer | New project is owned by the caller |
| PATCH | `/api/projects/:id` | Bearer + owner | `403` if the project belongs to someone else |
| DELETE | `/api/projects/:id` | Bearer + owner | Soft delete, `403` if not the owner |

Status codes for protected routes: `401 No token provided` (missing header),
`401 Invalid token` (bad signature / malformed), `401 Token expired`,
`403` (authenticated but not the owner), `404` (project doesn't exist).

## Security design

**Passwords.** Hashed with bcrypt (12 rounds) before insert; only
`password_hash` is stored. Login returns the same `Invalid email or password`
for an unknown email and a wrong password, and runs bcrypt against a dummy
hash when the email doesn't exist so response time doesn't leak which emails
are registered. `/register` and `/login` are rate-limited (20 per 15 min).

**JWT.** Access tokens are signed with HS256 using `JWT_SECRET` from `.env`
(the server refuses to start if it's missing or shorter than 32 characters),
contain only `{ userId }`, and expire after 15 minutes. `requireAuth` verifies
with `algorithms: ['HS256']` pinned, so `alg: none` or algorithm-swap tokens
are rejected.

**Token storage on the frontend (why not localStorage).** Anything in
localStorage can be read by any script running on the page, so a single XSS
bug would leak the token. Instead:

- The **access token** is kept only in memory (a Zustand store). It is sent as
  `Authorization: Bearer <token>` by `authFetch`, and disappears on reload.
- The **refresh token** is in an `httpOnly`, `SameSite=Strict` cookie scoped to
  `/api/auth` (and `Secure` in production). JavaScript can't read it, and the
  browser only sends it to the auth endpoints.
- On page load the app calls `/api/auth/refresh` to get a new access token. If
  a request gets `401`, `authFetch` refreshes once and retries.

**Refresh tokens (Bonus 2).** Opaque random 48-byte values. The database
stores only their SHA-256 hash in `refresh_tokens`. Every refresh rotates the
token (old one revoked, new one issued). If a revoked token is used again
later, it's treated as stolen and every session of that user is revoked.
Logout revokes the token server-side, so it can't be used even if copied.

**Authorization.** `requireAuth` answers "who are you?"; `findOwnedProject`
answers "is this yours?" on every PATCH/DELETE. Hiding the Edit/Delete buttons
in the UI is only for convenience. The API enforces ownership itself.
Projects created before Module 6 have `owner_id = NULL` and can't be modified
by anyone.

**Other OWASP items.** Drizzle uses parameterized queries (injection). Zod
validates every request body. The error handler never sends stack traces.
CORS only allows `FRONTEND_URL`, and JSON bodies are limited to 10 kB.

## Bonus 1 — Login with GitHub (OAuth 2.0 Authorization Code flow)

Setup: create an OAuth App at <https://github.com/settings/developers> with
callback URL `http://localhost:4000/api/auth/github/callback`, then set
`GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `backend/.env`.

1. The user clicks **Login with GitHub**. The browser goes to
   `GET /api/auth/github`.
2. The backend generates a random `state`, stores it in a short-lived httpOnly
   cookie, and redirects to `github.com/login/oauth/authorize` with
   `client_id`, `redirect_uri`, `scope=read:user user:email`, and `state`.
3. The user approves on GitHub. GitHub redirects to
   `/api/auth/github/callback?code=...&state=...`.
4. The backend checks `state` against the cookie (blocks login CSRF), then
   exchanges `code` + `client_secret` for a GitHub access token. This call is
   server-to-server, so the secret never reaches the browser.
5. The backend reads `/user` and `/user/emails` from the GitHub API and takes
   the verified primary email.
6. It finds the user by `github_id`, or links an existing account with the same
   verified email, or creates a new user (with no password).
7. It issues our own refresh cookie, the same as a normal login, and redirects
   to `http://localhost:5173/login?oauth=success`.
8. The frontend calls `/api/auth/refresh` to get an access token and goes to
   `/projects`.

GitHub's access token is used only during the callback and is never stored.

## Bonus 3 — Security headers

`helmet()` adds `Content-Security-Policy`, `Strict-Transport-Security`,
`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`,
`Referrer-Policy: no-referrer`, `Cross-Origin-Opener-Policy`, and
`Cross-Origin-Resource-Policy`, and it removes `X-Powered-By`. securityheaders.com can only scan
a public URL. To audit the API, deploy it or expose it temporarily, for example
with `npx cloudflared tunnel --url http://localhost:4000`, and scan that URL.
