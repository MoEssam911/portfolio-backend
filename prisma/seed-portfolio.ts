/**
 * Portfolio Sample Data Seed
 * Run: npx ts-node prisma/seed-portfolio.ts
 *
 * Requires the owner user to exist first.
 * Run `npm run seed` before running this file.
 *
 * This script is idempotent — safe to run multiple times.
 * It deletes existing portfolio data and recreates it fresh.
 */

import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  const email = process.env.SEED_EMAIL
  if (!email) throw new Error('SEED_EMAIL env var is required')

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error(`User not found for email: ${email}. Run npm run seed first.`)

  console.log(`🌱 Seeding portfolio data for: ${user.email}`)

  // ─── 1. SETTINGS ──────────────────────────────────────────────────────────
  console.log('  → Settings')
  await prisma.settings.upsert({
    where: { userId: user.id },
    create: {
      siteTitle: 'Mohamed Essam — Frontend Developer',
      siteDescription:
        'Frontend Developer specializing in the product experience layer — design systems, performance, and craft.',
      heroTitle: 'Building interfaces that engineers respect.',
      heroSubtitle:
        'Frontend Developer specializing in the product experience layer — where design systems, performance, and craft converge.',
      about:
        "I'm a frontend developer based in Cairo who works at the intersection of engineering precision and design sensibility. I care deeply about the details that don't make it into the Figma file — perceived performance, motion that earns trust, and component systems that scale. When I'm not building, I'm writing about the craft.",
      githubUrl: 'https://github.com/mohamedessam',
      linkedinUrl: 'https://linkedin.com/in/mohamedessam',
      twitterUrl: null,
      contactEmail: 'hello@mohamedessam.dev',
      resumeFileUrl: null,
      availableForWork: true,
      userId: user.id,
    },
    update: {
      siteTitle: 'Mohamed Essam — Frontend Developer',
      siteDescription:
        'Frontend Developer specializing in the product experience layer — design systems, performance, and craft.',
      heroTitle: 'Building interfaces that engineers respect.',
      heroSubtitle:
        'Frontend Developer specializing in the product experience layer — where design systems, performance, and craft converge.',
      about:
        "I'm a frontend developer based in Cairo who works at the intersection of engineering precision and design sensibility. I care deeply about the details that don't make it into the Figma file — perceived performance, motion that earns trust, and component systems that scale. When I'm not building, I'm writing about the craft.",
      githubUrl: 'https://github.com/mohamedessam',
      linkedinUrl: 'https://linkedin.com/in/mohamedessam',
      twitterUrl: null,
      contactEmail: 'hello@mohamedessam.dev',
      availableForWork: true,
    },
  })

  // ─── 2. SERVICES ──────────────────────────────────────────────────────────
  console.log('  → Services')
  await prisma.service.deleteMany({ where: { userId: user.id } })
  await prisma.service.createMany({
    data: [
      {
        title: 'Frontend Development',
        description:
          'End-to-end frontend implementation from design handoff to production. Vue 3, Nuxt 4, TypeScript, Tailwind CSS. Component systems built to scale, not just to ship.',
        priceRange: 'From $3,000',
        icon: 'code-2',
        featured: true,
        published: true,
        order: 0,
        userId: user.id,
      },
      {
        title: 'UI/UX Implementation',
        description:
          'Translating Figma files into pixel-perfect, accessible, animated interfaces. Micro-interactions, page transitions, and motion that communicates rather than decorates.',
        priceRange: 'From $2,000',
        icon: 'palette',
        featured: true,
        published: true,
        order: 1,
        userId: user.id,
      },
      {
        title: 'Performance Optimization',
        description:
          'Auditing and improving Core Web Vitals. LCP, CLS, INP — concrete improvements with measurable impact. Bundle analysis, image pipelines, and render-path surgery.',
        priceRange: 'From $1,500',
        icon: 'zap',
        featured: false,
        published: true,
        order: 2,
        userId: user.id,
      },
      {
        title: 'Design Systems',
        description:
          'Building token-first component libraries that your whole team can use. Tailwind CSS 4, shadcn-vue, CVA, Storybook. From design tokens to documented components.',
        priceRange: 'From $4,000',
        icon: 'layers',
        featured: true,
        published: true,
        order: 3,
        userId: user.id,
      },
    ],
  })

  // ─── 3. PROJECTS ──────────────────────────────────────────────────────────
  console.log('  → Projects')
  await prisma.project.deleteMany({ where: { userId: user.id } })

  await prisma.project.create({
    data: {
      title: 'Portfolio CMS & API',
      slug: 'portfolio-cms-api',
      excerpt: 'A headless CMS built specifically for my portfolio — fast, opinionated, and fully owned.',
      description:
        'Rather than reach for an off-the-shelf CMS, I built a custom API that matches exactly how I think about my content. NestJS with Prisma, PostgreSQL on Supabase, JWT auth, and a media pipeline backed by Supabase Storage. The schema models every entity the frontend needs: projects, blog posts, resume, services, testimonials, and settings. The result is a backend I understand completely and can extend without reading documentation.',
      liveUrl: null,
      repoUrl: 'https://github.com/mohamedessam/portfolio-api',
      technologies: ['NestJS', 'TypeScript', 'Prisma', 'PostgreSQL', 'Supabase', 'JWT'],
      featured: true,
      published: true,
      thumbnailId: null,
      userId: user.id,
    },
  })

  await prisma.project.create({
    data: {
      title: 'Analytics SaaS Dashboard',
      slug: 'analytics-saas-dashboard',
      excerpt: "A data-dense dashboard that doesn't feel data-dense — real-time charts, filter systems, and a design system built from scratch.",
      description:
        'The challenge was building a dashboard that a non-technical user could navigate intuitively while surfacing enough depth for power users. I built a full design token system in Tailwind CSS 4, a reusable chart layer over Recharts, and an incremental data-loading strategy that keeps the UI responsive even with large datasets. The filter system uses URL state so every view is shareable.',
      liveUrl: 'https://demo.dashboard.example.com',
      repoUrl: null,
      technologies: ['Vue 3', 'Nuxt 4', 'TypeScript', 'Tailwind CSS', 'Recharts', 'Pinia'],
      featured: true,
      published: true,
      thumbnailId: null,
      userId: user.id,
    },
  })

  await prisma.project.create({
    data: {
      title: 'E-Commerce Storefront',
      slug: 'ecommerce-storefront',
      excerpt: 'A product-led shopping experience with a cart system, search, filtering, and checkout — built in under three weeks.',
      description:
        'This project had a hard timeline and no Figma handoff — I worked from a Notion doc and weekly calls. The architecture decisions made the difference: server-side rendering for product pages (SEO-critical), client-side for cart and checkout (interaction-critical), and a search system using fuse.js on the client to avoid the cost of a search service. Shipped on time. No post-launch critical bugs.',
      liveUrl: 'https://store.example.com',
      repoUrl: null,
      technologies: ['Nuxt 4', 'TypeScript', 'Tailwind CSS', 'Pinia', 'VeeValidate', 'Zod'],
      featured: true,
      published: true,
      thumbnailId: null,
      userId: user.id,
    },
  })

  await prisma.project.create({
    data: {
      title: 'Component Library',
      slug: 'component-library',
      excerpt: 'An internal design system and component library used across three products.',
      description:
        'Built to serve three separate Vue applications without creating three separate maintenance burdens. Token-first with a Figma design file kept in sync manually (pre-Code Connect era). Components are fully typed, WCAG AA compliant, and documented in Storybook. The library ships as a private npm package.',
      liveUrl: null,
      repoUrl: null,
      technologies: ['Vue 3', 'TypeScript', 'Tailwind CSS', 'CVA', 'Storybook', 'Vitest'],
      featured: false,
      published: true,
      thumbnailId: null,
      userId: user.id,
    },
  })

  // ─── 4. BLOG POSTS ────────────────────────────────────────────────────────
  console.log('  → Blog posts')
  const existingPosts = await prisma.blogPost.findMany({ where: { userId: user.id } })
  for (const post of existingPosts) {
    await prisma.blogPost.delete({ where: { id: post.id } })
  }

  await prisma.blogPost.create({
    data: {
      title: 'Why I Built My Own Portfolio API Instead of Using a Headless CMS',
      slug: 'why-i-built-my-own-portfolio-api',
      excerpt:
        "Contentful, Sanity, Strapi — I evaluated them all. Here's why I ended up writing a NestJS API from scratch, and what I learned building it.",
      content: `<p>The honest answer is that I wanted to learn Node.js properly. The principled answer is that none of the existing solutions matched how I think about my content.</p>
<h2>The problem with off-the-shelf CMS products</h2>
<p>Every headless CMS makes decisions for you. Contentful's content model is flexible but the pricing isn't. Strapi gives you full control but you're maintaining a full Node.js application with plugins you didn't write. Sanity is excellent but the query language has a learning curve that doesn't pay off for a single-owner site.</p>
<p>What I actually needed was something simpler: a few RESTful endpoints, JWT auth for the dashboard, and a media pipeline backed by object storage. That's maybe 2,000 lines of TypeScript.</p>
<h2>Building it while learning</h2>
<p>I built the API over six weeks, using AI assistance throughout. NestJS forced me to learn dependency injection properly. Prisma made database work approachable. The authentication flow — JWT with bcrypt — taught me things about token lifecycle I'd only read about before.</p>
<p>The mistakes were instructive. My first auth implementation stored tokens in memory. My initial media endpoint had no size validation. I made the pagination shape inconsistent across endpoints and had to refactor it.</p>
<h2>What I'd do differently</h2>
<p>I'd write tests earlier. The critical paths — auth, slug generation, ownership validation — are exactly the things that break in unexpected ways. A test suite would have caught the pagination inconsistency immediately instead of three months later.</p>
<p>But the thing I got right: building something I understand completely. When a bug appears, I know where to look. When a requirement changes, I know the cost. That's worth more than any feature a CMS vendor ships.</p>`,
      published: true,
      coverImageId: null,
      userId: user.id,
      tags: {
        connectOrCreate: [
          { where: { slug: 'backend' }, create: { name: 'Backend', slug: 'backend' } },
          { where: { slug: 'nestjs' }, create: { name: 'NestJS', slug: 'nestjs' } },
          { where: { slug: 'learning' }, create: { name: 'Learning', slug: 'learning' } },
        ],
      },
    },
  })

  await prisma.blogPost.create({
    data: {
      title: 'Tailwind CSS 4 — What Actually Changes When You Move to @theme',
      slug: 'tailwind-css-4-what-changes-with-theme',
      excerpt:
        "The @theme directive is not just a syntax change — it's a different way of thinking about design tokens. Here's what I learned building a complete design system on v4.",
      content: `<p>Tailwind CSS 4 landed and immediately changed how I think about design tokens. Not because the feature is radical — CSS custom properties have existed forever — but because the <code>@theme</code> directive finally makes the relationship between design tokens and utility classes explicit.</p>
<h2>The old way: configuration files</h2>
<p>In Tailwind v3, your design tokens lived in <code>tailwind.config.ts</code>. You'd extend the theme, generate utilities, and hope your editor's IntelliSense kept up. The config file was JavaScript, which meant tokens were available at build time but not necessarily at runtime in a way that CSS custom properties can be.</p>
<h2>The new way: @theme in CSS</h2>
<p>In v4, you write <code>@theme</code> blocks directly in your CSS. The framework reads these to generate utilities. This means your design tokens and your utility classes live in the same place, in the same language, with the same tooling.</p>
<p>The two-layer pattern I settled on: LAYER 1 are primitive values in <code>:root</code> (raw hex, raw numbers). LAYER 2 is <code>@theme</code> which maps those primitives to semantic utility names. To change the entire look of an app, you edit LAYER 1 only. The utilities don't change, the components don't change — just the values they point to.</p>
<h2>What took getting used to</h2>
<p>The mental model shift is real. You stop thinking about <code>bg-violet-500</code> and start thinking about <code>bg-primary</code>. You stop memorising the scale and start defining your own scale. The first week feels slower. By the second week it feels more correct.</p>`,
      published: true,
      coverImageId: null,
      userId: user.id,
      tags: {
        connectOrCreate: [
          { where: { slug: 'css' }, create: { name: 'CSS', slug: 'css' } },
          { where: { slug: 'tailwind' }, create: { name: 'Tailwind', slug: 'tailwind' } },
          { where: { slug: 'design-systems' }, create: { name: 'Design Systems', slug: 'design-systems' } },
        ],
      },
    },
  })

  await prisma.blogPost.create({
    data: {
      title: 'The Case for Dark Mode as Default',
      slug: 'case-for-dark-mode-as-default',
      excerpt:
        'Dark mode as an option is good UX. Dark mode as the default is a design decision — one that changes how you think about color, contrast, and identity.',
      content: `<p>Most dark mode implementations are afterthoughts. A light design with a CSS class that inverts the palette. The result is always slightly wrong: whites that were warm become cool, shadows that worked in light feel flat in dark, and brand colors that sang on white look different against near-black.</p>
<h2>Designing dark-first changes the problem</h2>
<p>When dark is your default, you design for depth differently. Surfaces aren't white with shadows — they're layered neutrals that create elevation through lightness progression. A card isn't a white rectangle with a drop shadow. It's a slightly lighter panel on a slightly darker background.</p>
<p>Typography choices matter more too. A typeface that's sharp and readable on white can feel too light at small sizes against dark. Tracking that works at 16px on light might need adjusting on dark. Every weight decision has different consequences.</p>
<h2>Color is the real work</h2>
<p>Accent colors behave differently on dark backgrounds. A violet that's vibrant and trustworthy on white can look electric, almost aggressive, on near-black if you're not careful. The solution isn't to desaturate — it's to be more deliberate about where the accent appears and how much of it you show. Scarcity makes accent colors work harder.</p>
<p>The design principle I follow: the accent color should appear on at most three things per page — a badge, a CTA, and an active state. Everything else earns its keep through typography and spacing.</p>`,
      published: true,
      coverImageId: null,
      userId: user.id,
      tags: {
        connectOrCreate: [
          { where: { slug: 'design' }, create: { name: 'Design', slug: 'design' } },
          { where: { slug: 'css' }, create: { name: 'CSS', slug: 'css' } },
          { where: { slug: 'ux' }, create: { name: 'UX', slug: 'ux' } },
        ],
      },
    },
  })

  // ─── 5. TESTIMONIALS ──────────────────────────────────────────────────────
  console.log('  → Testimonials')
  await prisma.testimonial.deleteMany({ where: { userId: user.id } })
  await prisma.testimonial.createMany({
    data: [
      {
        name: 'Sara Al-Rashidi',
        role: 'Product Manager',
        company: 'Noon',
        quote:
          'Mohamed delivered a component library that our entire team adopted without friction. What stood out was his ability to translate our design requirements into a system — not just a set of components. The documentation alone was worth the engagement.',
        avatarId: null,
        featured: true,
        published: true,
        order: 0,
        userId: user.id,
      },
      {
        name: 'Tarek Mansour',
        role: 'Engineering Lead',
        company: 'Instabug',
        quote:
          "Working with Mohamed on the dashboard rewrite was the smoothest frontend collaboration I've had. He asked the right questions before writing a line of code, and the output matched the design spec without the usual back-and-forth. He genuinely understands both sides of the design-to-code gap.",
        avatarId: null,
        featured: true,
        published: true,
        order: 1,
        userId: user.id,
      },
      {
        name: 'Lina Khalil',
        role: 'Founder & CEO',
        company: 'Paperstack',
        quote:
          'We were three weeks from launch with a UI that looked like a prototype. Mohamed joined and rebuilt the core screens in two weeks without breaking what was working. He shipped on time and the quality made our investors ask who did the design.',
        avatarId: null,
        featured: true,
        published: true,
        order: 2,
        userId: user.id,
      },
    ],
  })

  // ─── 6. RESUME ────────────────────────────────────────────────────────────
  console.log('  → Resume')

  // Delete existing resume and all children (cascade)
  const existingResume = await prisma.resumeProfile.findUnique({ where: { userId: user.id } })
  if (existingResume) {
    await prisma.resumeProfile.delete({ where: { userId: user.id } })
  }

  await prisma.resumeProfile.create({
    data: {
      headline: 'Frontend Developer — Product Experience Layer',
      summary:
        "I build interfaces that engineers respect and users remember. My work sits at the intersection of design systems, performance engineering, and the smaller decisions that determine whether a product feels good or just works. I've shipped production Vue applications for companies ranging from early-stage startups to regional enterprise — always with the same goal: making the interface a competitive advantage, not an implementation detail.",
      location: 'Cairo, Egypt',
      downloadUrl: null,
      userId: user.id,
      experiences: {
        create: [
          {
            company: 'Freelance',
            title: 'Senior Frontend Developer',
            location: 'Remote',
            startDate: new Date('2022-01-01'),
            endDate: null,
            current: true,
            bullets: [
              'Delivered frontend solutions for 8 clients across SaaS, e-commerce, and fintech verticals',
              'Built and shipped a complete design system adopted by 3 separate product teams',
              'Reduced LCP by 62% on a high-traffic marketing site through image optimisation and critical CSS inlining',
              'Established Nuxt 4 project templates and conventions used by junior developers on client teams',
            ],
            order: 0,
          },
          {
            company: 'Keleya',
            title: 'Frontend Developer',
            location: 'Cairo, Egypt (Hybrid)',
            startDate: new Date('2020-06-01'),
            endDate: new Date('2021-12-31'),
            current: false,
            bullets: [
              'Built Vue 3 component library from scratch that replaced three inconsistent UI codebases',
              'Owned the checkout flow rewrite — reduced abandonment by 18% through UX improvements and faster load times',
              'Introduced TypeScript across the frontend codebase and wrote migration guide for the team',
            ],
            order: 1,
          },
        ],
      },
      educations: {
        create: [
          {
            school: 'Cairo University',
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            startDate: new Date('2016-09-01'),
            endDate: new Date('2020-06-30'),
            current: false,
            description: null,
            order: 0,
          },
        ],
      },
      skillGroups: {
        create: [
          {
            name: 'Core',
            skills: ['Vue 3', 'Nuxt 4', 'TypeScript', 'JavaScript (ES2022+)', 'HTML5', 'CSS3'],
            order: 0,
          },
          {
            name: 'Styling & Design Systems',
            skills: ['Tailwind CSS 4', 'shadcn-vue', 'CSS Variables', 'CVA', 'Motion / GSAP', 'Figma'],
            order: 1,
          },
          {
            name: 'Backend & Infrastructure',
            skills: ['NestJS', 'Prisma', 'PostgreSQL', 'Node.js', 'REST APIs', 'Supabase'],
            order: 2,
          },
          {
            name: 'Tooling',
            skills: ['Pinia', 'VeeValidate', 'Zod', 'Vitest', 'Git', 'Docker'],
            order: 3,
          },
        ],
      },
      certifications: {
        create: [
          {
            name: 'Meta Frontend Developer Professional Certificate',
            issuer: 'Meta / Coursera',
            issueDate: new Date('2022-03-01'),
            expiryDate: null,
            url: 'https://coursera.org/verify/professional-cert/example',
            order: 0,
          },
        ],
      },
      links: {
        create: [
          { label: 'GitHub', url: 'https://github.com/mohamedessam', order: 0 },
          { label: 'LinkedIn', url: 'https://linkedin.com/in/mohamedessam', order: 1 },
          { label: 'Portfolio', url: 'https://mohamedessam.dev', order: 2 },
        ],
      },
    },
  })

  console.log('✅ Portfolio data seeded successfully.')
  console.log('   → 1 settings record')
  console.log('   → 4 services')
  console.log('   → 4 projects (3 featured)')
  console.log('   → 3 blog posts')
  console.log('   → 3 testimonials')
  console.log('   → 1 resume profile with full children')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })