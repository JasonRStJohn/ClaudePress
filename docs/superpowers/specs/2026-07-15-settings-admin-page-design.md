# Settings Admin Page — Design

## Problem

Every ClaudePress site has a `settings` singleton collection (`site_name`,
`tagline`, `logo`, `favicon`, `contact_email`, `contact_phone`, `address`,
`socials`, `footer_text`), but there is no admin UI for editing it anywhere in
the project family. Editors have to use the raw PocketBase dashboard (`/_/`)
to change site name, contact info, or social links — inconsistent with every
other collection (pages, posts, documents, navigation), which all have a
custom `/admin/*` page. Whindancer's health-database-path-root spec
(`2026-07-13-health-database-path-root-design.md`) explicitly called this gap
out and deferred to the PocketBase dashboard as a workaround.

## Solution

Add a `/admin/settings` page to the ClaudePress base layer, following the
same hardcoded-form conventions as every other admin page
(`pages/admin/pages/[id].vue`, `pages/admin/posts/[id].vue`): explicit
`<input>` per field, manual `FormData` for file fields, same Tailwind
slate/blue styling, same `disabled:opacity-50` saving state, same error
banner pattern.

Sites needing settings fields beyond the base schema (e.g. whindancer's
`health_database_path_root`) extend this the same way ClaudePress sites
already extend anything else: shadow the page by copying it into the
consuming site's own `pages/admin/settings/index.vue` and add the field.
This is deliberately not a schema-driven/dynamic form — there is exactly one
known instance of a site-specific settings field today, and introducing a
generic field-renderer abstraction now would be speculative complexity this
codebase doesn't have a second use case for yet.

## Changes

### 1. New page: `pages/admin/settings/index.vue`

Singleton route (no `[id]` segment — there is exactly one `settings` record,
seeded by the base migration). `definePageMeta({ layout: 'admin', middleware:
'auth' })`, matching every other admin page.

**Data flow:**
- `onMounted`: `pb.collection('settings').getList(1, 1)`, take `items[0]` as
  `record`. Mirrors what `useSettings()` already does for the public site.
- Populate a reactive `form` from `record`. `socials.facebook` /
  `socials.instagram` unpack into two flat form fields, `facebook_url` and
  `instagram_url`, for editing.
- If `getList` returns no record, show the same `loadError` banner treatment
  `pages/admin/pages/[id].vue` uses ("Settings not found.") — no
  create-if-missing branch. The base migration guarantees the row exists and
  there is no delete path for it, so this is an error state, not a case to
  design around.
- Save: build a `FormData` (needed for the `logo`/`favicon` file fields),
  repack `facebook_url`/`instagram_url` into a `socials` object,
  `pb.collection('settings').update(record.id, data)`.
- No delete button — this is a singleton, there is nothing to delete.

**Form layout** — single page, single form, single Save button, organized
into visible (non-collapsed) labeled sections:

| Section | Fields |
|---|---|
| General | `site_name` (text), `tagline` (text) |
| Branding | `logo` (file, image preview + replace-on-select, same inline pattern as the cover-image field in `pages/admin/posts/[id].vue`), `favicon` (file, same pattern) |
| Contact | `contact_email` (text), `contact_phone` (text), `address` (textarea, rendered `whitespace-pre-line` like `Cp/Footer.vue` already does) |
| Social | `facebook_url` (text), `instagram_url` (text) — packed into/out of the `socials` json field |
| Footer | `footer_text` (`CpRichEditor`, same component `pages/admin/pages/[id].vue` uses for `body`) |

Sections use plain header `<div>`s, not `<details>` — unlike Pages' SEO
fields, nothing here is uncommon enough to hide by default.

### 2. Nav link

`layouts/admin.vue`: add `{ label: 'Settings', to: '/admin/settings' }` to
the `navItems` array, directly after Dashboard.

### 3. Docs

- `ClaudePress/README.md`: note the settings admin page under Phase 2/admin
  panel status, and mention the shadow-to-extend pattern for site-specific
  settings fields.

## Out of scope

- Schema-driven/dynamic field rendering. Revisit only if a second
  site-specific settings field shows up and the shadow-copy maintenance
  burden becomes real, not hypothetical.
- Editing `health_database_path_root` or any other site-specific field in
  the base page — that stays in each consuming site's shadowed copy.
- Adding social platforms beyond Facebook and Instagram to the base schema.
  Other platforms (Twitter/X, TikTok, LinkedIn, etc.) are added the same way:
  a site shadows the page and adds the field.
- Migration changes — the `settings` collection schema and its `updateRule`
  (already unlocked for authenticated users in `1710000001_auth_rules.js`)
  are unchanged; this is purely a new frontend page.
