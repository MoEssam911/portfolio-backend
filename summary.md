# Project Summary — portfolio-api

## Purpose

- A minimal backend API for a personal portfolio blog: manage users and blog posts, with JWT-based authentication and Prisma-backed PostgreSQL persistence.

## Tech Stack

- Framework: NestJS (TypeScript)
- ORM: Prisma (PostgreSQL)
- Auth: JWT via `@nestjs/jwt`, `passport-jwt`, `bcrypt`
- Validation: `class-validator` / `class-transformer`
- Testing: `jest`, `supertest` (dev)

## How to run (local)

1. Install deps

```bash
npm install
```

2. Set environment variables (example)

```bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
export DIRECT_URL="$DATABASE_URL"
export JWT_SECRET="your_jwt_secret"
export PORT=3000
```

3. Prepare the DB and seed

````bash
# Project Summary — portfolio-api

## What this project is
This is a NestJS API for a portfolio/blog backend. It currently supports authentication with JWT, public blog reading, private blog management, Prisma-based PostgreSQL persistence, validation, custom error handling, and standardized API responses.

## Current architecture
- `src/main.ts` bootstraps the app with a global `/api` prefix and URI versioning (`/v1`).
- Requests are validated globally with `ValidationPipe`.
- Errors are normalized by custom filters for HTTP exceptions and Prisma errors.
- Responses are wrapped by a global interceptor so everything comes back in a consistent shape.
- `PrismaService` is the shared DB access layer.
- `AuthModule` handles login and JWT validation.
- `BlogModule` handles public blog reads and authenticated blog writes.

## How to run it locally
1. Install dependencies.

```bash
npm install
````

2. Set the required environment variables.

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
DIRECT_URL="postgresql://user:pass@localhost:5432/db?schema=public"
JWT_SECRET="your_jwt_secret"
PORT=3000
```

3. Generate Prisma client, apply migrations, and seed the admin user.

```bash
npx prisma generate
npx prisma migrate dev
npx ts-node prisma/seed.ts
```

4. Start development mode.

```bash
npm run start:dev
```

## Database model summary

- `User` stores `email`, `username`, `passwordHash`, timestamps, and the blog posts owned by that user.
- `BlogPost` stores `title`, `slug`, `excerpt`, `content`, `published`, ownership via `userId`, and timestamps.
- `slug` and the user identity fields are unique, so Prisma and the custom Prisma exception filter matter when duplicates happen.

## File map

### Root files

- [package.json](package.json) defines scripts, dependencies, Prisma seed command, and Jest configuration.
- [package-lock.json](package-lock.json) is the npm dependency lockfile.
- [README.md](README.md) is the default NestJS starter README and does not describe the project-specific business logic in detail.
- [summary.md](summary.md) is this project map for an LLM or future contributor.
- [nest-cli.json](nest-cli.json) configures the Nest CLI source root and build behavior.
- [eslint.config.mjs](eslint.config.mjs) configures ESLint, TypeScript linting, and Prettier integration.
- [tsconfig.json](tsconfig.json) configures the main TypeScript compiler options.
- [tsconfig.build.json](tsconfig.build.json) configures the production build TypeScript exclusions.
- [.prettierrc](.prettierrc) defines formatting rules such as single quotes and trailing commas.
- [.editorconfig](.editorconfig) defines editor conventions like 2-space indentation and CRLF line endings.
- [.gitignore](.gitignore) excludes build output, local env files, IDE files, logs, and generated Prisma output.

### Prisma files

- [prisma/schema.prisma](prisma/schema.prisma) defines the database schema and Prisma generator/datasource setup.
- [prisma/seed.ts](prisma/seed.ts) creates a default admin user if one does not already exist.
- [prisma/migrations/migration_lock.toml](prisma/migrations/migration_lock.toml) records the Prisma migration provider (`postgresql`).
- [prisma/migrations/20260524074946_init/migration.sql](prisma/migrations/20260524074946_init/migration.sql) creates the initial `BlogPost` table and its unique slug index.
- [prisma/migrations/20260525110750_add_users/migration.sql](prisma/migrations/20260525110750_add_users/migration.sql) adds the `User` table, links blog posts to users, and creates the foreign key.

### App bootstrap and shared infrastructure

- [src/app.module.ts](src/app.module.ts) composes the application by importing `PrismaModule`, `BlogModule`, and `AuthModule`.
- [src/main.ts](src/main.ts) sets the global prefix, enables versioning, installs validation, installs exception filters, and installs the response interceptor.
- [src/prisma/prisma.module.ts](src/prisma/prisma.module.ts) exposes `PrismaService` globally across the app.
- [src/prisma/prisma.service.ts](src/prisma/prisma.service.ts) extends `PrismaClient` and connects to the database when the module initializes.

### Shared `common/` files

- [src/common/dto/pagination-query.dto.ts](src/common/dto/pagination-query.dto.ts) validates `page` and `limit` query parameters and converts them to numbers.
- [src/common/interfaces/paginated-response.interface.ts](src/common/interfaces/paginated-response.interface.ts) defines the paginated API response shape.
- [src/common/utils/pagination.util.ts](src/common/utils/pagination.util.ts) builds pagination metadata such as total pages and next/previous flags.
- [src/common/interceptors/transform-response.interceptor.ts](src/common/interceptors/transform-response.interceptor.ts) wraps successful responses in a consistent `{ success, data }` format and preserves pagination metadata.
- [src/common/filters/http-exception.filter.ts](src/common/filters/http-exception.filter.ts) converts Nest HTTP exceptions into a normalized error response.
- [src/common/filters/prisma-exception.filter.ts](src/common/filters/prisma-exception.filter.ts) converts Prisma known request errors into user-friendly HTTP responses, especially unique constraint and not-found cases.

### Auth module files

- [src/modules/auth/auth.module.ts](src/modules/auth/auth.module.ts) wires Prisma, JWT, the auth controller, the auth service, and the JWT strategy.
- [src/modules/auth/auth.controller.ts](src/modules/auth/auth.controller.ts) exposes the login endpoint at `POST /api/v1/auth/login`.
- [src/modules/auth/auth.service.ts](src/modules/auth/auth.service.ts) checks credentials, compares passwords with bcrypt, and generates JWT access tokens.
- [src/modules/auth/dto/login.dto.ts](src/modules/auth/dto/login.dto.ts) validates the login payload (`email` and `password`).
- [src/modules/auth/guards/jwt-auth.guard.ts](src/modules/auth/guards/jwt-auth.guard.ts) protects private routes with Passport JWT auth.
- [src/modules/auth/strategies/jwt.strategy.ts](src/modules/auth/strategies/jwt.strategy.ts) extracts bearer tokens, validates them against the JWT secret, and loads the user from Prisma.
- [src/modules/auth/decorators/current-user.decorator.ts](src/modules/auth/decorators/current-user.decorator.ts) provides a `GetUser()` decorator to access the authenticated user from the request.
- [src/modules/auth/types/current-user.type.ts](src/modules/auth/types/current-user.type.ts) defines the authenticated user object shape used in controllers.
- [src/modules/auth/types/jwt-payload.type.ts](src/modules/auth/types/jwt-payload.type.ts) defines the JWT payload shape stored in access tokens.

### Blog module files

- [src/modules/blog/blog.module.ts](src/modules/blog/blog.module.ts) registers the public and private blog controllers plus the blog service.
- [src/modules/blog/blog-public.controller.ts](src/modules/blog/blog-public.controller.ts) exposes public blog reads with pagination and slug lookup.
- [src/modules/blog/blog-private.controller.ts](src/modules/blog/blog-private.controller.ts) exposes authenticated create, update, and delete endpoints for blog posts.
- [src/modules/blog/blog.service.ts](src/modules/blog/blog.service.ts) contains the blog business logic: slug generation, create/update/remove operations, public listing, and single-post lookup.
- [src/modules/blog/dto/create-blog.dto.ts](src/modules/blog/dto/create-blog.dto.ts) validates blog creation input.
- [src/modules/blog/dto/update-blog.dto.ts](src/modules/blog/dto/update-blog.dto.ts) makes the create DTO partial for updates.

## What the API currently does

- Logs users in with email and password.
- Returns a JWT access token plus basic user info on successful login.
- Allows anyone to list blog posts and fetch a post by slug.
- Requires authentication to create, update, or delete blog posts.
- Auto-generates blog slugs from titles.
- Returns normalized success and error payloads.

## Seeded data and assumptions

- The seed script creates an admin user with email `admin@portfolio.com`, username `admin`, and password `Admin12345` if that user does not already exist.
- The project expects `DATABASE_URL`, `DIRECT_URL`, and `JWT_SECRET` to be present before running Prisma or starting the app.
- Prisma configuration is set up for PostgreSQL, and migrations should use the correct direct database connection when needed.

## Good next steps for continuing the project

1. Add tests for auth login, protected blog routes, and public blog pagination.
2. Add Swagger/OpenAPI docs so the endpoints are easier to inspect and continue from.
3. Add richer blog filters and search if the portfolio needs discovery features.
4. Extend auth with refresh tokens or additional user management flows if needed.

## Notes for the next LLM

- Start from the file map above, then inspect the auth and blog service files for the actual behavior.
- The most important runtime flow is: request enters `main.ts`, gets validated and filtered, then routes into `AuthModule` or `BlogModule`, which use Prisma for storage.
- If you need to continue development, the best anchors are [src/modules/auth/auth.service.ts](src/modules/auth/auth.service.ts), [src/modules/blog/blog.service.ts](src/modules/blog/blog.service.ts), and [prisma/schema.prisma](prisma/schema.prisma).
