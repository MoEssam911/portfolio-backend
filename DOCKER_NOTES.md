# Docker, explained from zero — for this API

You've never used Docker. This doc starts at the very beginning and ends with
exactly how to build, run, and ship *this* project. Read top to bottom.

---

## 1. The three words people throw around: image, container, layer

**Image** — a frozen, read-only snapshot of a filesystem plus a "when you start
me, run this command" instruction. Think of it like a `.zip` of a tiny Linux
machine with Node, your compiled app, and its dependencies already inside. It
doesn't *do* anything on its own; it just sits there.

**Container** — a running instance of an image. Same relationship as a *class*
and an *object*, or a `.exe` file and the process you get when you double-click
it. You can start many containers from one image. When a container stops, any
changes it made to its own filesystem vanish — the image underneath is
untouched. This is why secrets and databases live *outside* the container.

**Layer** — an image isn't one solid blob; it's built up from stacked,
cached steps. Each instruction in the `Dockerfile` (`COPY`, `RUN`, …) produces
one layer. Docker caches them. If a layer's inputs haven't changed since last
build, Docker reuses the cached layer instead of redoing the work. This is the
single most important thing to understand for fast builds, and it's why we copy
`package.json` *before* the rest of the source (more on that below).

---

## 2. Why "multi-stage" makes the image small

A naive image would install **everything** needed to *build* the app
(TypeScript, the Nest CLI, eslint, jest, the entire `node_modules` with
devDependencies) and then *also* carry all of it into production — even though
production only needs the compiled JavaScript and the production dependencies.
That's hundreds of extra megabytes of tooling you never run in prod.

A **multi-stage build** uses two `FROM` blocks in one Dockerfile:

1. **`builder` stage** — has the full toolchain. It compiles TypeScript into
   plain JS (`dist/`) and generates the Prisma client. This stage can be as fat
   as it likes; it's throwaway.
2. **`runner` stage** — starts *fresh* from a clean base image and copies in
   **only** the finished artifacts (`dist/`) plus production-only dependencies.

The builder stage never ships. Only the runner stage becomes the final image.
Result: a lean production image with zero build tooling inside it.

---

## 3. Our Dockerfile, line by line

### Builder stage

| Instruction | What it does and why |
|---|---|
| `FROM node:22-slim AS builder` | Start from a small Debian image with Node 22 (matches `engines.node: 22.x` in package.json). `slim` = no extra OS cruft. `AS builder` names the stage so stage 2 can copy from it. |
| `WORKDIR /app` | All following commands run inside `/app`. Created if missing. |
| `apt-get install … openssl ca-certificates` | Prisma's engine binaries are linked against OpenSSL/`libssl`. The slim image may not include it, so we install it. `--no-install-recommends` + deleting `/var/lib/apt/lists` keeps the layer small. |
| `COPY package.json package-lock.json ./` | Copy **only** the dependency manifest first. This is the caching trick: the next line is the slow one, and it should only re-run when these files change. |
| `RUN npm ci --ignore-scripts` | `npm ci` = a clean, exact install from the lockfile (reproducible, unlike `npm install`). `--ignore-scripts` skips our `postinstall: prisma generate`, which would crash here because the Prisma schema hasn't been copied yet. We run generate ourselves below. |
| `COPY . .` | Now copy the rest of the source. `.dockerignore` keeps junk (node_modules, .env, .git) out. |
| `RUN npx prisma generate && npm run build` | Generate the typed Prisma client from `schema.prisma`, then compile TS → `dist/` via `nest build`. |

### Runner stage

| Instruction | What it does and why |
|---|---|
| `FROM node:22-slim AS runner` | A brand-new, clean image. Nothing from `builder` is here yet — that's the point. |
| `WORKDIR /app` | Same working dir convention. |
| `apt-get install … openssl` | Prisma needs OpenSSL at **runtime** too (to run `migrate deploy` and to query). |
| `ENV NODE_ENV=production` | Tells Nest/Node it's prod. In `main.ts` this turns Swagger off. |
| `ENV PORT=4000` | Default port. Render overrides this by injecting its own `PORT` at runtime — `main.ts` reads it via `ConfigService`. |
| `COPY package*.json ./` / `COPY prisma ./prisma` / `COPY prisma.config.ts ./` | We need the manifest+lockfile to install, and the Prisma schema/migrations/config to generate the client and run migrations. |
| `RUN npm ci --omit=dev --ignore-scripts && npx prisma generate && npm cache clean --force` | `--omit=dev` installs **production deps only** (no Nest CLI, jest, eslint…). Skip postinstall, then generate the client now that the schema is present. Clearing the cache trims the layer. |
| `COPY --from=builder /app/dist ./dist` | The payoff: pull the compiled app out of the builder stage. The heavy build tooling stays behind. |
| `RUN chown -R node:node /app` + `USER node` | Drop from root to the unprivileged built-in `node` user. If the app is ever exploited, the attacker isn't root inside the container. |
| `EXPOSE 4000` | Pure documentation/metadata — declares the port the app listens on. It does **not** actually publish the port (that's `-p`/compose `ports`). |
| `CMD ["sh","-c","npx prisma migrate deploy && node dist/main"]` | The start command. `sh -c` is needed so the `&&` runs in a shell: first apply pending DB migrations, then boot the server. |

---

## 4. Why migrations run in the start command (and the tradeoffs)

`npx prisma migrate deploy` applies any database migrations that haven't been
applied yet. We put it in the **start command** so that every time the
container boots, the database schema is brought up to date *before* the app
starts serving traffic. On Render, a new deploy = a new container start = your
migrations run automatically. You never have to remember to run them by hand.

**Why this is convenient:** zero manual migration step; deploy and schema change
ship together atomically from your point of view.

**The tradeoffs / things to know:**

- **Concurrency:** if you ever run *multiple* instances of the container, they'd
  all try to migrate at boot. `migrate deploy` takes a lock so they don't
  collide, but only one does the work. For a single-instance service (your
  case) this is a non-issue.
- **Startup coupling:** if a migration fails, the container fails to start.
  That's usually what you want (don't serve against a half-migrated DB), but it
  means a bad migration blocks the deploy.
- **It's `migrate deploy`, not `migrate dev`:** `deploy` only applies existing,
  already-created migration files — it never generates new ones and never
  prompts. That's the correct, safe command for production. You still author
  migrations locally with `prisma migrate dev`.
- **The alternative** (a separate "release" / pre-deploy step that runs
  migrations once, outside the app container) is what bigger teams use to
  decouple migration from boot. For a solo portfolio API, in-start-command is
  the right amount of simple.

This project's Prisma datasource reads `DIRECT_URL` (an unpooled connection),
which is the correct connection type for running migrations.

---

## 5. Exact local commands

> You may not have Docker installed — that's fine, Render builds in the cloud
> (next section). These are for when/if you want to test locally.

**Build the image:**

```bash
docker build -t portfolio-api .
```

**Run it directly (passing your local env file):**

```bash
docker run --rm -p 4000:4000 --env-file .env portfolio-api
```

**Or, the easy way, with compose (build + run in one go):**

```bash
docker compose up --build
```

Then open: <http://localhost:4000/api/v1/health> — you should get
`{"status":"ok", ...}`.

**Stop it:**

```bash
docker compose down          # if you used compose
# or Ctrl+C in the terminal running `docker run`
```

**Useful debugging:**

```bash
docker compose logs -f       # tail the app logs
docker images                # see the built image and its size
docker ps                    # list running containers
```

> ⚠️ Your local `.env` points at your real Neon database. `docker compose up`
> will run `prisma migrate deploy` against it on start. If everything's already
> migrated (normal case) this is a harmless no-op, but be aware of it.

---

## 6. How Render uses this file

Render has native Docker support. When you create (or already have) a **Web
Service** pointed at this repo and choose the **Docker** runtime:

1. Render clones the repo and finds the `Dockerfile` at the root.
2. It runs the **build in the cloud** — the whole multi-stage build happens on
   Render's machines, so you do **not** need Docker installed locally.
3. It injects the environment variables you've configured in the Render
   dashboard (`DIRECT_URL`, `DATABASE_URL`, `JWT_SECRET`, the Cloudinary keys,
   `ALLOWED_ORIGINS`, etc.) and its own `PORT`.
4. It starts the container, which runs our `CMD`: `prisma migrate deploy`
   (migrations applied) then `node dist/main` (server boots).
5. Render's health checks hit the service; point its health check path at
   `/api/v1/health`.

Required env vars on Render (validated at boot by Joi in
`src/config/env.validation.ts` — the app refuses to start if any are missing):
`DIRECT_URL`, `DATABASE_URL`, `JWT_SECRET` (≥32 chars), `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Optional: `ALLOWED_ORIGINS`,
`CLOUDINARY_FOLDER`, and the Resend trio (`RESEND_API_KEY`, `MAIL_FROM`,
`CONTACT_TO`).

`docker-compose.yml` is **local-only** — Render ignores it and uses the
`Dockerfile` directly.
