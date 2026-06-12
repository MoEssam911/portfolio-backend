# What We Built and Why — A Practical Backend Guide

This file explains everything done in this project in plain language.
It is written for you specifically — someone building their first real backend and wanting to understand the decisions, not just copy the code.

---

## The Big Picture

Your API follows a common real-world pattern:

```
HTTP Request
  → main.ts (security middleware)
  → Router (finds the right controller)
  → Guard (are you allowed?)
  → Pipe (is the data valid?)
  → Controller (receives the request)
  → Service (does the actual work)
  → Prisma (talks to the database)
  → Filter / Interceptor (shapes the response)
  → HTTP Response
```

Every file in this project lives at one of these layers. Once you know which layer a file belongs to, you know what it does.

---

## Part 1 — The Audit: What Was Wrong and Why It Mattered

Before writing any new features, we reviewed the entire codebase. Here is what we found and fixed.

---

### 1.1 — The Settings Bug (Silent Null)

**What was broken:**

```typescript
// OLD CODE — public endpoint, no JWT guard
@Get()
getPublic(@Req() req) {
  return this.settingsService.getPublicSettings(req.user?.id); // <-- always undefined
}
```

A public endpoint has no guard. That means `req.user` is never populated — it is always `undefined`.
So the service received `undefined` as the userId, and Prisma ran:

```typescript
prisma.settings.findUnique({ where: { userId: undefined } })
```

Prisma does not throw an error here. It just quietly returns `null`. So every visitor to your portfolio saw nothing. The API was silently broken.

**Why this is easy to miss:**
You do not get an error. There is no crash. The endpoint returns `200 OK` with `null` as the body. You would only notice if you actually tested the endpoint.

**The fix:**
For a single-owner platform, the public settings endpoint should not need a user ID at all. There is only one settings row. So:

```typescript
// NEW CODE
async getPublicSettings() {
  return this.prisma.settings.findFirst(); // there is only one row, always
}
```

**Lesson:** On public endpoints (no `@UseGuards`), never touch `req.user`. It is always `null`.

---

### 1.2 — Wrong HTTP Status Codes (Media Delete)

**What was broken:**

```typescript
// OLD CODE
throw new BadRequestException('Media not found'); // 400
```

**The fix:**

```typescript
// NEW CODE
throw new NotFoundException('Media not found'); // 404
```

**Why it matters:**
HTTP status codes are a contract. `400 Bad Request` means "your request is malformed — you sent bad data." `404 Not Found` means "the thing you asked for does not exist." These are different situations. When a frontend developer or a client reads `400`, they think they sent wrong data and try to fix their request. When they read `404`, they know the resource is gone. Using the wrong code confuses every client that talks to your API.

---

### 1.3 — Spreading DTOs into Prisma (The `...dto` Problem)

**What was broken:**

```typescript
// OLD CODE
return this.prisma.blogPost.create({
  data: { ...dto }, // dangerous
});
```

**Why it is dangerous:**
DTOs can have fields that are not in the database. For example, if you add a `tags: string[]` field to your DTO, then `...dto` will try to pass `tags` directly to Prisma. Prisma will throw a runtime error because `tags` is not a column on `BlogPost`. You only discover this bug when you run the code — TypeScript will not catch it at build time.

**The fix:**

```typescript
// NEW CODE — explicit mapping
return this.prisma.blogPost.create({
  data: {
    title: dto.title,
    slug: dto.slug,
    content: dto.content,
    excerpt: dto.excerpt,
    published: dto.published ?? false,
    userId,
  },
});
```

**Lesson:** Never spread a DTO directly into a Prisma `create` or `update` call. Always list every field explicitly. It takes 10 more seconds and saves you an hour of debugging.

---

### 1.4 — API Route Versioning

**What was broken:**

```typescript
// OLD CODE — bare string
@Controller('settings')
@Controller('dashboard/settings')
```

**The fix:**

```typescript
// NEW CODE — versioned object
@Controller({ path: 'settings', version: '1' })
@Controller({ path: PRIVATE_API_PREFIX, version: '1' })
```

**Why it matters:**
`main.ts` enables URI versioning:

```typescript
app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
```

But URI versioning only applies when the controller uses the **object form** `{ path, version }`. When you use a bare string like `@Controller('settings')`, NestJS skips the versioning system entirely. Your route ends up at `/api/settings` instead of `/api/v1/settings`. Future versions of your API would be inconsistent — some routes versioned, some not.

---

### 1.5 — `findFirstOrThrow` vs `findUniqueOrThrow` for Unique Fields

**What was broken:**

```typescript
// OLD CODE — wrong method for a unique field
return this.prisma.blogPost.findFirstOrThrow({ where: { slug } });
```

**The fix:**

```typescript
// NEW CODE
return this.prisma.blogPost.findUnique({ where: { slug } });
```

When a field has `@unique` in the schema, use `findUnique`. It tells Prisma (and the database) "this field is unique — use the indexed lookup." `findFirst` does a table scan and checks each row. It is slower and semantically wrong. Using `findFirst` on a unique field is like alphabetizing a dictionary and then reading every page to find a word.

---

### 1.6 — Graceful Shutdown (PrismaService)

**What was missing:**

```typescript
// OLD CODE
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() { await this.$connect(); }
  // no onModuleDestroy
}
```

**The fix:**

```typescript
// NEW CODE
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
```

**Why it matters:**
When your server restarts or deploys, NestJS calls `onModuleDestroy` on every service. Without the `$disconnect()` call, Prisma's database connections are never closed. They stay open until they time out. On PostgreSQL, you have a maximum connection limit (Supabase free tier: 20 connections). If your server restarts many times, you will exhaust that limit and new connections will be refused.

---

### 1.7 — Projects Gallery — The Broken Update

**What was broken:**
The `updateProject` method had no logic to replace gallery images. If you sent new gallery image IDs, nothing happened. Also, the old code spread `...dto` into a Prisma update which would crash because `galleryImageIds` is not a database column.

**The fix — using a transaction:**

```typescript
async updateProject(userId: string, slug: string, dto: UpdateProjectDto) {
  const project = await this.findOneBySlug(slug, userId);

  return this.prisma.$transaction(async (tx) => {
    if (dto.galleryImageIds !== undefined) {
      // Step 1: delete all current gallery entries
      await tx.projectGalleryImage.deleteMany({ where: { projectId: project.id } });

      // Step 2: create new gallery entries
      // Both steps are wrapped in a transaction — either both succeed or neither does
    }

    return tx.project.update({ where: { id: project.id }, data: { ... } });
  });
}
```

**Why a transaction matters:**
A transaction is a "do this, or undo everything" operation. If step 1 (delete old images) succeeds but step 2 (insert new ones) fails, the transaction is rolled back — the old images are restored. Without a transaction, you could end up with a project that has no gallery images at all because the delete succeeded but the insert crashed.

---

### 1.8 — The `@GetUser()` Decorator Pattern

**What was broken:**

```typescript
// OLD CODE
@Get()
get(@Req() req) {
  return this.service.get(req.user.id);
}
```

**The fix:**

```typescript
// NEW CODE
@Get()
get(@GetUser() user: CurrentUser) {
  return this.service.get(user.id);
}
```

`@Req()` gives you the raw Express request object typed as `any` (or weakly typed). You have to know the internal structure of the request and access `.user.id` manually. `@GetUser()` is a custom decorator that extracts just the user field, types it as `CurrentUser`, and fails visibly if it is missing. It is shorter, typed, and consistent across the entire codebase.

---

## Part 2 — Architecture Decisions Worth Understanding

### 2.1 — Module Structure

Every domain in this project has its own folder with the same shape:

```
src/blog/
  blog.module.ts          ← wires everything together
  blog.service.ts         ← business logic
  controllers/
    public-blog.controller.ts   ← no auth required
    private-blog.controller.ts  ← JWT required
  dto/
    create-blog.dto.ts    ← shape of incoming data
    update-blog.dto.ts    ← partial version of create
```

**Why split public and private controllers?**
The alternative is one controller with some routes guarded and some not. This works but it is easy to accidentally forget the `@UseGuards` decorator on a new route. With split controllers, the entire private controller is always guarded at the class level:

```typescript
@UseGuards(JwtAuthGuard)
@Controller({ path: PRIVATE_API_PREFIX, version: '1' })
export class PrivateBlogController { ... }
```

You cannot add a new method to this class and accidentally make it public. The guard is class-level.

---

### 2.2 — The Global PrismaModule

`PrismaModule` is decorated with `@Global()`:

```typescript
@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```

This means every other module in the application automatically has access to `PrismaService`. You do not need to add `PrismaModule` to the `imports` array of `BlogModule`, `ProjectsModule`, etc. Several modules had redundant `PrismaModule` imports — we removed them. They were harmless but misleading.

---

### 2.3 — DTOs and the Validation Pipe

A DTO (Data Transfer Object) is a class that describes the shape of data coming into your API. NestJS's `ValidationPipe` reads the decorators on DTO fields and rejects requests that do not match.

```typescript
export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  excerpt?: string;
}
```

The `ValidationPipe` in `main.ts` is configured with:

```typescript
new ValidationPipe({
  whitelist: true,          // strips unknown fields from the request
  forbidNonWhitelisted: true, // throws if unknown fields are present
  transform: true,          // converts strings to numbers/booleans where needed
})
```

`whitelist: true` protects you from accidentally saving extra data that a user sends. For example, if someone sends `{ "title": "hello", "userId": "injected-id" }`, the `userId` field is stripped before it ever reaches your service.

---

### 2.4 — The `TransformResponseInterceptor`

Every response from your API goes through this interceptor and gets wrapped:

```json
{
  "success": true,
  "data": { ... }
}
```

Or for paginated lists:

```json
{
  "success": true,
  "data": [ ... ],
  "meta": { "total": 45, "page": 1, "limit": 20 }
}
```

This consistent envelope means every client that talks to your API always knows where to find the data. No guessing whether the response is the raw object or nested inside a `data` key.

---

### 2.5 — The `PrismaExceptionFilter`

Prisma throws specific error codes for database-level errors. Without a filter, these would bubble up as unhandled exceptions and your client would receive a `500 Internal Server Error` with no useful message.

The filter catches known codes and converts them:

| Prisma Code | Meaning | HTTP Status |
|---|---|---|
| P2002 | Unique constraint violation (duplicate) | 409 Conflict |
| P2025 | Record not found | 404 Not Found |
| P2003 | Foreign key violation | 400 Bad Request |
| P2014 | Required relation missing | 400 Bad Request |
| P2000 | Value too long for column | 400 Bad Request |

---

## Part 3 — The Resume Redesign

This was the biggest change. The original resume model had a fundamental design problem.

### 3.1 — What Was Wrong With the Old Design

The old schema looked like this:

```prisma
model Resume {
  id        String  @id
  title     String          // "My 2024 Resume"
  slug      String  @unique // "my-2024-resume"
  isDefault Boolean
  sections  ResumeSection[]
}

model ResumeSection {
  type    ResumeSectionType // EXPERIENCE, EDUCATION, etc.
  content Json              // opaque blob
}
```

**Problem 1 — Wrong abstraction for a personal site.**
Multiple `Resume` documents with slugs imply you are building something like LinkedIn, where users have multiple resume versions. This is your personal site. You have one resume. The multi-document design added complexity with zero benefit.

**Problem 2 — JSON blobs destroy type safety.**
When the content of an experience entry is stored as a JSON blob, Prisma does not know its shape. You cannot query "show me all experiences where `endDate` is null (current jobs)". You cannot sort by `startDate`. The data is opaque.

**Problem 3 — `isDefault` is fragile.**
If no resume has `isDefault: true`, the public page 404s. If two have it, behavior is undefined. A singleton does not need a flag.

### 3.2 — The New Design: Singleton Aggregate

Inspired by the `Settings` model, which already correctly uses a singleton pattern:

```prisma
model ResumeProfile {
  id       String @id @default(cuid())
  userId   String @unique          // ← enforces singleton: one per user
  headline String?
  summary  String?
  location String?

  experiences    Experience[]
  educations     Education[]
  skillGroups    SkillGroup[]
  certifications Certification[]
  links          ResumeLink[]
}
```

The `userId @unique` constraint is the key detail. The database itself enforces that there can only be one `ResumeProfile` per user. You do not need an `isDefault` flag. You do not need to query "which one is the real one."

Each sub-entity (`Experience`, `Education`, etc.) is a proper typed table with its own columns. This means you can query, sort, and filter them like any other data.

### 3.3 — The `order` Field and Reordering

Every sub-entity has:

```prisma
order Int @default(0)
```

This lets your dashboard UI drag-and-drop items to reorder them. The reorder endpoint accepts a list of `{ id, order }` pairs and updates them all at once:

```typescript
// PATCH /dashboard/resume/experiences/reorder
async reorderExperiences(userId: string, items: ReorderDto[]) {
  const profile = await this.getOrCreateProfile(userId);
  await this.prisma.$transaction(
    items.map((item) =>
      this.prisma.experience.update({
        where: { id: item.id, profileId: profile.id },
        data: { order: item.order },
      }),
    ),
  );
}
```

`$transaction` with an array of promises runs all updates as a single atomic operation.

### 3.4 — Upsert Pattern for the Profile

Because `ResumeProfile` is a singleton, the service uses `upsert` to get or create it:

```typescript
async getOrCreateProfile(userId: string) {
  return this.prisma.resumeProfile.upsert({
    where: { userId },
    create: { userId },
    update: {}, // already exists, do nothing
  });
}
```

`upsert` means: "if a row matching this `where` exists, run `update`. If not, run `create`." The empty `update: {}` means "if it already exists, leave it exactly as-is." This is the correct pattern for singletons — you never need to manually check "does this exist?" first.

---

## Part 4 — Production Hardening

### 4.1 — Rate Limiting

```typescript
// app.module.ts
ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
// providers:
{ provide: APP_GUARD, useClass: ThrottlerGuard },
```

```typescript
// auth.controller.ts — tighter limit on login
@Throttle({ default: { ttl: 60_000, limit: 10 } })
@Post('login')
login(@Body() dto: LoginDto) { ... }
```

Without rate limiting, anyone can send thousands of login requests per second trying different passwords. This is called a brute-force attack. The global limit is 100 requests per minute per IP. The login override is 10 per minute — much tighter because login is the most sensitive endpoint.

### 4.2 — Helmet

```typescript
app.use(helmet());
```

Helmet sets a collection of HTTP response headers that protect against common web attacks:

- `X-Content-Type-Options: nosniff` — prevents browsers from guessing the content type of a response
- `X-Frame-Options: SAMEORIGIN` — blocks clickjacking (embedding your site in an iframe to trick users into clicking things)
- `Content-Security-Policy` — restricts what resources a page can load
- And several others

One line, significant security improvement.

### 4.3 — CORS

```typescript
app.enableCors({
  origin: configService.get<string[]>('app.allowedOrigins'),
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
});
```

CORS (Cross-Origin Resource Sharing) controls which domains are allowed to make requests to your API from a browser. Without this, when your Nuxt frontend at `https://yoursite.com` tries to call `https://api.yoursite.com`, the browser will block the request entirely. The `ALLOWED_ORIGINS` env var lets you set which origins are permitted without changing code.

### 4.4 — Environment Validation

```typescript
// src/config/env.validation.ts
export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  // ...
});
```

This runs at startup. If any required environment variable is missing, the app refuses to start and tells you exactly what is missing. Without this, a missing `JWT_SECRET` would cause the app to start, accept requests, and then crash with a cryptic error when the first user tries to log in. With validation, you catch the problem before the server starts.

### 4.5 — Seed Script

```typescript
// prisma/seed.ts
const user = await prisma.user.upsert({
  where: { email },
  create: { email, username, passwordHash: await bcrypt.hash(password, 12) },
  update: {},
});
```

Run with `npm run seed`. This creates the one owner account from environment variables. Without it, there is no way to log into your own CMS — the database starts empty.

---

## Part 5 — Database Schema Patterns

### 5.1 — `@unique` on relation fields for singletons

```prisma
model Settings {
  userId String @unique  // one settings row per user, enforced by the database
}

model ResumeProfile {
  userId String @unique  // same pattern
}
```

The `@unique` constraint means the database will reject any attempt to create a second row with the same `userId`. You do not need application-level checks — the constraint is enforced at the lowest level.

### 5.2 — `onDelete: Cascade`

```prisma
model Experience {
  profile   ResumeProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
}
```

`Cascade` means: if the `ResumeProfile` is deleted, automatically delete all related `Experience` rows. Without this, deleting a user would leave orphaned experience records with no parent. Always add `Cascade` on child models that should not exist without their parent.

### 5.3 — Many-to-Many (Blog Tags)

```prisma
model BlogPost {
  tags Tag[]
}

model Tag {
  posts BlogPost[]
}
```

Prisma manages the join table automatically when you declare an implicit many-to-many like this (no `@relation` needed). The actual SQL table `_BlogPostToTag` is created by Prisma. In the service, we use `connectOrCreate` to either find an existing tag by slug or create a new one:

```typescript
tags: {
  set: [],  // disconnect all existing tags first
  connectOrCreate: tagNames.map((name) => ({
    where: { slug: slugify(name) },
    create: { name, slug: slugify(name) },
  })),
},
```

### 5.4 — Named Relations for multiple references to the same model

```prisma
model BlogPost {
  coverImage Media? @relation("BlogCoverImage", ...)
}

model Project {
  thumbnail  Media? @relation("ProjectThumbnail", ...)
  gallery    ProjectGalleryImage[]
}

model Media {
  blogCoverImage   BlogPost[] @relation("BlogCoverImage")
  projectThumbnail Project[]  @relation("ProjectThumbnail")
}
```

When a model (`Media`) is referenced by multiple other models, or is referenced more than once by the same model, Prisma requires named relations to distinguish them. The name is just a string — it just needs to match on both sides of the relation.

---

## Part 6 — Key Patterns Summary

| Pattern | What it solves |
|---|---|
| Split controllers (public/private) | Prevents accidentally exposing private routes |
| `@Controller({ path, version })` | Ensures URI versioning applies to every route |
| `PRIVATE_API_PREFIX` constant | All private routes under `/dashboard/` consistently |
| `@GetUser()` decorator | Typed, consistent user extraction in private controllers |
| Explicit field mapping in Prisma | Prevents runtime errors when DTO and schema diverge |
| `findUnique` for unique fields | Correct semantics + uses the database index |
| `$transaction` for multi-step writes | Atomic — either all succeed or all roll back |
| Singleton with `@unique` on `userId` | Database-enforced one-row-per-user |
| `upsert` for singletons | Get-or-create in one query, no manual existence check |
| `order` field + reorder endpoint | Drag-and-drop ordering without re-indexing the whole table |
| `connectOrCreate` for tags | Upsert-style many-to-many with clean deduplication |
| Environment validation at startup | Fails fast with a clear message instead of crashing mid-request |
| `onModuleDestroy` + `$disconnect` | Closes DB connections cleanly on restart/deploy |

---

## Appendix — Route Map

### Public Routes (no auth required)

```
GET  /api/v1/settings              → site title, hero, about, social links
GET  /api/v1/blogs                 → paginated published posts
GET  /api/v1/blogs/:slug           → single published post with tags
GET  /api/v1/projects              → paginated published projects with thumbnail
GET  /api/v1/projects/:slug        → single published project with gallery
GET  /api/v1/resume                → full resume profile with all sub-entities
```

### Auth Routes

```
POST /api/v1/auth/login            → returns JWT token
```

### Private Routes (Bearer token required)

```
GET    /api/v1/dashboard/settings
PATCH  /api/v1/dashboard/settings

GET    /api/v1/dashboard/blogs
POST   /api/v1/dashboard/blogs
GET    /api/v1/dashboard/blogs/:slug
PATCH  /api/v1/dashboard/blogs/:slug
DELETE /api/v1/dashboard/blogs/:slug

GET    /api/v1/dashboard/projects
POST   /api/v1/dashboard/projects
GET    /api/v1/dashboard/projects/:slug
PATCH  /api/v1/dashboard/projects/:slug
DELETE /api/v1/dashboard/projects/:slug

GET    /api/v1/dashboard/media
POST   /api/v1/dashboard/media/upload
GET    /api/v1/dashboard/media/:id
PATCH  /api/v1/dashboard/media/:id
DELETE /api/v1/dashboard/media/:id

GET    /api/v1/dashboard/resume
PATCH  /api/v1/dashboard/resume

POST   /api/v1/dashboard/resume/experiences
PATCH  /api/v1/dashboard/resume/experiences/reorder
PATCH  /api/v1/dashboard/resume/experiences/:id
DELETE /api/v1/dashboard/resume/experiences/:id

POST   /api/v1/dashboard/resume/educations
PATCH  /api/v1/dashboard/resume/educations/reorder
PATCH  /api/v1/dashboard/resume/educations/:id
DELETE /api/v1/dashboard/resume/educations/:id

POST   /api/v1/dashboard/resume/skill-groups
PATCH  /api/v1/dashboard/resume/skill-groups/reorder
PATCH  /api/v1/dashboard/resume/skill-groups/:id
DELETE /api/v1/dashboard/resume/skill-groups/:id

POST   /api/v1/dashboard/resume/certifications
PATCH  /api/v1/dashboard/resume/certifications/reorder
PATCH  /api/v1/dashboard/resume/certifications/:id
DELETE /api/v1/dashboard/resume/certifications/:id

POST   /api/v1/dashboard/resume/links
PATCH  /api/v1/dashboard/resume/links/reorder
PATCH  /api/v1/dashboard/resume/links/:id
DELETE /api/v1/dashboard/resume/links/:id
```
