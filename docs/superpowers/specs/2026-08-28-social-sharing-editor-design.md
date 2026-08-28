# Social Sharing Editor — Design

## Problem

ClaudePress emits social/SEO metadata through `components/Cp/SeoHead.vue`, but
clients have no way to author or check it, and the layer under-emits.

Two concrete failures surfaced while tuning `infinity` (PawPress at Infinity
Graphics):

1. **No authoring surface, no validation.** Getting the homepage's `og:title`,
   `og:description`, and share image into the sweet spot took a developer
   editing `pages/index.vue` by hand and re-checking a third-party linter. A
   client cannot do this. There is nowhere in `/admin/*` to write share copy,
   upload a card image, or see whether a value is too long or too short.

2. **The lengths fight each other and nothing warns you.** `CpSeoHead` feeds a
   single string to both `og:description` (ideal ≤125) and the meta description
   (ideal ≥120), so the only safe band is **120–125**. The homepage first
   overshot (139, the long `hero_lead`), then undershot (42, the `tagline`
   fallback) before landing at 125 by hand. The title is worse: it is composed
   as `"{title} — {site_name}"`, and with `site_name` = "PawPress at Infinity
   Graphics" (29 chars) a seemingly-short title blows past 60. A flat character
   cap cannot catch either problem.

Separately, `CpSeoHead` never emits `og:image:alt`, `twitter:image:alt`, or
`twitter:site` — an accessibility and Twitter-card-compliance gap.

## Solution

Add a client-facing **Social sharing** editor to the ClaudePress settings admin,
backed by a few optional `settings` fields, plus the missing tags in
`CpSeoHead`, plus a reusable live-validation field component. Every change is
additive and falls back gracefully so the live sites that consume `main`
(`argyle-village-v2`, `infinity.graphics`) render identically until someone
fills the new fields in.

### Where it lives

A new **"Social sharing"** section appended to the existing
`pages/admin/settings/index.vue` (not a separate route — reuses the settings
save flow and is more discoverable). Layout: fields on the left, a **live
share-card preview** (Facebook/LinkedIn/X style) on the right that redraws as
the client types, using the entered title/description/image.

### Data model

Additive migration on the `settings` collection, all fields **optional**:

- `social_description` (text) — the default share/meta description
- `og_image_alt` (text) — alt text for the site-wide card image
- `twitter_site` (text) — `@handle`

`og_image` (file upload) already exists on `settings`; we begin using it plus
its new alt. No new fields on `posts` — `cover` (file) and `seo_title` /
`seo_description` already exist.

### CpSeoHead behavior

`components/Cp/SeoHead.vue` changes:

- **Description precedence** becomes `props.description || settings.social_description || settings.tagline`.
  The editor now controls the site default; `tagline` remains the graceful
  fallback (so existing sites are unchanged until they set `social_description`).
- **New tags emitted:** `og:image:alt` and `twitter:image:alt` (from a new
  `imageAlt` prop, defaulting to `settings.og_image_alt`), and `twitter:site`
  (from `settings.twitter_site`). Absent values emit no tag.
- **Image dimensions:** emit `og:image:width` / `og:image:height` **only** for
  the known-1200×630 site-wide card, never for arbitrary post covers —
  declaring wrong dimensions is worse than declaring none. See Open Details.

### The featured-image default (mostly already true)

Post pages already do the right thing: `posts.cover` is a single image `file`
field, and `pages/blog/[slug].vue` already passes `:image="coverUrl"` to
`CpSeoHead`, so a post with a featured image already uses it as its `og:image`
and falls back to the site-wide card otherwise. This spec **preserves** that and
adds a per-post `og:image:alt` (derived from `post.title`, since posts have no
image-alt field). Regular pages have no image field, so this default is
post-specific by design.

### Validation component

A reusable `Cp/MetaField.vue` (or similar): a labeled text field with a live
character counter and **red / amber / green bands**. It never blocks save — a
client is never locked out of their own copy; out-of-band values warn only.

Band rules:

- **Title** — validated on the *composed* length `"{value} — {site_name}"`, not
  the raw field. Green ≤60, amber 61–70, red >70. The composed preview is shown
  under the field so the client sees the real tag.
- **Description** — green 120–125 (the og∩meta overlap), amber 80–119 or
  126–150, red <80 or >150.
- **Image alt** — green when present, amber when empty.

Built standalone so the per-page `seo_title` / `seo_description` forms can adopt
it later (not in this pass — see Non-goals).

### Blast-radius safety

Everything is additive and optional. After `main` deploys, `argyle-village-v2`
and `infinity.graphics` render byte-identical metadata until an editor fills a
new field. This is the only safe way to change a layer whose consumers cannot be
run locally.

### infinity seed

A small **infinity-side** migration seeds `settings.social_description` with the
125-char string currently hardcoded in `infinity/pages/index.vue`, and that
explicit `description=` prop is removed — so the client owns the copy going
forward and the homepage flows through the same path as every other site.

## Non-goals (YAGNI)

- Retrofitting live validation onto the per-page `seo_*` forms — the component is
  built to allow it, but wiring it is a later pass.
- An in-admin image *generator*. Clients upload; the `infinity/design/og`
  canvas + headless render stays the designer's tool.
- Splitting `og:description` from the meta description into two fields — decided
  against; one shared string validated to 120–125 (see Problem #2).
- A dynamic/schema-driven form. Follows the existing hardcoded-input convention
  of every other ClaudePress admin page.

## Open details (resolve at plan time)

- **Image dimensions:** PocketBase does not store image dimensions. Options:
  emit width/height only for the bundled 1200×630 card and omit for uploads /
  covers; or read dimensions server-side on upload. Leaning toward the former
  (simplest, and never wrong).
- **Preview fidelity:** how closely the live preview mimics each platform's
  crop. A single representative 1.91:1 card is likely enough for v1.

## Testing

- `CpSeoHead` unit tests: description precedence chain; presence/absence of the
  new alt / twitter:site / dimension tags given each settings state.
- Validation-band pure logic (composed-title length, description band
  boundaries) as plain unit tests, independent of the Vue component.
- Manual: the settings editor round-trips the new fields and the live preview
  tracks input; a post with a `cover` still yields `og:image` = cover.
