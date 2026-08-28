# Social Sharing Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give ClaudePress clients an admin editor to author and validate their social/SEO share metadata (title, description, image + alt, Twitter handle), and emit the tags CpSeoHead currently omits.

**Architecture:** Pure validation/precedence helpers in `utils/socialMeta.ts` (unit-tested with vitest), consumed by both `CpSeoHead` (runtime tags) and a new presentational `CpMetaField` (admin bands). New optional `settings` fields, all with graceful fallback so live consumers render identically until a field is filled. A "Social sharing" section is appended to the existing settings admin page with a live preview.

**Tech Stack:** Nuxt 3.12, Vue 3.4, PocketBase 0.26.8 (client) + PB JS migrations, vitest (new devDependency, test-only).

**Spec:** `docs/superpowers/specs/2026-08-28-social-sharing-editor-design.md`

## Global Constraints

- All new `settings` fields are **optional** with graceful fallback; after `main` deploys, `argyle-village-v2` and live `infinity.graphics` MUST render byte-identical metadata until an editor fills a field.
- Description is a **single string** feeding both `og:description` and the meta description; validated to the **120–125** overlap band.
- Validation **warns, never blocks save**.
- Title is validated on the **composed** length `"{title} — {site_name}"` (em dash `—`, U+2014, spaces around), never the raw field.
- Follow the existing hardcoded-form admin convention (`pages/admin/settings/index.vue`) — explicit `<input>` per field, manual `FormData`, slate/blue Tailwind, `disabled="saving"`.
- Follow the PB migration convention: sequential `17100000NN_name.js`, `Field`/`app.save(collection)` API, with a down-migration. New number: **`1710000006`** (last is `1710000005_settings_og_image.js`).
- Only new dependency is **vitest**, dev-only. No new runtime dependencies.
- The band separator string and the composed-title separator MUST come from the same `composedTitle` helper so preview, validator, and emitted tag never drift.

---

### Task 1: Pure metadata helpers + vitest harness

**Files:**
- Create: `utils/socialMeta.ts`
- Create: `tests/socialMeta.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json` (add `vitest` devDependency + `test` script)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type Band = 'green' | 'amber' | 'red'`
  - `composedTitle(title: string, siteName: string): string`
  - `resolveShareTitle(propTitle: string | null | undefined, settings: SettingsLike): string`
  - `resolveShareDescription(propDescription: string | null | undefined, settings: SettingsLike): string`
  - `titleBand(composedLength: number): Band`
  - `descriptionBand(length: number): Band`
  - `altBand(alt: string): Band`
  - `type SettingsLike = { social_title?: string; social_description?: string; tagline?: string } | null`

- [ ] **Step 1: Add vitest**

Run: `npm install -D vitest`
Expected: `vitest` appears under `devDependencies` in `package.json`.

- [ ] **Step 2: Add the test script**

In `package.json` `"scripts"`, add:

```json
"test": "vitest run"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Write the failing tests**

Create `tests/socialMeta.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  composedTitle,
  resolveShareTitle,
  resolveShareDescription,
  titleBand,
  descriptionBand,
  altBand,
} from '../utils/socialMeta'

describe('composedTitle', () => {
  it('joins title and site name with an em dash', () => {
    expect(composedTitle('Preservation breeder sites', 'PawPress at Infinity Graphics'))
      .toBe('Preservation breeder sites — PawPress at Infinity Graphics')
  })
  it('is just the site name when the title is empty', () => {
    expect(composedTitle('', 'Infinity Graphics')).toBe('Infinity Graphics')
  })
})

describe('resolveShareTitle / resolveShareDescription precedence', () => {
  it('title prefers the prop, then settings.social_title, then empty', () => {
    expect(resolveShareTitle('Prop', { social_title: 'S' })).toBe('Prop')
    expect(resolveShareTitle('', { social_title: 'S' })).toBe('S')
    expect(resolveShareTitle(null, null)).toBe('')
  })
  it('description prefers prop, then social_description, then tagline', () => {
    expect(resolveShareDescription('P', { social_description: 'S', tagline: 'T' })).toBe('P')
    expect(resolveShareDescription('', { social_description: 'S', tagline: 'T' })).toBe('S')
    expect(resolveShareDescription('', { tagline: 'T' })).toBe('T')
    expect(resolveShareDescription('', null)).toBe('')
  })
})

describe('titleBand (composed length)', () => {
  it('green at <=60, amber 61-70, red >70', () => {
    expect(titleBand(58)).toBe('green')
    expect(titleBand(60)).toBe('green')
    expect(titleBand(61)).toBe('amber')
    expect(titleBand(70)).toBe('amber')
    expect(titleBand(71)).toBe('red')
  })
})

describe('descriptionBand', () => {
  it('green only in the 120-125 overlap', () => {
    expect(descriptionBand(120)).toBe('green')
    expect(descriptionBand(125)).toBe('green')
  })
  it('amber for 80-119 and 126-150', () => {
    expect(descriptionBand(80)).toBe('amber')
    expect(descriptionBand(119)).toBe('amber')
    expect(descriptionBand(126)).toBe('amber')
    expect(descriptionBand(150)).toBe('amber')
  })
  it('red below 80 or above 150', () => {
    expect(descriptionBand(0)).toBe('red')
    expect(descriptionBand(79)).toBe('red')
    expect(descriptionBand(151)).toBe('red')
  })
})

describe('altBand', () => {
  it('green when present, amber when blank', () => {
    expect(altBand('A dog at a show')).toBe('green')
    expect(altBand('   ')).toBe('amber')
    expect(altBand('')).toBe('amber')
  })
})
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../utils/socialMeta'`.

- [ ] **Step 6: Implement `utils/socialMeta.ts`**

```ts
// Pure, framework-free helpers for social/SEO metadata. Shared by CpSeoHead
// (runtime tags) and CpMetaField (admin validation bands) so the two never
// disagree about composed-title length or which fallback wins.

export type Band = 'green' | 'amber' | 'red'

export type SettingsLike = {
  social_title?: string
  social_description?: string
  tagline?: string
} | null

const SEP = ' — ' // U+2014 em dash, spaces both sides — the ONE separator

export function composedTitle(title: string, siteName: string): string {
  return title ? `${title}${SEP}${siteName}` : siteName
}

export function resolveShareTitle(
  propTitle: string | null | undefined,
  settings: SettingsLike,
): string {
  return propTitle || settings?.social_title || ''
}

export function resolveShareDescription(
  propDescription: string | null | undefined,
  settings: SettingsLike,
): string {
  return propDescription || settings?.social_description || settings?.tagline || ''
}

export function titleBand(composedLength: number): Band {
  if (composedLength <= 60) return 'green'
  if (composedLength <= 70) return 'amber'
  return 'red'
}

export function descriptionBand(length: number): Band {
  if (length >= 120 && length <= 125) return 'green'
  if (length < 80 || length > 150) return 'red'
  return 'amber'
}

export function altBand(alt: string): Band {
  return alt.trim().length > 0 ? 'green' : 'amber'
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — all cases green.

- [ ] **Step 8: Commit**

```bash
git add utils/socialMeta.ts tests/socialMeta.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat: pure social-metadata helpers + vitest harness"
```

---

### Task 2: Migration — settings social-meta fields

**Files:**
- Create: `backend/pb_migrations/1710000006_settings_social_meta.js`

**Interfaces:**
- Consumes: the existing `settings` collection.
- Produces: `settings.social_title`, `settings.social_description`, `settings.og_image_alt`, `settings.twitter_site` (all optional text). Consumed by Tasks 3, 5, 6.

- [ ] **Step 1: Write the migration**

Model it on `1710000005_settings_og_image.js`:

```js
/// <reference path="../pb_data/types.d.ts" />

// ClaudePress base layer — client-authored social/SEO defaults on the settings
// singleton. All optional: CpSeoHead falls back to tagline / per-page props /
// the bundled og.png when unset, so existing sites are unchanged until filled.

migrate((app) => {
  const settings = app.findCollectionByNameOrId('settings')
  const text = (name) => new Field({ type: 'text', name })
  settings.fields.add(text('social_title'))
  settings.fields.add(text('social_description'))
  settings.fields.add(text('og_image_alt'))
  settings.fields.add(text('twitter_site'))
  app.save(settings)
}, (app) => {
  const settings = app.findCollectionByNameOrId('settings')
  for (const name of ['social_title', 'social_description', 'og_image_alt', 'twitter_site']) {
    settings.fields.removeByName(name)
  }
  app.save(settings)
})
```

- [ ] **Step 2: Apply and verify against the standalone stack**

Run:
```bash
docker compose up -d           # ClaudePress standalone smoke-test stack
docker compose logs backend | grep -i "1710000006"
```
Expected: the migration is logged as applied with no error.

- [ ] **Step 3: Confirm the fields exist**

Run (adjust port to the standalone PB):
```bash
curl -s http://localhost:8090/api/collections/settings | \
  grep -oE '"name":"(social_title|social_description|og_image_alt|twitter_site)"'
```
Expected: all four names printed.

- [ ] **Step 4: Commit**

```bash
git add backend/pb_migrations/1710000006_settings_social_meta.js
git commit -m "feat: add social_title/description/og_image_alt/twitter_site to settings"
```

---

### Task 3: CpSeoHead — precedence + missing tags

**Files:**
- Modify: `components/Cp/SeoHead.vue`
- Modify: `pages/blog/[slug].vue` (pass the post title as image alt)

**Interfaces:**
- Consumes: `composedTitle`, `resolveShareTitle`, `resolveShareDescription` from Task 1; the `settings` fields from Task 2.
- Produces: a new optional prop `imageAlt?: string | null` on `CpSeoHead`; emitted tags `og:image:alt`, `twitter:image:alt`, `twitter:site`, and `og:image:width`/`height` for the default card only.

- [ ] **Step 1: Add the `imageAlt` prop**

In `components/Cp/SeoHead.vue`, extend `defineProps`:

```ts
const props = defineProps<{
  title?: string | null
  description?: string | null
  image?: string | null
  imageAlt?: string | null
  type?: 'website' | 'article'
}>()
```

- [ ] **Step 2: Route title & description through the helpers**

Replace the existing `fullTitle` and `description` computeds:

```ts
const fullTitle = computed(() =>
  composedTitle(resolveShareTitle(props.title, settings), siteName),
)

const description = computed(() =>
  resolveShareDescription(props.description, settings),
)
```

(`composedTitle`, `resolveShareTitle`, `resolveShareDescription` are Nuxt
auto-imported from `utils/`.)

- [ ] **Step 3: Resolve the image alt**

Add after the `ogImage` computed:

```ts
const imageAlt = computed<string | null>(
  () => props.imageAlt || settings?.og_image_alt || null,
)
```

- [ ] **Step 4: Emit the new tags**

Extend the `useSeoMeta({ ... })` call with these keys (functions so an unset
value emits no tag; width/height only for the default card, i.e. when no
per-page `image` prop was passed):

```ts
  ogImageAlt: () => imageAlt.value || undefined,
  ogImageWidth: () => (props.image ? undefined : 1200),
  ogImageHeight: () => (props.image ? undefined : 630),
  twitterImageAlt: () => imageAlt.value || undefined,
  twitterSite: () => settings?.twitter_site || undefined,
```

- [ ] **Step 5: Pass the post title as image alt on blog posts**

In `pages/blog/[slug].vue`, update the `CpSeoHead` usage (currently
`:image="coverUrl || undefined"`) to add:

```html
        :image-alt="post.title"
```

- [ ] **Step 6: Verify the build and emitted tags**

Run:
```bash
docker compose up -d --build         # standalone stack
curl -s http://localhost:3000/ | grep -oiE \
  '<meta (property="og:(title|description|image:alt|image:width|image:height)"|name="twitter:(site|image:alt)")[^>]*>'
```
Expected: `og:image:width`/`height` present on the homepage (default card),
`og:image:alt` present when `og_image_alt` is set, `twitter:site` present when
set, and title/description still render. No console errors.

- [ ] **Step 7: Commit**

```bash
git add components/Cp/SeoHead.vue pages/blog/[slug].vue
git commit -m "feat: CpSeoHead emits image alt / twitter:site / card dimensions via settings"
```

---

### Task 4: CpMetaField — reusable validated field

**Files:**
- Create: `components/Cp/MetaField.vue`

**Interfaces:**
- Consumes: `Band`, `titleBand`, `descriptionBand`, `altBand`, `composedTitle` from Task 1.
- Produces: `<CpMetaField v-model="..." kind="title|description|alt" label="..." :site-name="..." />` — a presentational field with a live colored counter; emits `update:modelValue`.

- [ ] **Step 1: Build the component**

```vue
<template>
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1" :for="fieldId">{{ label }}</label>
    <textarea
      v-if="kind === 'description'"
      :id="fieldId"
      :value="modelValue"
      rows="3"
      :disabled="disabled"
      class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
      @input="onInput"
    ></textarea>
    <input
      v-else
      :id="fieldId"
      :value="modelValue"
      type="text"
      :disabled="disabled"
      class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      @input="onInput"
    />
    <div class="flex items-center justify-between mt-1">
      <p class="text-xs text-slate-500">{{ hint }}</p>
      <span class="text-xs font-medium" :class="bandClass">{{ counterText }}</span>
    </div>
    <p v-if="kind === 'title'" class="text-xs text-slate-400 mt-1 truncate">
      Preview: {{ preview }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Band } from '~/utils/socialMeta'

const props = withDefaults(defineProps<{
  modelValue: string
  kind: 'title' | 'description' | 'alt'
  label: string
  siteName?: string
  disabled?: boolean
}>(), { siteName: '', disabled: false })

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
const onInput = (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value)

const fieldId = computed(() => `meta-${props.kind}`)
const preview = computed(() => composedTitle(props.modelValue, props.siteName))

const length = computed(() =>
  props.kind === 'title' ? preview.value.length : props.modelValue.length,
)

const band = computed<Band>(() => {
  if (props.kind === 'title') return titleBand(length.value)
  if (props.kind === 'description') return descriptionBand(length.value)
  return altBand(props.modelValue)
})

const bandClass = computed(() => ({
  green: 'text-green-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
}[band.value]))

const counterText = computed(() =>
  props.kind === 'alt'
    ? (band.value === 'green' ? 'set' : 'missing')
    : `${length.value} chars`,
)

const hint = computed(() => ({
  title: 'Aim for ≤60 characters including your site name.',
  description: 'Aim for 120–125 characters (works for both social and Google).',
  alt: 'Describe the share image for screen readers.',
}[props.kind]))
</script>
```

- [ ] **Step 2: Verify it type-checks in the build**

Run: `docker compose up -d --build` (standalone) — expect no build error. (The
component is exercised for real in Task 5; there is no standalone unit harness
for Nuxt components in this repo, so the band logic it relies on is the part
under test, and that is covered by Task 1.)

- [ ] **Step 3: Commit**

```bash
git add components/Cp/MetaField.vue
git commit -m "feat: CpMetaField reusable validated metadata field"
```

---

### Task 5: Settings admin "Social sharing" section + live preview

**Files:**
- Modify: `pages/admin/settings/index.vue`

**Interfaces:**
- Consumes: `CpMetaField` (Task 4), the `settings` fields (Task 2).
- Produces: editing UI for `social_title`, `social_description`, `og_image_alt`, `twitter_site`; no new exported interface.

- [ ] **Step 1: Extend the reactive form**

In the `reactive({ ... })` form object, add:

```ts
  social_title: '',
  social_description: '',
  og_image_alt: '',
  twitter_site: '',
```

- [ ] **Step 2: Load the fields in `onMounted`**

After `form.footer_text = record.footer_text ?? ''`, add:

```ts
  form.social_title = record.social_title ?? ''
  form.social_description = record.social_description ?? ''
  form.og_image_alt = record.og_image_alt ?? ''
  form.twitter_site = record.twitter_site ?? ''
```

- [ ] **Step 3: Append the fields to `FormData` in `handleSubmit`**

After `data.append('footer_text', form.footer_text)`, add:

```ts
    data.append('social_title', form.social_title)
    data.append('social_description', form.social_description)
    data.append('og_image_alt', form.og_image_alt)
    data.append('twitter_site', form.twitter_site)
```

- [ ] **Step 4: Add the section markup**

Insert a new section before the Footer section (after the Social section):

```html
      <!-- Social sharing / SEO -->
      <div class="space-y-4">
        <h2 class="text-sm font-semibold text-slate-900 uppercase tracking-wide">Social sharing</h2>
        <p class="text-xs text-slate-500">
          Controls the title, description, and card shown when your site is
          linked in Google, Slack, Facebook, iMessage, and X. Upload the card
          image under Branding above.
        </p>
        <CpMetaField v-model="form.social_title" kind="title" label="Default share title" :site-name="form.site_name" :disabled="saving" />
        <CpMetaField v-model="form.social_description" kind="description" label="Default share description" :disabled="saving" />
        <CpMetaField v-model="form.og_image_alt" kind="alt" label="Share image alt text" :disabled="saving" />
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="twitter_site">X / Twitter handle</label>
          <input
            id="twitter_site"
            v-model="form.twitter_site"
            type="text"
            placeholder="@yourhandle"
            :disabled="saving"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        <!-- Live preview card -->
        <div class="mt-2">
          <p class="text-xs font-medium text-slate-500 mb-1">Preview</p>
          <div class="max-w-md border border-slate-200 rounded-md overflow-hidden">
            <div class="aspect-[1200/630] bg-slate-100">
              <img v-if="currentOgImageUrl" :src="currentOgImageUrl" alt="Share preview" class="h-full w-full object-cover" />
              <div v-else class="h-full w-full flex items-center justify-center text-xs text-slate-400">No share image uploaded</div>
            </div>
            <div class="p-3 bg-white">
              <p class="text-sm font-semibold text-slate-900 truncate">{{ previewTitle }}</p>
              <p class="text-xs text-slate-600 line-clamp-2">{{ form.social_description }}</p>
            </div>
          </div>
        </div>
      </div>
```

- [ ] **Step 5: Add the composed preview-title computed**

In `<script setup>`, add:

```ts
const previewTitle = computed(() => composedTitle(form.social_title, form.site_name))
```

- [ ] **Step 6: Manual verification**

Run `docker compose up -d --build` (standalone). Open `/admin/settings`:
- The Social sharing section renders with three `CpMetaField`s and the handle input.
- Typing a long title turns the counter amber/red on the **composed** length; a 120–125 description shows green.
- The preview card tracks the title/description and shows the uploaded og image.
- Save, reload — all four fields round-trip.

- [ ] **Step 7: Commit**

```bash
git add pages/admin/settings/index.vue
git commit -m "feat: Social sharing editor section with live preview in settings admin"
```

---

### Task 6: infinity seed + drop hardcoded homepage props

> **Different repository.** This task is in `~/sites/infinity`, not ClaudePress. Create a branch there (e.g. `feat/social-share-meta`) and commit in that repo. It depends on the ClaudePress migration (Task 2) being present in infinity's PB image (infinity's backend build includes the ClaudePress base migrations).

**Files:**
- Create: `~/sites/infinity/backend/pb_migrations/1787890000_seed_social_meta.js`
- Modify: `~/sites/infinity/pages/index.vue`

**Interfaces:**
- Consumes: `settings.social_title` / `settings.social_description` (Task 2), CpSeoHead precedence (Task 3).
- Produces: nothing exported.

- [ ] **Step 1: Write the seed migration**

Numbered after infinity's latest (`1787880000_infinity_pricing_redesign.js`) so it runs after the ClaudePress base fields exist:

```js
/// <reference path="../pb_data/types.d.ts" />

// infinity — seed the site-wide social defaults the client now owns via the
// admin (moved out of the hardcoded CpSeoHead props on the homepage).

migrate((app) => {
  const s = app.findFirstRecordByFilter('settings', 'id != ""')
  s.set('social_title', 'Preservation breeder sites')
  s.set('social_description',
    'Easy-to-edit websites for preservation dog breeders — dogs, pedigrees, health testing, and inquiry forms you manage yourself.')
  app.save(s)
}, (app) => {
  const s = app.findFirstRecordByFilter('settings', 'id != ""')
  s.set('social_title', '')
  s.set('social_description', '')
  app.save(s)
})
```

- [ ] **Step 2: Remove the hardcoded props from the homepage**

In `~/sites/infinity/pages/index.vue`, replace the current `CpSeoHead` block
(the commented block with `title="Preservation breeder sites"` and the explicit
`description="..."`) with a bare tag plus a short comment:

```html
    <!-- Title/description now come from settings.social_title /
         social_description (admin → Social sharing), so the client owns them.
         The richer card copy lives in the og:image (design/og → public/og.png). -->
    <CpSeoHead />
```

- [ ] **Step 3: Rebuild and verify the source moved, output unchanged**

Run:
```bash
cd ~/sites/infinity
docker compose -f compose.yml -f compose.local.yml up -d --build backend frontend
sleep 4
html=$(curl -s http://localhost:3003/)
printf '%s' "$html" | grep -oiE '<title>[^<]*</title>'
printf '%s' "$html" | grep -oiE '<meta name="description" content="[^"]*"'
```
Expected: title still `Preservation breeder sites — PawPress at Infinity Graphics` (58), description still the 125-char string — now sourced from `settings`, with no props in `index.vue`.

- [ ] **Step 4: Commit (in the infinity repo)**

```bash
git add backend/pb_migrations/1787890000_seed_social_meta.js pages/index.vue
git commit -m "feat: move homepage social title/description into settings (client-owned)"
```

---

## Self-Review

**Spec coverage:**
- Editor location + live preview → Task 5. ✓
- Data model (`social_title`, `social_description`, `og_image_alt`, `twitter_site`) → Task 2. ✓
- CpSeoHead precedence (title + description) + new tags (image alt, twitter:site, card dimensions) → Task 3. ✓
- Featured-image default preserved + per-post `og:image:alt` from `post.title` → Task 3 Step 5. ✓
- Validation component with composed-title / 120–125 / alt bands, warn-never-block → Tasks 1 (logic) + 4 (component). ✓
- Blast-radius safety (optional + fallback) → Task 2 (optional fields) + Task 3 (fallback precedence). ✓
- infinity seed + drop hardcoded props → Task 6. ✓
- Non-goals (per-page retrofit, in-admin generator, split description, dynamic form) → not implemented, as intended. ✓
- Open detail (dimensions only for the known card) → Task 3 Step 4 (`props.image ? undefined : 1200/630`). ✓

**Placeholder scan:** No TBD/TODO; every code step has real content; test code is concrete.

**Type consistency:** `Band`, `composedTitle`, `resolveShareTitle`, `resolveShareDescription`, `titleBand`, `descriptionBand`, `altBand` are defined in Task 1 and consumed with the same names/signatures in Tasks 3, 4, 5. The `imageAlt` prop defined in Task 3 Step 1 is used consistently in Steps 3–5. `og_image_alt` / `social_title` / `social_description` / `twitter_site` field names match across Tasks 2, 3, 5, 6.
