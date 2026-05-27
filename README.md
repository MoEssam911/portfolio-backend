# Portfolio API

Backend for a single-owner portfolio CMS built with NestJS, Prisma, and PostgreSQL.

## What Changed

- **Domain-first structure:** blog, resume, and projects now own their own modules, services, DTOs, and controllers.
- **Split routes:** each domain has public controllers and dashboard controllers.
- **Ownership checks:** write operations are protected with a shared `assertOwnership()` helper.
- **Dashboard prefix:** protected routes now live under the shared `dashboard` prefix.
- **Resume CMS:** resume data is structured as sections with typed section kinds.
- **Projects domain:** projects were added as a first-class content type with public and dashboard routes.
- **Prisma updates:** schema, migrations, config, and seed data were aligned with the new CMS structure.
- **Tests:** focused unit tests were added for blog, resume, and projects services.
- **Jest path mapping:** `src/*` imports now resolve correctly in tests.

## Architecture

The app is organized around content domains:

- `auth` — login only, no public register endpoint.
- `blog` — public reading plus authenticated CRUD.
- `resume` — public resume display plus authenticated editing.
- `projects` — public portfolio projects plus authenticated CRUD.
- `common` — shared filters, pagination, ownership, and route constants.
- `prisma` — Prisma module, Prisma service, schema, seed, and migrations.

## API Base

All routes are served under `api/v1`.

## Public Routes

- `GET /api/v1/blogs`
- `GET /api/v1/blogs/:slug`
- `GET /api/v1/resume`
- `GET /api/v1/projects`
- `GET /api/v1/projects/:slug`
- `POST /api/v1/auth/login`

## Dashboard Routes

All protected write routes use the `dashboard` prefix and `JwtAuthGuard`.

- `POST /api/v1/dashboard/blogs`
- `PATCH /api/v1/dashboard/blogs/:id`
- `DELETE /api/v1/dashboard/blogs/:id`
- `PATCH /api/v1/dashboard/resume`
- `POST /api/v1/dashboard/resume/sections`
- `POST /api/v1/dashboard/projects`
- `PATCH /api/v1/dashboard/projects/:id`
- `DELETE /api/v1/dashboard/projects/:id`

## Data Model

Prisma now includes:

- `User`
- `BlogPost`
- `Resume`
- `ResumeSection`
- `Project`
- `ResumeSectionType` enum

## Setup

Install dependencies:

```bash
npm install
```

Set environment variables:

```bash
DIRECT_URL=your_supabase_direct_postgres_url
JWT_SECRET=your_long_random_secret
PORT=3000
```

If you use Supabase, point `DIRECT_URL` to the direct connection string for Prisma migrations.

Run the app:

```bash
npm run start:dev
```

## Prisma

Generate the client:

```bash
npx prisma generate
```

Apply migrations:

```bash
npx prisma migrate dev
```

The repo uses `prisma.config.ts` and `prisma/seed.ts` for Prisma setup.

## Seeding the Admin

There is no public registration flow.

The seed script creates the owner account if it does not already exist:

- Email: `admin@portfolio.com`
- Username: `admin`
- Password: `Admin12345`

After seeding, change the password in your own workflow if needed.

## Tests

Run the unit tests:

```bash
npm test -- --runInBand
```

The current test coverage focuses on the service layer for:

- blog publishing and ownership checks
- resume updates and section creation
- projects CRUD and ownership checks

## Notes

- Public reads are separated from dashboard writes inside each domain module.
- Ownership is enforced in services, not only in controllers.
- Prisma client generation worked reliably with the current `DIRECT_URL` setup.
- On Windows, `cmd /c npx prisma generate` may be more reliable than PowerShell if execution policy blocks the command.

## Next Steps

- Add e2e coverage for the public and dashboard routes.
- Add CI checks for linting, tests, and Prisma generation.
- Expand dashboard tooling for content editing workflows.
