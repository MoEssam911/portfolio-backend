# syntax=docker/dockerfile:1

# =============================================================================
# Stage 1 — builder
# -----------------------------------------------------------------------------
# This stage has the FULL toolchain (TypeScript, the Nest CLI, all devDeps).
# Its only job is to turn our source code into a compiled `dist/` folder and a
# generated Prisma client. Nothing from this stage ships to production except
# the build artifacts we explicitly copy out in stage 2.
# =============================================================================
FROM node:22-slim AS builder

WORKDIR /app

# Prisma's engines are linked against OpenSSL. The slim image doesn't always
# ship it, so install it here too — `prisma generate` probes for it.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy ONLY the manifest + lockfile first. Docker caches each instruction as a
# layer; as long as these two files don't change, the expensive `npm ci` layer
# below is reused on every rebuild instead of re-downloading the internet.
COPY package.json package-lock.json ./

# `npm ci` = clean, reproducible install straight from the lockfile.
# `--ignore-scripts` skips this project's `postinstall: prisma generate`, which
# would fail here because we haven't copied prisma/schema.prisma yet. We run
# generate explicitly two steps down, once the schema is present.
RUN npm ci --ignore-scripts

# Now bring in the rest of the source (respecting .dockerignore).
COPY . .

# Generate the Prisma client (reads prisma/schema.prisma -> writes the typed
# client into node_modules/.prisma) then compile TypeScript -> dist/.
RUN npx prisma generate \
  && npm run build


# =============================================================================
# Stage 2 — runner
# -----------------------------------------------------------------------------
# The lean image that actually runs in production. It starts FRESH from the
# base image (so none of the builder's devDependencies or source tree come
# along) and pulls in only: production deps, a generated Prisma client, the
# compiled dist/, and the prisma/ folder needed to run migrations.
# =============================================================================
FROM node:22-slim AS runner

WORKDIR /app

# Same OpenSSL requirement as above — Prisma's query/migration engines need it
# at RUNTIME, not just at generate time.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Tell Nest/Node we're in production (disables Swagger, etc.). PORT defaults to
# 4000 but Render overrides it by injecting its own PORT env var at runtime.
ENV NODE_ENV=production
ENV PORT=4000

# We need the manifest, the lockfile, the Prisma schema/migrations, and the
# Prisma config to (a) install prod deps and (b) generate the client + run
# migrations. prisma.config.ts is what the Prisma CLI reads for the datasource.
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# Install ONLY production dependencies (`--omit=dev` drops the Nest CLI, jest,
# eslint, etc.), skip the postinstall script, then generate the client once the
# schema is in place. Clearing the npm cache shaves a few more MB off the image.
RUN npm ci --omit=dev --ignore-scripts \
  && npx prisma generate \
  && npm cache clean --force

# Pull the compiled app out of the builder stage. This is the multi-stage
# payoff: the heavy build tooling stays behind; only dist/ crosses over.
COPY --from=builder /app/dist ./dist

# Run as the unprivileged `node` user (uid 1000) that the base image provides,
# instead of root. If the app is ever compromised it has far less power.
RUN chown -R node:node /app
USER node

# Documents the port the container listens on (metadata only; doesn't publish).
EXPOSE 4000

# On every container start: apply any pending DB migrations, then boot the app.
# Shell form (`sh -c`) is required so the `&&` is evaluated by a shell.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
