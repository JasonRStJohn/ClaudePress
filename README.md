# ClaudePress

A reusable Nuxt 3 + PocketBase layer for small client-editable sites. The goal:
spin up a WordPress-style content site — pages, posts, nav, media, documents,
forms — in an afternoon, self-hosted, with no PHP and no plugin sprawl.

## Stack

- **Nuxt 3** (SSR + ISR) — frontend, SEO-friendly, cached
- **PocketBase** v0.36.8 (pinned) — SQLite + admin UI + REST + auth
- **Tailwind CSS** — styling
- **Docker Compose** — one command to run the whole stack

## How it works

This repo is a Nuxt **layer**. Sites consume it by declaring:

```ts
// your-site/nuxt.config.ts
export default defineNuxtConfig({
  extends: ['../ClaudePress'],
  // site-specific overrides here
})
```

Everything in this layer — composables, components (`Cp*`), layouts, catch-all
page router, blog pages, and the base PocketBase migration — is inherited.
Sites override by shadowing files.

## What's in the base migration

`backend/pb_migrations/0001_base.js` creates the standard collections every
small site needs:

- `settings` — singleton: site name, tagline, logo, socials, contact info
- `navigation` — hierarchical nav items (parent/child, label, href, order)
- `pages` — slug, title, body (rich text), SEO fields, published flag
- `posts` — blog posts with category relation, cover image, excerpt
- `post_categories` — post taxonomy
- `documents` — PDFs / files with category relation
- `document_categories` — document taxonomy
- `forms` — form definitions (schema JSON)
- `form_submissions` — inbound submissions

## Dual-URL model

The layer handles the two-URL problem that bit us on Argyle:

- `runtimeConfig.pbUrl` — server-side (e.g. `http://backend:8090` inside Docker)
- `runtimeConfig.public.pbUrl` — client-side (e.g. `https://cms.example.com`)

`composables/usePb.ts` picks the right one based on `import.meta.server`.

## Phase status

- **Phase 1 (in progress)**: Layer extraction, base migration, core components
- **Phase 2**: Custom auth, client login, minimal admin panel (settings
  admin page done — `/admin/settings`; sites needing settings fields beyond
  the base schema shadow this page into their own `pages/admin/settings/`,
  same as any other override)
- **Phase 3**: Production hardening (Caddy, restic backups, monitoring)
- **Phase 4**: Template CLI + docs

See `G:/My Drive/DriveSyncFiles/Vault1910/Agent/Scratch/ClaudePress.md` for the
full proposal and rationale.
