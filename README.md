# Domainrr

A domain registration and management site built on the [name.com](https://www.name.com)
reseller API. Search for domains as you type (à la Vercel), sign up, claim domains
to your account, and manage DNS records — all from one place.

## Features

- **Instant domain search** — a single search box on the homepage that checks
  availability across popular TLDs as you type, with live pricing.
- **Email + password auth** — self-contained accounts with bcrypt-hashed
  passwords and signed (JWT) httpOnly session cookies.
- **Per-user domain accounts** — each user sees and manages only their own domains.
- **DNS management** — list, add, and delete DNS records (A, AAAA, CNAME, MX,
  TXT, NS, SRV, ANAME) through the name.com API.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [Prisma 7](https://www.prisma.io) with the PostgreSQL driver adapter (`pg`)
- [jose](https://github.com/panva/jose) for session JWTs, `bcryptjs` for hashing,
  `zod` for input validation

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   then edit .env — set DATABASE_URL to a Postgres database and fill in the
#   name.com credentials. See "Configuration" below.

# 3. Create the tables from the Prisma schema
npx prisma db push

# 4. Run the dev server
npm run dev
```

Open <http://localhost:3000>.

> Need a local Postgres quickly? `docker run --name domainrr-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=domainrr -p 5432:5432 -d postgres:16`
> then use `DATABASE_URL="postgresql://postgres:password@localhost:5432/domainrr?schema=public"`.

## Configuration

All configuration lives in `.env` (see `.env.example`):

| Variable          | Description                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`    | PostgreSQL connection string. Use a **pooled** URL on serverless hosts.     |
| `AUTH_SECRET`     | Secret used to sign session JWTs. Generate with `openssl rand -base64 32`.  |
| `NAMECOM_API_URL` | `https://api.dev.name.com` (sandbox) or `https://api.name.com` (production). |
| `NAMECOM_USERNAME`| Your name.com username. In the **dev** environment append `-test`.           |
| `NAMECOM_TOKEN`   | Your name.com API token.                                                     |

Create an API token from your name.com account under **Account → API for
Resellers**. Until valid credentials are set, domain search and DNS pages will
return a clear error instead of results.

> **Sandbox note:** the dev API (`api.dev.name.com`) uses a separate test
> account; your username there is your name.com username with `-test` appended.

## Project structure

```
src/
├── proxy.ts                 # Auth gate for /dashboard (Edge runtime)
├── lib/
│   ├── session.ts           # Edge-safe JWT helpers (jose)
│   ├── auth.ts              # Password hashing + cookie session (Node)
│   ├── prisma.ts            # Prisma client (better-sqlite3 adapter)
│   ├── namecom.ts           # name.com v4 API client
│   ├── domains.ts           # Search query → candidate domains, formatting
│   └── ownership.ts         # "Does this user own this domain?" guard
├── app/
│   ├── page.tsx             # Homepage hero + search
│   ├── login, register/     # Auth pages
│   ├── dashboard/           # Domain list + per-domain DNS management
│   └── api/                 # Auth, domain search/claim, DNS record routes
└── components/              # SiteHeader, DomainSearch, AuthForm, DnsManager
```

## Notes & next steps

- **Claiming vs. purchasing.** `POST /api/domains` currently records domain
  ownership in the local database. Wiring a real purchase means calling
  name.com's `POST /v4/domains` with registrant contacts and a purchase price —
  that billing/contact flow is intentionally left as the next milestone (see the
  note in `src/app/api/domains/route.ts`).
- **DNS-only registrar coupling.** DNS records live at name.com; the local
  database only tracks which user owns which domain so it can gate management.

## Deploying to Vercel

1. **Create a Postgres database** — in Vercel: **Storage → Create Database →
   Postgres** (Neon-backed), or use [Neon](https://neon.tech) /
   [Supabase](https://supabase.com). Copy the **pooled** connection string (the
   host contains `-pooler`).
2. **Import the repo** at [vercel.com/new](https://vercel.com/new). Next.js is
   auto-detected; defaults are fine. The `build` and `postinstall` scripts already
   run `prisma generate` for you.
3. **Set environment variables** (Production + Preview) — `DATABASE_URL`,
   `AUTH_SECRET` (`openssl rand -base64 32`), `NAMECOM_API_URL`,
   `NAMECOM_USERNAME`, `NAMECOM_TOKEN`. If you used Vercel Postgres, `DATABASE_URL`
   is injected automatically.
4. **Create the tables** once against the production database:
   ```bash
   DATABASE_URL="<your-prod-postgres-url>" npx prisma db push
   ```
   For a migration-based workflow later, use `prisma migrate dev` locally and add
   `prisma migrate deploy` to the build command.
5. **Deploy**, then register an account and run a search to verify.
