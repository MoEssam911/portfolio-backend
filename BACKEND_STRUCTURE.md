# Backend Structure — `portfolio-api`

> Reference document for frontend API integration planning.
> Generated from a full read of the codebase. **No code was modified.**

This is the backend for Mohamed Essam's personal portfolio + lightweight CMS. It serves a
**public-facing portfolio site** (read-only data) and a **private dashboard** (authenticated CRUD)
from a single NestJS application.

---

# Stack

| Concern | Choice |
|---|---|
| Framework | [NestJS](https://nestjs.com) v11 |
| Language | TypeScript 5.7 |
| Runtime | Node.js (Express platform — `@nestjs/platform-express`) |
| Database | PostgreSQL |
| ORM | Prisma v6 (`@prisma/client`) |
| Auth | JWT (Bearer token) via `@nestjs/jwt` + Passport (`passport-jwt`) |
| Password hashing | `bcrypt` (cost factor 12) |
| File storage | Supabase Storage (`@supabase/supabase-js`) |
| File uploads | Multer (memory storage) |
| Validation | `class-validator` + `class-transformer` (global `ValidationPipe`) |
| Env validation | Joi |
| Rate limiting | `@nestjs/throttler` (global guard) |
| Security headers | `helmet` |
| API docs | Swagger / OpenAPI (`@nestjs/swagger`) — **dev only** |
| Slugs | `slugify` |

### Global request pipeline (configured in `src/main.ts`)
- **Global prefix:** `api`
- **URI versioning:** default version `1` → every route is under `/api/v1/...`
- **CORS:** origins from `ALLOWED_ORIGINS`; methods `GET, POST, PATCH, DELETE, OPTIONS`; credentials enabled
- **`ValidationPipe`:** `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
  (unknown body fields are **rejected**, not stripped)
- **Global throttler:** 100 requests / 60s per client (login is stricter — see Auth)
- **Global exception filters:** `PrismaExceptionFilter`, `HttpExceptionFilter`
- **Global response interceptor:** `TransformResponseInterceptor` (wraps all responses — see below)
- **Swagger UI:** `GET /api/docs` (only when `NODE_ENV !== 'production'`)

### Standard response envelope
Every successful response is wrapped by `TransformResponseInterceptor`:

```jsonc
// Non-paginated
{ "success": true, "data": <payload> }

// Paginated (when the service returns { data, meta })
{ "success": true, "data": [...], "meta": { ... } }
```

Error responses (from the filters) look like:

```jsonc
{
  "success": false,
  "statusCode": 409,
  "timestamp": "2026-06-08T12:00:00.000Z",
  "path": "/api/v1/dashboard/blogs",
  "message": "slug already exists",
  "errors": ["title must be longer than ..."]  // only present on validation failures
}
```

> ⚠️ **Note for frontend:** the `media` list endpoint returns a *different* pagination shape
> (`{ items, total, page, limit }`) than every other paginated endpoint (`{ data, meta }`).
> See [What's Missing or Needs Attention](#whats-missing-or-needs-attention).

---

# Project Structure

```
portfolio-api/
├── prisma/
│   ├── schema.prisma            # Single source of truth for the DB schema (all models)
│   ├── seed.ts                  # Seeds the single owner User from SEED_* env vars
│   └── migrations/              # 12 timestamped SQL migrations (history below)
├── prisma.config.ts             # Prisma CLI config
├── scripts/                     # (present; empty / utility scripts)
├── src/
│   ├── main.ts                  # Bootstrap: prefix, versioning, CORS, helmet, pipes, filters, swagger
│   ├── app.module.ts            # Root module: config, throttler, wires all feature modules
│   │
│   ├── auth/                    # Authentication (JWT login)
│   │   ├── auth.controller.ts   # POST /auth/login
│   │   ├── auth.service.ts      # Credential check + token signing
│   │   ├── auth.module.ts       # Registers JwtModule async
│   │   ├── dto/login.dto.ts
│   │   ├── guards/jwt-auth.guard.ts        # JwtAuthGuard (extends AuthGuard('jwt'))
│   │   ├── strategies/jwt.strategy.ts      # Validates token, loads user from DB
│   │   ├── decorators/current-user.decorator.ts  # @GetUser() param decorator
│   │   └── types/                          # CurrentUser, JwtPayload interfaces
│   │
│   ├── blog/                    # Blog posts (public read + dashboard CRUD)
│   │   ├── controllers/public-blog.controller.ts
│   │   ├── controllers/private-blog.controller.ts
│   │   ├── blog.service.ts
│   │   ├── blog.module.ts       # imports MediaModule (cover image validation)
│   │   └── dto/{create,update}-blog.dto.ts
│   │
│   ├── projects/               # Portfolio projects (public read + dashboard CRUD)
│   │   ├── controllers/{public,private}-projects.controller.ts
│   │   ├── projects.service.ts
│   │   ├── projects.module.ts
│   │   └── dto/{create,update}-project.dto.ts
│   │
│   ├── resume/                 # Resume profile + sub-resources (experiences, education, etc.)
│   │   ├── controllers/{public,private}-resume.controller.ts
│   │   ├── resume.service.ts
│   │   └── dto/                # create/update DTOs per sub-resource + reorder.dto
│   │
│   ├── services/              # "Services offered" cards (public read + dashboard CRUD)
│   │   ├── controllers/{public,private}-services.controller.ts
│   │   ├── services.service.ts
│   │   └── dto/{create,update}-service.dto.ts, reorder-services.dto.ts
│   │
│   ├── testimonials/         # Client testimonials (public read + dashboard CRUD)
│   │   ├── controllers/{public,private}-testimonials.controller.ts
│   │   ├── testimonials.service.ts
│   │   └── dto/{create,update}-testimonial.dto.ts, reorder-testimonials.dto.ts
│   │
│   ├── settings/             # Singleton site settings (public read + dashboard upsert)
│   │   ├── controllers/{public,private}-settings.controller.ts
│   │   ├── settings.service.ts
│   │   └── dto/update-settings.dto.ts
│   │
│   ├── media/                # File uploads to Supabase Storage (dashboard only)
│   │   ├── controllers/private-media.controller.ts
│   │   ├── media.service.ts   # upload/list/get/update/delete + ownership validators
│   │   ├── media.module.ts    # Multer memoryStorage; exports MediaService
│   │   └── dto/update-media.dto.ts
│   │
│   ├── prisma/               # PrismaService (connect/disconnect lifecycle) + global module
│   │
│   ├── config/               # Typed config factories + Joi env schema
│   │   ├── app.config.ts      # env, port, allowedOrigins
│   │   ├── jwt.config.ts      # secret, expiresIn
│   │   ├── supabase.config.ts # url, serviceRoleKey, bucket
│   │   └── env.validation.ts  # Joi schema for required env vars
│   │
│   └── common/               # Cross-cutting concerns
│       ├── constants/        # PRIVATE_API_PREFIX = 'dashboard'; SITE_OWNER_EMAIL
│       ├── dto/pagination-query.dto.ts     # page/limit query params
│       ├── filters/          # HttpExceptionFilter, PrismaExceptionFilter
│       ├── interceptors/transform-response.interceptor.ts
│       ├── interfaces/paginated-response.interface.ts
│       └── utils/            # buildPaginationMeta(), assertOwnership()
├── BACKEND_LESSONS.md         # Author's learning notes (not part of the API)
└── README.md
```

### Route prefix conventions
- **Public** controllers mount under `/api/v1/<resource>` (no auth).
- **Private** controllers mount under `/api/v1/dashboard/<resource>` (JWT required).
  The `dashboard` segment comes from `PRIVATE_API_PREFIX` in `src/common/constants/routes.constant.ts`.

> Note: the public **blog** and **projects** controllers use `path: ''`, so their routes are
> `/api/v1/blogs` and `/api/v1/projects` (the resource name lives on the `@Get()` decorator).

---

# API Endpoints

All paths below are shown **with** the `/api/v1` prefix. `dashboard/*` routes require a
`Authorization: Bearer <token>` header. Responses are wrapped in the `{ success, data }`
envelope described above (omitted per-endpoint for brevity).

## Auth

### `POST /api/v1/auth/login`
- **Does:** Authenticates by email + password, returns a signed JWT access token.
- **Auth:** No
- **Rate limit:** 10 requests / 60s (stricter than the global 100/60s)
- **Body:**
  ```ts
  { email: string (valid email), password: string }
  ```
- **Response `data`:**
  ```ts
  {
    accessToken: string,
    user: { id: string, email: string, username: string }
  }
  ```
- **Notes:** Returns `401 Invalid credentials` for both unknown email and wrong password
  (no user enumeration). There is **no register, logout, refresh, or password-reset endpoint** —
  the owner user is created via the seed script.

---

## Blog

Data shape returned includes `coverImage` (Media or null) and `tags` (Tag[]).

### Public

#### `GET /api/v1/blogs`
- **Does:** Lists **published** blog posts, newest first, paginated.
- **Auth:** No
- **Query:** `page?` (int ≥1, default 1), `limit?` (int 1–100, default 10)
- **Response:** paginated `{ data: BlogPost[], meta }`

#### `GET /api/v1/blogs/:slug`
- **Does:** Fetch a single **published** post by slug.
- **Auth:** No
- **Params:** `slug: string`
- **Response:** `BlogPost`
- **Notes:** Returns `404` if not found **or** not published.

### Dashboard

#### `GET /api/v1/dashboard/blogs`
- **Does:** Lists **all** posts (published + drafts), newest first, paginated.
- **Auth:** Yes (any logged-in user)
- **Query:** `page?`, `limit?`

#### `GET /api/v1/dashboard/blogs/:slug`
- **Does:** Fetch any post by slug (published or draft).
- **Auth:** Yes
- **Notes:** Uses `findUniqueOrThrow` → `404` (mapped by Prisma filter) if slug missing.

#### `POST /api/v1/dashboard/blogs`
- **Does:** Creates a post. `slug` is auto-generated from `title` via `slugify`.
- **Auth:** Yes
- **Body (`CreateBlogDto`):**
  ```ts
  {
    title: string,            // min 5 chars
    excerpt?: string,
    content: string,          // min 20 chars
    published?: boolean,      // default false
    coverImageId?: string,    // must be a Media owned by the current user
    tags?: string[]           // tag names; connect-or-created by slug
  }
  ```
- **Notes:** `coverImageId` is validated to belong to the user (`400 Invalid media reference` otherwise).
  Duplicate title → duplicate slug → `409 ... already exists`.

#### `PATCH /api/v1/dashboard/blogs/:id`
- **Does:** Updates a post (owner-only). Changing `title` regenerates `slug`.
- **Auth:** Yes (ownership enforced — `403` if not owner, `404` if not found)
- **Params:** `id: string` (note: update/delete use **id**, reads use **slug**)
- **Body (`UpdateBlogDto`):** all `CreateBlogDto` fields optional. Passing `tags`
  (even `[]`) replaces the full tag set.

#### `DELETE /api/v1/dashboard/blogs/:id`
- **Does:** Deletes a post (owner-only).
- **Auth:** Yes

---

## Projects

Data shape includes `thumbnail` (Media or null) and `gallery` (ordered `ProjectGalleryImage[]`,
each with nested `media`).

### Public

#### `GET /api/v1/projects`
- **Does:** Lists **published** projects, ordered by `featured` desc then `createdAt` desc, paginated.
- **Auth:** No
- **Query:** `page?`, `limit?`

#### `GET /api/v1/projects/:slug`
- **Does:** Fetch a single **published** project by slug.
- **Auth:** No
- **Notes:** `404` if missing or unpublished.

### Dashboard

#### `GET /api/v1/dashboard/projects`
- **Does:** Lists **all** projects (published + drafts), paginated, same ordering.
- **Auth:** Yes

#### `GET /api/v1/dashboard/projects/:slug`
- **Does:** Fetch any project by slug. `findUniqueOrThrow` → `404` if missing.
- **Auth:** Yes

#### `POST /api/v1/dashboard/projects`
- **Does:** Creates a project; `slug` auto-generated from `title`.
- **Auth:** Yes
- **Body (`CreateProjectDto`):**
  ```ts
  {
    title: string,             // min 3
    excerpt?: string,
    description: string,       // min 20
    liveUrl?: string,          // valid URL
    repoUrl?: string,          // valid URL
    featured?: boolean,        // default false
    published?: boolean,       // default false
    thumbnailId?: string,      // Media owned by user
    galleryImageIds?: string[],// Media owned by user; order = array index
    technologies?: string[]    // free-text tech tags
  }
  ```
- **Notes:** `thumbnailId` and every `galleryImageIds` entry are validated for ownership
  (`400` otherwise). Gallery rows are created with `order` = position in array.

#### `PATCH /api/v1/dashboard/projects/:id`
- **Does:** Updates a project (owner-only). Changing `title` regenerates `slug`.
  If `galleryImageIds` is provided, the existing gallery is wiped and recreated (in a transaction).
- **Auth:** Yes (`403`/`404` as with blog)
- **Body:** all `CreateProjectDto` fields optional.

#### `DELETE /api/v1/dashboard/projects/:id`
- **Does:** Deletes a project (owner-only). Gallery rows cascade-delete.
- **Auth:** Yes

---

## Resume

The resume is a **singleton profile** with five ordered child collections: experiences,
educations, skill groups, certifications, links. The profile is **auto-created (upserted)**
on first dashboard access — there is no explicit "create profile" endpoint.

### Public

#### `GET /api/v1/resume`
- **Does:** Returns the (first) resume profile with all child collections, each ordered by `order` asc.
- **Auth:** No
- **Response:** `ResumeProfile` with `experiences[]`, `educations[]`, `skillGroups[]`,
  `certifications[]`, `links[]`.
- **Notes:** `404 Resume not found` if no profile exists yet.

### Dashboard — Profile

#### `GET /api/v1/dashboard/resume`
- **Does:** Returns the current user's profile (upserts an empty one if none exists), with children.
- **Auth:** Yes

#### `PATCH /api/v1/dashboard/resume`
- **Does:** Updates profile fields.
- **Auth:** Yes
- **Body (`UpdateResumeProfileDto`):**
  ```ts
  {
    headline?: string,    // max 120
    summary?: string,
    location?: string,    // max 100
    downloadUrl?: string  // valid URL
  }
  ```

### Dashboard — Experiences

#### `POST /api/v1/dashboard/resume/experiences`
- **Body (`CreateExperienceDto`):**
  ```ts
  {
    company: string,      // min 2
    title: string,        // min 2
    location?: string,
    startDate: string,    // ISO date string
    endDate?: string,     // ISO date string
    current?: boolean,    // default false
    bullets?: string[],
    order?: number        // int ≥0, default 0
  }
  ```
#### `PATCH /api/v1/dashboard/resume/experiences/reorder`
- **Body (`ReorderDto`):** `{ items: { id: string, order: number }[] }` (≥1 item). Returns nothing meaningful.
#### `PATCH /api/v1/dashboard/resume/experiences/:id` — partial of `CreateExperienceDto`.
#### `DELETE /api/v1/dashboard/resume/experiences/:id`
- **Auth:** Yes for all. Ownership verified via the profile (`404 Experience not found` if not owned).

### Dashboard — Educations

#### `POST /api/v1/dashboard/resume/educations`
- **Body (`CreateEducationDto`):**
  ```ts
  {
    school: string,       // min 2
    degree: string,       // min 2
    field?: string,
    startDate?: string,   // ISO date
    endDate?: string,     // ISO date
    current?: boolean,    // default false
    description?: string,
    order?: number
  }
  ```
#### `PATCH /api/v1/dashboard/resume/educations/reorder` — `ReorderDto`
#### `PATCH /api/v1/dashboard/resume/educations/:id` — partial
#### `DELETE /api/v1/dashboard/resume/educations/:id`

### Dashboard — Skill Groups

#### `POST /api/v1/dashboard/resume/skill-groups`
- **Body (`CreateSkillGroupDto`):**
  ```ts
  {
    name: string,         // min 1
    skills: string[],     // required, at least 1
    order?: number
  }
  ```
#### `PATCH /api/v1/dashboard/resume/skill-groups/reorder` — `ReorderDto`
#### `PATCH /api/v1/dashboard/resume/skill-groups/:id` — partial
#### `DELETE /api/v1/dashboard/resume/skill-groups/:id`

### Dashboard — Certifications

#### `POST /api/v1/dashboard/resume/certifications`
- **Body (`CreateCertificationDto`):**
  ```ts
  {
    name: string,         // min 2
    issuer: string,       // min 2
    issueDate?: string,   // ISO date
    expiryDate?: string,  // ISO date
    url?: string,         // valid URL
    order?: number
  }
  ```
#### `PATCH /api/v1/dashboard/resume/certifications/reorder` — `ReorderDto`
#### `PATCH /api/v1/dashboard/resume/certifications/:id` — partial
#### `DELETE /api/v1/dashboard/resume/certifications/:id`

### Dashboard — Links

#### `POST /api/v1/dashboard/resume/links`
- **Body (`CreateResumeLinkDto`):**
  ```ts
  {
    label: string,        // min 1
    url: string,          // valid URL, required
    order?: number
  }
  ```
#### `PATCH /api/v1/dashboard/resume/links/reorder` — `ReorderDto`
#### `PATCH /api/v1/dashboard/resume/links/:id` — partial
#### `DELETE /api/v1/dashboard/resume/links/:id`

> **Route ordering note:** the `/reorder` routes are declared **before** `/:id` routes in the
> controller so they aren't captured as an `id`. Keep `reorder` as a literal path on the frontend.

---

## Services

"Services offered" cards. Ordered by `order` asc.

### Public

#### `GET /api/v1/services`
- **Does:** Lists **published** services, ordered by `order` asc.
- **Auth:** No
- **Response:** `Service[]` (not paginated)

### Dashboard

#### `GET /api/v1/dashboard/services`
- **Does:** Lists all of the current user's services (any published state).
- **Auth:** Yes

#### `GET /api/v1/dashboard/services/:id`
- **Does:** Fetch one owned service. `404` if not found / not owned.
- **Auth:** Yes

#### `POST /api/v1/dashboard/services`
- **Body (`CreateServiceDto`):**
  ```ts
  {
    title: string,        // required, max 150
    description: string,  // required, max 2000
    priceRange?: string,  // max 100
    icon?: string,        // max 50 (icon name/key)
    featured?: boolean,   // default false
    published?: boolean    // default false
  }
  ```
#### `PATCH /api/v1/dashboard/services/reorder`
- **Body (`ReorderServicesDto`):** `{ items: { id: string, order: number }[] }`. Returns `{ success: true }`.
#### `PATCH /api/v1/dashboard/services/:id` — partial of `CreateServiceDto`.
#### `DELETE /api/v1/dashboard/services/:id` — returns `{ success: true }`.

---

## Testimonials

Data shape includes `avatar` (Media or null). Ordered by `order` asc.

### Public

#### `GET /api/v1/testimonials`
- **Does:** Lists **published** testimonials with avatar, ordered by `order` asc.
- **Auth:** No
- **Response:** `Testimonial[]` (not paginated)

### Dashboard

#### `GET /api/v1/dashboard/testimonials` — all of the user's testimonials. **Auth:** Yes
#### `GET /api/v1/dashboard/testimonials/:id` — one owned testimonial; `404` otherwise. **Auth:** Yes
#### `POST /api/v1/dashboard/testimonials`
- **Body (`CreateTestimonialDto`):**
  ```ts
  {
    name: string,         // required, max 100
    role: string,         // required, max 100
    company?: string,     // max 100
    quote: string,        // required, max 1000
    avatarId?: string,    // Media id (NOT ownership-validated — see notes)
    featured?: boolean,   // default false
    published?: boolean    // default false
  }
  ```
#### `PATCH /api/v1/dashboard/testimonials/reorder` — `ReorderTestimonialsDto`, returns `{ success: true }`
#### `PATCH /api/v1/dashboard/testimonials/:id` — partial
#### `DELETE /api/v1/dashboard/testimonials/:id` — returns `{ success: true }`

---

## Settings

A **singleton** per-user settings record (one owner → one settings row).

### Public

#### `GET /api/v1/settings`
- **Does:** Returns the public-safe subset of site settings (the first settings row).
- **Auth:** No
- **Response:** `null` if no settings exist yet, otherwise:
  ```ts
  {
    siteTitle, siteDescription, heroTitle, heroSubtitle, about,
    githubUrl, linkedinUrl, twitterUrl, contactEmail,
    resumeFileUrl, availableForWork
  }
  ```
  (`id`, timestamps, and `userId` are stripped.)

### Dashboard

#### `GET /api/v1/dashboard/settings`
- **Does:** Returns the current user's full settings row (or `null` if none).
- **Auth:** Yes

#### `PATCH /api/v1/dashboard/settings`
- **Does:** **Upserts** settings for the user (creates with sensible defaults if absent, else updates).
- **Auth:** Yes
- **Body (`UpdateSettingsDto`):** all optional —
  ```ts
  {
    siteTitle?: string (max 70),
    siteDescription?: string (max 160),
    heroTitle?: string,
    heroSubtitle?: string,
    about?: string,
    githubUrl?: string (URL),
    linkedinUrl?: string (URL),
    twitterUrl?: string (URL),
    contactEmail?: string (email),
    resumeFileUrl?: string (URL),
    availableForWork?: boolean
  }
  ```
- **Notes:** On first create, required string fields default to `''` (or `'My Portfolio'` for
  `siteTitle`) and `availableForWork` defaults to `true`.

---

## Media

File uploads to Supabase Storage. **Dashboard only — no public media endpoints.**

#### `POST /api/v1/dashboard/media/upload`
- **Does:** Uploads a file to Supabase Storage and creates a `Media` record.
- **Auth:** Yes
- **Body:** `multipart/form-data` with field name **`file`**.
- **Constraints:** max **10 MB**; allowed MIME types: `image/jpeg`, `image/png`, `image/webp`,
  `application/pdf`. Others → `400 Unsupported file type`.
- **Storage key:** `media/<userId>/<uuid>.<ext>`; returns a public URL.
- **Response:** the created `Media` record (see Data Models).

#### `GET /api/v1/dashboard/media`
- **Does:** Lists the user's media, newest first, paginated.
- **Auth:** Yes
- **Query:** `page?`, `limit?` (defaults applied in service: page 1, **limit 20**)
- **Response:** ⚠️ **non-standard shape** — `{ items: Media[], total, page, limit }`
  (then wrapped in the standard `{ success, data }` envelope, so the client reads
  `data.items` / `data.total`, **not** `data` + `meta`).

#### `GET /api/v1/dashboard/media/:id` — one owned media record; `404` otherwise. **Auth:** Yes
#### `PATCH /api/v1/dashboard/media/:id`
- **Body (`UpdateMediaDto`):** `{ alt?: string (max 255), caption?: string (max 500) }`
- **Auth:** Yes
#### `DELETE /api/v1/dashboard/media/:id`
- **Does:** Removes the object from Supabase Storage **and** deletes the DB row. Returns `{ success: true }`.
- **Auth:** Yes
- **Notes:** No check for whether the media is still referenced by a blog/project/testimonial.

---

# Data Models

Defined in `prisma/schema.prisma`. Database: PostgreSQL. All IDs are **`cuid`** strings.
`createdAt`/`updatedAt` are present on most models (auto-managed).

### `User`
| Field | Type | Constraints |
|---|---|---|
| id | String | PK, cuid |
| email | String | **unique** |
| username | String | **unique** |
| passwordHash | String | bcrypt hash |
| createdAt / updatedAt | DateTime | auto |

Relations: `blogPosts[]`, `resumeProfile?` (1:1), `projects[]`, `settings?` (1:1),
`media[]`, `testimonials[]`, `services[]`. Deleting a user cascades to all of these.

> The system is effectively **single-owner**: the seed script creates one user, and there is
> no signup. Ownership checks throughout compare against the logged-in user's id.

### `BlogPost`
| Field | Type | Constraints |
|---|---|---|
| id | String | PK |
| title | String | |
| slug | String | **unique** (generated from title) |
| excerpt | String? | nullable |
| content | String | |
| published | Boolean | default `false` |
| coverImageId | String? | FK → Media (relation `BlogCoverImage`) |
| tags | Tag[] | many-to-many |
| userId | String | FK → User (cascade delete) |
| createdAt / updatedAt | DateTime | |

### `Tag`
| Field | Type | Constraints |
|---|---|---|
| id | String | PK |
| name | String | **unique** |
| slug | String | **unique** |
| posts | BlogPost[] | many-to-many |

### `ResumeProfile` (1:1 with User)
| Field | Type | Constraints |
|---|---|---|
| id | String | PK |
| headline | String? | |
| summary | String? | |
| location | String? | |
| downloadUrl | String? | |
| userId | String | **unique**, FK → User (cascade) |
| createdAt / updatedAt | DateTime | |

Children (all cascade-delete with the profile, all ordered by `order`):

### `Experience`
| Field | Type | Constraints |
|---|---|---|
| id | String | PK |
| company | String | |
| title | String | |
| location | String? | |
| startDate | DateTime | required |
| endDate | DateTime? | |
| current | Boolean | default `false` |
| bullets | String[] | |
| order | Int | default 0 |
| profileId | String | FK → ResumeProfile (cascade) |

### `Education`
| Field | Type | Constraints |
|---|---|---|
| id | String | PK |
| school | String | |
| degree | String | |
| field | String? | |
| startDate | DateTime? | |
| endDate | DateTime? | |
| current | Boolean | default `false` |
| description | String? | |
| order | Int | default 0 |
| profileId | String | FK → ResumeProfile (cascade) |

### `SkillGroup`
| Field | Type | Constraints |
|---|---|---|
| id | String | PK |
| name | String | |
| skills | String[] | |
| order | Int | default 0 |
| profileId | String | FK → ResumeProfile (cascade) |

### `Certification`
| Field | Type | Constraints |
|---|---|---|
| id | String | PK |
| name | String | |
| issuer | String | |
| issueDate | DateTime? | |
| expiryDate | DateTime? | |
| url | String? | |
| order | Int | default 0 |
| profileId | String | FK → ResumeProfile (cascade) |

### `ResumeLink`
| Field | Type | Constraints |
|---|---|---|
| id | String | PK |
| label | String | |
| url | String | |
| order | Int | default 0 |
| profileId | String | FK → ResumeProfile (cascade) |

### `Project`
| Field | Type | Constraints |
|---|---|---|
| id | String | PK |
| title | String | |
| slug | String | **unique** |
| excerpt | String? | |
| description | String | |
| liveUrl | String? | |
| repoUrl | String? | |
| technologies | String[] | |
| featured | Boolean | default `false` |
| published | Boolean | default `false` |
| thumbnailId | String? | FK → Media (relation `ProjectThumbnail`) |
| gallery | ProjectGalleryImage[] | |
| userId | String | FK → User (cascade) |
| createdAt / updatedAt | DateTime | |

### `ProjectGalleryImage` (join: Project ↔ Media, ordered)
| Field | Type | Constraints |
|---|---|---|
| id | String | PK |
| order | Int | default 0 |
| projectId | String | FK → Project (cascade) |
| mediaId | String | FK → Media (cascade) |
| createdAt | DateTime | |
| | | **unique([projectId, mediaId])** |

### `Settings` (1:1 with User)
| Field | Type | Constraints |
|---|---|---|
| id | String | PK |
| siteTitle | String | required |
| siteDescription | String | required |
| heroTitle | String | required |
| heroSubtitle | String | required |
| about | String | required |
| githubUrl | String? | |
| linkedinUrl | String? | |
| twitterUrl | String? | |
| contactEmail | String | required |
| resumeFileUrl | String? | |
| availableForWork | Boolean | default `true` |
| userId | String | **unique**, FK → User (cascade) |
| createdAt / updatedAt | DateTime | |

### `Testimonial`
| Field | Type | Constraints |
|---|---|---|
| id | String | PK |
| name | String | |
| role | String | |
| company | String? | |
| quote | String | |
| avatarId | String? | FK → Media (relation `TestimonialAvatar`) |
| featured | Boolean | default `false` |
| published | Boolean | default `false` |
| order | Int | default 0 |
| userId | String | FK → User (cascade) |
| createdAt / updatedAt | DateTime | |

### `Service`
| Field | Type | Constraints |
|---|---|---|
| id | String | PK |
| title | String | |
| description | String | |
| priceRange | String? | |
| icon | String? | |
| featured | Boolean | default `false` |
| published | Boolean | default `false` |
| order | Int | default 0 |
| userId | String | FK → User (cascade) |
| createdAt / updatedAt | DateTime | |

### `Media`
| Field | Type | Constraints |
|---|---|---|
| id | String | PK |
| url | String | public URL |
| key | String | **unique** (storage key, used for deletion) |
| type | MediaType enum | `IMAGE` \| `VIDEO` \| `FILE` |
| size | Int? | bytes |
| mimeType | String | |
| originalName | String? | |
| alt | String? | |
| caption | String? | |
| userId | String | FK → User (cascade) |
| createdAt / updatedAt | DateTime | |

Reverse relations: `blogCoverImage[]`, `projectThumbnail[]`, `projectGalleryImages[]`,
`testimonialAvatars[]`.

> **enum `MediaType`** = `IMAGE | VIDEO | FILE`. Note the upload service only ever assigns
> `IMAGE` (for `image/*`) or `FILE` (everything else, incl. PDF). `VIDEO` is defined but never set.

### Migration history (`prisma/migrations/`)
`init` → `add_users` → `add_resume_module` → two `add` → `add_settings` → `add_media_model`
→ `add_blog_cover_image` → `add_project_media_relations` → `redesign_resume`
→ `add_tags_technologies_media_fields` → `add_testimonials_services`. The schema is current.

---

# Authentication Flow

This is a **single-owner, access-token-only** scheme. There is no refresh token, no session
store, and no registration endpoint.

1. **Bootstrapping the owner.** The owner `User` is created out-of-band by the seed script
   (`prisma/seed.ts`, run via `npm run seed`), which reads `SEED_EMAIL`, `SEED_PASSWORD`,
   and optional `SEED_USERNAME`, then upserts a user with a `bcrypt`-hashed password (cost 12).
   (`src/common/constants/site-owner.constant.ts` also hard-codes `SITE_OWNER_EMAIL =
   'admin@portfolio.com'`, but it is currently **not referenced** anywhere.)

2. **Login.** `POST /api/v1/auth/login` with `{ email, password }`.
   - `AuthService.login` looks up the user by email, `bcrypt.compare`s the password.
   - On success it signs a JWT with payload `{ sub: userId, email }` using `JWT_SECRET`,
     expiring after `JWT_EXPIRES_IN` (default **15m**).
   - Returns `{ accessToken, user: { id, email, username } }`.
   - Failure (unknown email OR wrong password) → `401 Invalid credentials`.
   - Login is rate-limited to **10 attempts / 60s**.

3. **Token storage.** Not handled by the backend — the frontend stores the `accessToken`
   (e.g. memory / localStorage) and sends it as `Authorization: Bearer <token>`.
   CORS is configured with `credentials: true`, but auth itself is header-based (no cookies set).

4. **Protected routes.** Dashboard controllers are decorated with `@UseGuards(JwtAuthGuard)`.
   - `JwtStrategy` (`passport-jwt`) extracts the Bearer token, verifies the signature and
     expiry against `JWT_SECRET`, then **re-loads the user from the DB** by `payload.sub`
     (selecting `id, email, username`). If the user no longer exists → `401 Invalid token`.
   - The validated user object is attached to `request.user` and exposed in controllers via
     the `@GetUser()` decorator (`CurrentUser = { id, email, username }`).

5. **Authorization / ownership.** There are **no roles**. Every authenticated request is the
   owner. Services still enforce per-record ownership (`assertOwnership` / `findFirst({ where: { id, userId } })`)
   so records are scoped to the calling user — returning `403` (blog/project) or `404`
   (services/testimonials/media/resume children) when a record isn't owned.

6. **Token expiry / refresh.** When the 15-minute token expires, the protected route returns
   `401` and the frontend must **log in again** — there is no refresh endpoint.

---

# Environment Variables

Validated at startup by Joi (`src/config/env.validation.ts`). The app will **fail to boot** if a
`required` var is missing or invalid. Values are stored in a local `.env` file (not committed; no
`.env.example` exists in the repo — see attention list).

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `NODE_ENV` | no | `development` | `development` \| `production` \| `test`. Gates Swagger UI. |
| `PORT` | no | `4000` | HTTP port |
| `DATABASE_URL` | **yes** | — | Postgres connection (pooled). Validated but note: schema currently uses `DIRECT_URL` for both `url` and `directUrl`. |
| `DIRECT_URL` | **yes** | — | Direct Postgres connection (used by Prisma datasource) |
| `JWT_SECRET` | **yes** | — | JWT signing secret (**min 32 chars**) |
| `JWT_EXPIRES_IN` | no | `15m` | Access token lifetime |
| `SUPABASE_URL` | **yes** | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **yes** | — | Supabase service-role key (server-side; full storage access) |
| `SUPABASE_STORAGE_BUCKET` | **yes** | — | Storage bucket name for uploads |
| `ALLOWED_ORIGINS` | no | `http://localhost:3000` | Comma-separated CORS origins |

Seed-only (read by `prisma/seed.ts`, **not** in the Joi schema):

| Variable | Required for seeding | Default | Purpose |
|---|---|---|---|
| `SEED_EMAIL` | yes | — | Owner login email |
| `SEED_PASSWORD` | yes | — | Owner password (will be bcrypt-hashed) |
| `SEED_USERNAME` | no | `admin` | Owner username |

---

# What's Missing or Needs Attention

### Inconsistencies the frontend must handle
- **Media list pagination is non-standard.** `GET /dashboard/media` returns
  `{ items, total, page, limit }` while every other paginated list returns `{ data, meta: {...} }`.
  The client needs a special case here. The media `total` is also not turned into `totalPages`/`hasNextPage`.
- **Read by `slug`, mutate by `id`.** Blog and Projects expose `GET .../:slug` but
  `PATCH`/`DELETE .../:id`. The frontend must keep both the slug (for routing/links) and the id
  (for edits) around.
- **Some lists paginated, some not.** Blog & projects are paginated; services, testimonials,
  and resume children are returned as full arrays. The dashboard UI can't assume pagination everywhere.
- **Ownership error codes differ.** Blog/projects return `403` when you don't own a record;
  services/testimonials/media/resume return `404`. Same semantic, different status.

### Likely gaps / not implemented yet
- **No `.env.example`.** There's a live `.env` but nothing checked in to document required vars
  for a new environment. (This document's Environment section can serve as the reference.)
- **No auth lifecycle beyond login.** No register, logout, refresh-token, change-password, or
  forgot-password endpoints. 15-minute tokens with no refresh means the dashboard will force
  frequent re-logins — the frontend should plan for `401`-triggered re-auth.
- **No `GET /auth/me` / profile endpoint.** After login the only user info available is what the
  login response returned; there's no endpoint to re-fetch the current user.
- **`testimonial.avatarId` is not ownership-validated.** Unlike blog `coverImageId` and project
  `thumbnailId`/`galleryImageIds` (which call `validateOwnedMedia`), the testimonials service
  writes `avatarId` straight through. An invalid id would surface only as a Prisma FK error (`P2003`).
- **`MediaType.VIDEO` is defined but never produced.** `getMediaType` only returns `IMAGE` or
  `FILE`, and the upload allow-list doesn't include video MIME types. Video support is stubbed.
- **`SITE_OWNER_EMAIL` constant is unused** (`'admin@portfolio.com'` in `site-owner.constant.ts`)
  — dead code / leftover from an earlier ownership approach.
- **Media deletion isn't reference-safe.** Deleting a `Media` that is a blog cover or project
  thumbnail will succeed (those FKs are nullable, no cascade configured to null them on the
  relation), potentially leaving dangling `coverImageId`/`thumbnailId` references. Gallery and
  testimonial-avatar relations behave differently. Frontend should avoid deleting in-use media,
  or handle the resulting inconsistency.
- **No public single-item endpoints for services/testimonials.** Only "list published" is public;
  there's no `GET /services/:id` publicly (fine for card grids, but note it).
- **`DATABASE_URL` vs `DIRECT_URL`.** Both are required by Joi, but `schema.prisma` points both
  the datasource `url` and `directUrl` at `DIRECT_URL`. `DATABASE_URL` (pooled connection) is
  validated but effectively unused by Prisma at runtime — worth confirming for production pooling.

### Things the frontend will want that exist and are ready
- Full CRUD for blog, projects, services, testimonials, resume (+ children), settings, media.
- Drag-and-drop ordering supported via the `/reorder` endpoints (resume children, services,
  testimonials) — POST the full `{ items: [{ id, order }] }` set.
- Featured/published flags on projects, testimonials, services for homepage curation.
- Media upload returns a ready-to-use public `url` plus the `id` to attach to other records.
- Swagger/OpenAPI spec available at `GET /api/docs` in non-production for live exploration and
  client generation.
```
