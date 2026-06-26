# EEC Orientation Management

Web application for Massachusetts Early Education and Care (EEC) orientation registration and statewide tracking. Supports three portals:

- **Providers** — browse sessions, register, manage registrations
- **CCR&R staff** — manage attendance, view statewide registrations, export data
- **EEC administrators** — statewide analytics and CSV reporting

## Tech stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- [PostgreSQL](https://www.postgresql.org/) + [Prisma](https://www.prisma.io/)
- [Clerk](https://clerk.com/) authentication
- [Tailwind CSS](https://tailwindcss.com/)

## Prerequisites

- Node.js 20+
- PostgreSQL database
- Clerk application (publishable + secret keys)

## Local setup

```bash
npm install
cp .env.example .env
# Edit .env with DATABASE_URL and Clerk keys

npm run db:migrate
npm run db:seed          # optional demo data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Link a Clerk user to a role

After signing up in Clerk, link the account to the database:

```bash
# Provider
npm run account:link -- provider <clerkUserId> provider@example.com

# CCR&R staff (requires agency id from seed)
npm run account:link -- ccrr <clerkUserId> seed-agency-boston staff@example.com

# EEC admin
npm run account:link -- eec <clerkUserId> admin@example.com
```

Check link status:

```bash
npm run account:status -- <clerkUserId>
```

Verify demo seed data:

```bash
npm run demo:verify
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Apply migrations (dev) |
| `npm run db:migrate:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed demo data |
| `npm run account:link` | Link Clerk user to app role |

## Deployment checklist

1. **Database** — provision PostgreSQL and set `DATABASE_URL` on the host.
2. **Migrations** — run `npm run db:migrate:deploy` before or during deploy (add to build step if your host supports it).
3. **Clerk** — use production keys; add your deploy URL to Clerk allowed origins and redirect URLs.
4. **Environment variables** — set all required vars from `.env.example` (Resend is optional until email is enabled).
5. **Build** — `npm run build` then `npm run start` (or use the host's Next.js integration).
6. **Health check** — `GET /api/health` returns database connectivity status.
7. **Staff accounts** — link CCR&R and EEC users with `npm run account:link` after deploy.

### Suggested build command (Railway / similar)

```bash
npm run db:migrate:deploy && npm run build
```

### Public routes

These routes do not require sign-in (by design):

- `/`, `/sign-in`, `/sign-up`
- `GET /api/health`
- `GET /api/sessions`, `GET /api/sessions/filter-options` (public session listing)

All other API routes and portals require Clerk authentication.

## Project structure

```
src/app/          # Pages and API routes
src/components/   # Shared UI
src/lib/          # Auth, DB, utilities
prisma/           # Schema, migrations, seed
scripts/          # Account linking and verification
```

## License

Private — BU Spark / EEC collaboration project.
