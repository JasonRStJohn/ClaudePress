# CpRichEditor Toolbar Layers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the shared `CpRichEditor` a base + opt-in layer toolbar with a subtractive `remove` escape hatch, default it to a minimal base, and fix the render-side spacing/link issues from Be Studios #98.

**Architecture:** A pure, node-testable registry+resolver (`utils/richEditorToolbar.ts`) maps `features`/`remove` to an ordered control list and the set of TipTap extensions to enable — an extension is registered only if at least one surviving control uses it. `RichEditor.vue` consumes the resolver to build both its StarterKit config and its rendered toolbar. `CpSafeHtml` gains a low-specificity flow stylesheet so authored paragraph spacing and links render.

**Tech Stack:** Nuxt 3, Vue 3 `<script setup>`, TipTap v3 (`@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`, new `@tiptap/extension-text-align`), Tailwind, Vitest 4 (node environment).

**Spec:** `docs/superpowers/specs/2026-09-15-richeditor-toolbar-layers-design.md`

## Global Constraints

- **TipTap v3.** All `@tiptap/*` deps stay in the `^3.0.0` range. New dep: `@tiptap/extension-text-align@^3.31.3`.
- **Default = minimal base.** `<CpRichEditor>` with no `features` shows only bold, italic, link (+ always-on undo/redo/clear-formatting).
- **Footgun invariant.** An extension is enabled iff ≥1 surviving control uses it. A control not exposed must not be injectable via paste/drop (e.g. `image` off ⇒ Image extension off ⇒ pasted images dropped).
- **Canonical control ids** (the `remove` vocabulary): `bold, italic, underline, strike, link, h1, h2, h3, bulletList, orderedList, blockquote, horizontalRule, code, codeBlock, image, alignLeft, alignCenter, alignRight`.
- **`full` is deprecated on arrival.** `features="full"` expands to `['decoration','blocks','markup','image']` and MUST emit a dev-only `console.warn`. It exists only to preserve current behavior during migration.
- **ClaudePress blast radius.** A change to `main` reaches every consuming site on next deploy, including the live, off-box `argyle-village-v2` and `infinity-graphics`. Those are updated in their own repos and cannot be tested from this box — say so at merge time.
- **Commit after every logical change**, staging only that change's files.
- **Finished Vikunja tickets → "In Testing" bucket**, never marked done.

---

### Task 1: Pure toolbar registry + resolver

**Files:**
- Create: `utils/richEditorToolbar.ts`
- Test: `tests/richEditorToolbar.test.ts`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces:
  - `type ToolbarFeature = 'decoration' | 'blocks' | 'layout' | 'markup' | 'image'`
  - `type ControlId` (the 18 canonical ids above)
  - `type ExtensionKey = 'bold'|'italic'|'link'|'underline'|'strike'|'heading'|'bulletList'|'orderedList'|'listItem'|'blockquote'|'horizontalRule'|'textAlign'|'code'|'codeBlock'|'image'`
  - `interface ControlDef { id: ControlId; layer: 'base' | ToolbarFeature; order: number; extensions: ExtensionKey[] }`
  - `const TOOLBAR_CONTROLS: ControlDef[]`
  - `const FULL_FEATURES: ToolbarFeature[]` = `['decoration','blocks','markup','image']`
  - `interface ResolveInput { features?: ToolbarFeature[] | 'full'; remove?: ControlId[] }`
  - `interface ResolveResult { controls: ControlId[]; extensions: Set<ExtensionKey> }`
  - `function resolveToolbar(input: ResolveInput): ResolveResult`
  - `function starterKitDisabledConfig(ext: Set<ExtensionKey>): Record<string, false>` — StarterKit members to turn off (only the disabled ones appear, each `false`; `link` is always `false` because Link is registered separately).

- [ ] **Step 1: Write the failing tests**

```ts
// tests/richEditorToolbar.test.ts
import { describe, it, expect } from 'vitest'
import {
  resolveToolbar,
  starterKitDisabledConfig,
  FULL_FEATURES,
} from '../utils/richEditorToolbar'

describe('resolveToolbar', () => {
  it('base only: bold, italic, link', () => {
    const { controls } = resolveToolbar({})
    expect(controls).toEqual(['bold', 'italic', 'link'])
  })

  it('adds decoration layer (underline, strike) in order', () => {
    const { controls } = resolveToolbar({ features: ['decoration'] })
    expect(controls).toEqual(['bold', 'italic', 'underline', 'strike', 'link'])
  })

  it('adds blocks and layout layers', () => {
    const { controls } = resolveToolbar({ features: ['blocks', 'layout'] })
    expect(controls).toEqual([
      'bold', 'italic', 'link',
      'h1', 'h2', 'h3', 'bulletList', 'orderedList', 'blockquote', 'horizontalRule',
      'alignLeft', 'alignCenter', 'alignRight',
    ])
  })

  it('remove subtracts a control', () => {
    const { controls } = resolveToolbar({ features: ['blocks'], remove: ['blockquote', 'horizontalRule'] })
    expect(controls).not.toContain('blockquote')
    expect(controls).not.toContain('horizontalRule')
    expect(controls).toContain('h1')
  })

  it('remove of an absent control is a no-op', () => {
    const base = resolveToolbar({})
    const removed = resolveToolbar({ remove: ['image'] })
    expect(removed.controls).toEqual(base.controls)
  })

  it('remove can drop a base control', () => {
    const { controls } = resolveToolbar({ remove: ['link'] })
    expect(controls).toEqual(['bold', 'italic'])
  })

  it("'full' expands to FULL_FEATURES", () => {
    expect(resolveToolbar({ features: 'full' }).controls)
      .toEqual(resolveToolbar({ features: FULL_FEATURES }).controls)
  })

  describe('footgun invariant: extensions follow surviving controls', () => {
    it('image off ⇒ no image extension', () => {
      expect(resolveToolbar({ features: ['blocks'] }).extensions.has('image')).toBe(false)
    })
    it('image on ⇒ image extension present', () => {
      expect(resolveToolbar({ features: ['image'] }).extensions.has('image')).toBe(true)
    })
    it('removing one heading keeps heading extension (siblings remain)', () => {
      expect(resolveToolbar({ features: ['blocks'], remove: ['h3'] }).extensions.has('heading')).toBe(true)
    })
    it('removing all headings drops heading extension', () => {
      const r = resolveToolbar({ features: ['blocks'], remove: ['h1', 'h2', 'h3'] })
      expect(r.extensions.has('heading')).toBe(false)
    })
    it('base always has bold/italic/link extensions', () => {
      const { extensions } = resolveToolbar({})
      expect([...extensions].sort()).toEqual(['bold', 'italic', 'link'])
    })
  })
})

describe('starterKitDisabledConfig', () => {
  it('disables StarterKit members not in the extension set, plus link', () => {
    const { extensions } = resolveToolbar({}) // base only
    const cfg = starterKitDisabledConfig(extensions)
    expect(cfg.link).toBe(false)
    expect(cfg.heading).toBe(false)
    expect(cfg.strike).toBe(false)
    expect(cfg.codeBlock).toBe(false)
    expect(cfg.bold).toBeUndefined() // bold is enabled, so not disabled
  })
  it('keeps a member enabled when its control survives', () => {
    const { extensions } = resolveToolbar({ features: ['blocks'] })
    const cfg = starterKitDisabledConfig(extensions)
    expect(cfg.heading).toBeUndefined()
    expect(cfg.blockquote).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- richEditorToolbar`
Expected: FAIL — module `../utils/richEditorToolbar` not found.

- [ ] **Step 3: Implement `utils/richEditorToolbar.ts`**

```ts
export type ToolbarFeature = 'decoration' | 'blocks' | 'layout' | 'markup' | 'image'

export type ControlId =
  | 'bold' | 'italic' | 'link'
  | 'underline' | 'strike'
  | 'h1' | 'h2' | 'h3' | 'bulletList' | 'orderedList' | 'blockquote' | 'horizontalRule'
  | 'alignLeft' | 'alignCenter' | 'alignRight'
  | 'code' | 'codeBlock'
  | 'image'

export type ExtensionKey =
  | 'bold' | 'italic' | 'link'
  | 'underline' | 'strike'
  | 'heading' | 'bulletList' | 'orderedList' | 'listItem' | 'blockquote' | 'horizontalRule'
  | 'textAlign'
  | 'code' | 'codeBlock'
  | 'image'

export interface ControlDef {
  id: ControlId
  layer: 'base' | ToolbarFeature
  order: number
  extensions: ExtensionKey[]
}

// Order drives left-to-right toolbar order. Base marks bracket the layers so
// bold/italic sit first and link sits after inline decorations.
export const TOOLBAR_CONTROLS: ControlDef[] = [
  { id: 'bold',          layer: 'base',       order: 10, extensions: ['bold'] },
  { id: 'italic',        layer: 'base',       order: 11, extensions: ['italic'] },
  { id: 'underline',     layer: 'decoration', order: 20, extensions: ['underline'] },
  { id: 'strike',        layer: 'decoration', order: 21, extensions: ['strike'] },
  { id: 'link',          layer: 'base',       order: 30, extensions: ['link'] },
  { id: 'h1',            layer: 'blocks',     order: 40, extensions: ['heading'] },
  { id: 'h2',            layer: 'blocks',     order: 41, extensions: ['heading'] },
  { id: 'h3',            layer: 'blocks',     order: 42, extensions: ['heading'] },
  { id: 'bulletList',    layer: 'blocks',     order: 43, extensions: ['bulletList', 'listItem'] },
  { id: 'orderedList',   layer: 'blocks',     order: 44, extensions: ['orderedList', 'listItem'] },
  { id: 'blockquote',    layer: 'blocks',     order: 45, extensions: ['blockquote'] },
  { id: 'horizontalRule',layer: 'blocks',     order: 46, extensions: ['horizontalRule'] },
  { id: 'alignLeft',     layer: 'layout',     order: 50, extensions: ['textAlign'] },
  { id: 'alignCenter',   layer: 'layout',     order: 51, extensions: ['textAlign'] },
  { id: 'alignRight',    layer: 'layout',     order: 52, extensions: ['textAlign'] },
  { id: 'code',          layer: 'markup',     order: 60, extensions: ['code'] },
  { id: 'codeBlock',     layer: 'markup',     order: 61, extensions: ['codeBlock'] },
  { id: 'image',         layer: 'image',      order: 70, extensions: ['image'] },
]

export const FULL_FEATURES: ToolbarFeature[] = ['decoration', 'blocks', 'markup', 'image']

export interface ResolveInput {
  features?: ToolbarFeature[] | 'full'
  remove?: ControlId[]
}

export interface ResolveResult {
  controls: ControlId[]
  extensions: Set<ExtensionKey>
}

export function resolveToolbar(input: ResolveInput = {}): ResolveResult {
  const features = input.features === 'full' ? FULL_FEATURES : (input.features ?? [])
  const remove = new Set(input.remove ?? [])
  const activeLayers = new Set<'base' | ToolbarFeature>(['base', ...features])

  const surviving = TOOLBAR_CONTROLS
    .filter(c => activeLayers.has(c.layer) && !remove.has(c.id))
    .sort((a, b) => a.order - b.order)

  const extensions = new Set<ExtensionKey>()
  for (const c of surviving) for (const e of c.extensions) extensions.add(e)

  return { controls: surviving.map(c => c.id), extensions }
}

// StarterKit v3 members we may need to disable. `link` is always disabled here
// because Link is registered separately (configured openOnClick:false). Only
// disabled members are returned (each `false`); enabled members are omitted so
// StarterKit keeps its defaults.
const STARTERKIT_MEMBERS: Partial<Record<ExtensionKey, string>> = {
  bold: 'bold', italic: 'italic', underline: 'underline', strike: 'strike',
  heading: 'heading', bulletList: 'bulletList', orderedList: 'orderedList',
  listItem: 'listItem', blockquote: 'blockquote', horizontalRule: 'horizontalRule',
  code: 'code', codeBlock: 'codeBlock',
}

export function starterKitDisabledConfig(ext: Set<ExtensionKey>): Record<string, false> {
  const cfg: Record<string, false> = { link: false }
  for (const [key, skName] of Object.entries(STARTERKIT_MEMBERS)) {
    if (!ext.has(key as ExtensionKey)) cfg[skName] = false
  }
  return cfg
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- richEditorToolbar`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add utils/richEditorToolbar.ts tests/richEditorToolbar.test.ts
git commit -m "feat(editor): pure toolbar layer resolver + registry for CpRichEditor

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Wire the resolver into RichEditor.vue + add TextAlign + editor link color

**Files:**
- Modify: `package.json` (add `@tiptap/extension-text-align`)
- Modify: `components/Cp/RichEditor.vue`

**Interfaces:**
- Consumes from Task 1: `resolveToolbar`, `starterKitDisabledConfig`, `FULL_FEATURES`, `ControlId`, `ToolbarFeature`, `ResolveInput`.
- Produces: `CpRichEditor` props `features?: ToolbarFeature[] | 'full'` and `remove?: ControlId[]` (plus existing `modelValue`, `placeholder`).

- [ ] **Step 1: Add the TextAlign dependency**

Run: `npm install @tiptap/extension-text-align@^3.31.3`
Expected: `package.json` shows `"@tiptap/extension-text-align": "^3.31.3"` alongside the other `@tiptap/*` deps.

- [ ] **Step 2: Add the two new props and resolve the toolbar**

In `components/Cp/RichEditor.vue` `<script setup>`, extend the props and compute the resolution near the top:

```ts
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline' // only if not auto-registered by StarterKit config; see Step 4 note
import {
  resolveToolbar, starterKitDisabledConfig, FULL_FEATURES,
  type ToolbarFeature, type ControlId,
} from '../../utils/richEditorToolbar'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  features?: ToolbarFeature[] | 'full'
  remove?: ControlId[]
}>()

if (import.meta.dev && props.features === 'full') {
  console.warn(
    '[ClaudePress] <CpRichEditor features="full"> is deprecated. Replace with an ' +
    'explicit layer array right-sized to this field. See ' +
    'docs/superpowers/specs/2026-09-15-richeditor-toolbar-layers-design.md',
  )
}

const resolved = resolveToolbar({ features: props.features, remove: props.remove })
```

- [ ] **Step 3: Build the extension list from the resolution**

Replace the hardcoded `extensions: [...]` array with one derived from `resolved.extensions`:

```ts
extensions: [
  StarterKit.configure(starterKitDisabledConfig(resolved.extensions)),
  Link.configure({ openOnClick: false }), // base, always present
  ...(resolved.extensions.has('image')
    ? [Image.configure({ HTMLAttributes: { class: 'rounded-md max-w-full h-auto' } })]
    : []),
  ...(resolved.extensions.has('textAlign')
    ? [TextAlign.configure({
        types: resolved.extensions.has('heading') ? ['heading', 'paragraph'] : ['paragraph'],
      })]
    : []),
  Placeholder.configure({ placeholder: props.placeholder ?? 'Start writing…' }),
],
```

Note: Underline and Strike are StarterKit v3 members, so they are enabled/disabled via `starterKitDisabledConfig`, not imported separately. Remove the `Underline` import line added in Step 2 if StarterKit provides it (verify: with `features=['decoration']`, the underline button toggles). Keep the image `handleDrop`/`handlePaste` handlers but guard them so they only upload when `resolved.extensions.has('image')` — otherwise return `false` (dropped image is discarded, honoring the footgun invariant).

- [ ] **Step 4: Render the toolbar from `resolved.controls`**

Define a control→render map in `<script setup>` (glyph, title, `isActive`, `run`), then iterate it in the template. Keep undo/redo and clear-formatting as fixed buttons outside the loop.

```ts
type ControlView = { title: string; label: string; isActive: (e: any) => boolean; run: (e: any) => void }
const CONTROL_VIEWS: Record<ControlId, ControlView> = {
  bold:           { title: 'Bold', label: 'B', isActive: e => e.isActive('bold'), run: e => e.chain().focus().toggleBold().run() },
  italic:         { title: 'Italic', label: 'I', isActive: e => e.isActive('italic'), run: e => e.chain().focus().toggleItalic().run() },
  underline:      { title: 'Underline', label: 'U', isActive: e => e.isActive('underline'), run: e => e.chain().focus().toggleUnderline().run() },
  strike:         { title: 'Strikethrough', label: 'S', isActive: e => e.isActive('strike'), run: e => e.chain().focus().toggleStrike().run() },
  link:           { title: 'Link', label: 'link', isActive: e => e.isActive('link'), run: () => handleLink() },
  h1:             { title: 'Heading 1', label: 'H1', isActive: e => e.isActive('heading', { level: 1 }), run: e => e.chain().focus().toggleHeading({ level: 1 }).run() },
  h2:             { title: 'Heading 2', label: 'H2', isActive: e => e.isActive('heading', { level: 2 }), run: e => e.chain().focus().toggleHeading({ level: 2 }).run() },
  h3:             { title: 'Heading 3', label: 'H3', isActive: e => e.isActive('heading', { level: 3 }), run: e => e.chain().focus().toggleHeading({ level: 3 }).run() },
  bulletList:     { title: 'Bullet list', label: '• list', isActive: e => e.isActive('bulletList'), run: e => e.chain().focus().toggleBulletList().run() },
  orderedList:    { title: 'Numbered list', label: '1. list', isActive: e => e.isActive('orderedList'), run: e => e.chain().focus().toggleOrderedList().run() },
  blockquote:     { title: 'Quote', label: '❝', isActive: e => e.isActive('blockquote'), run: e => e.chain().focus().toggleBlockquote().run() },
  horizontalRule: { title: 'Horizontal rule', label: '―', isActive: () => false, run: e => e.chain().focus().setHorizontalRule().run() },
  alignLeft:      { title: 'Align left', label: '⇤', isActive: e => e.isActive({ textAlign: 'left' }), run: e => e.chain().focus().setTextAlign('left').run() },
  alignCenter:    { title: 'Align center', label: '↔', isActive: e => e.isActive({ textAlign: 'center' }), run: e => e.chain().focus().setTextAlign('center').run() },
  alignRight:     { title: 'Align right', label: '⇥', isActive: e => e.isActive({ textAlign: 'right' }), run: e => e.chain().focus().setTextAlign('right').run() },
  code:           { title: 'Inline code', label: '`c`', isActive: e => e.isActive('code'), run: e => e.chain().focus().toggleCode().run() },
  codeBlock:      { title: 'Code block', label: '{ }', isActive: e => e.isActive('codeBlock'), run: e => e.chain().focus().toggleCodeBlock().run() },
  image:          { title: 'Insert image', label: 'img', isActive: () => false, run: () => imageInput.value?.click() },
}
```

Template toolbar body (replaces the hardcoded button block; keep the outer toolbar `<div>`, undo/redo, and clear-formatting):

```vue
<button type="button" :class="tb()" title="Undo" @click="editor?.chain().focus().undo().run()">↩</button>
<button type="button" :class="tb()" title="Redo" @click="editor?.chain().focus().redo().run()">↪</button>
<span class="w-px h-4 bg-slate-200 mx-1 inline-block" />
<button
  v-for="id in resolved.controls" :key="id"
  type="button" :class="tb(editor ? CONTROL_VIEWS[id].isActive(editor) : false)"
  :title="CONTROL_VIEWS[id].title"
  @click="editor && CONTROL_VIEWS[id].run(editor)"
  v-html="CONTROL_VIEWS[id].label"
/>
<span class="w-px h-4 bg-slate-200 mx-1 inline-block" />
<button type="button" :class="tb()" title="Clear formatting" @click="editor?.chain().focus().clearNodes().unsetAllMarks().run()">✕ fmt</button>
```

(The hidden `imageInput` file input stays in the template but the drop/paste image handlers now guard on `resolved.extensions.has('image')`.)

- [ ] **Step 5: Add editor-side link color**

In the component `<style>` block, add (keeps the existing placeholder rule):

```css
.tiptap a {
  color: #2563eb;          /* blue-600 — links are visibly links while editing */
  text-decoration: underline;
}
```

- [ ] **Step 6: Verify the resolver tests still pass and the app builds**

Run: `npm test`
Expected: PASS (Task 1 tests unaffected).
Run (dev smoke): `docker compose up -d --build` then open a ClaudePress admin editor page and confirm no console/build errors. (No component test harness exists — verification is build + manual.)

- [ ] **Step 7: Manual verification checklist (record results)**

- [ ] `<CpRichEditor>` with no props shows only bold, italic, link (+ undo/redo/clear).
- [ ] `:features="['blocks','layout']"` shows headings/lists/quote/hr and the three align buttons.
- [ ] `:remove="['h1','h2','h3']"` with `['blocks']` hides all headings; lists still present.
- [ ] With `image` NOT in features, pasting/dropping an image inserts nothing.
- [ ] A set link shows blue+underline in the editor.
- [ ] `:features="'full'"` logs the deprecation warning in dev.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json components/Cp/RichEditor.vue
git commit -m "feat(editor): CpRichEditor layer props (features/remove), minimal-base default, TextAlign, editor link color

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: CpSafeHtml baseline flow (render-side spacing + links)

**Files:**
- Modify: `components/Cp/SafeHtml.vue`

**Interfaces:**
- Consumes: nothing new.
- Produces: `CpSafeHtml` renders authored block spacing and styled links, at a specificity a consumer's own classes override.

- [ ] **Step 1: Add a wrapper class + low-specificity flow styles**

Give the wrapper a stable class and scope the styles under it with `:where()` (specificity 0,1,0 for the class, 0 for the inner selectors) so consumer utility classes win:

```vue
<template>
  <div class="cp-safe-html" v-html="clean" />
</template>

<script setup lang="ts">
import { sanitize } from '../../utils/sanitize'
const props = defineProps<{ html?: string | null }>()
const clean = computed(() => sanitize(props.html))
</script>

<style>
/* Baseline flow for CMS HTML rendered outside `prose`. `:where()` keeps
   specificity at zero so a consumer's own classes (fonts, colors, spacing)
   still override. Fixes #98 (authored paragraph/line spacing collapsing) and
   #107 (links not visually distinct) on CpSafeHtml surfaces. */
.cp-safe-html :where(p, ul, ol, blockquote, pre) {
  margin-block: 0.75em;
}
.cp-safe-html :where(p, ul, ol, blockquote, pre):first-child { margin-block-start: 0; }
.cp-safe-html :where(p, ul, ol, blockquote, pre):last-child  { margin-block-end: 0; }
.cp-safe-html :where(ul) { list-style: disc; padding-inline-start: 1.25em; }
.cp-safe-html :where(ol) { list-style: decimal; padding-inline-start: 1.25em; }
.cp-safe-html :where(a) { color: #2563eb; text-decoration: underline; }
</style>
```

- [ ] **Step 2: Verify on a Be Studios surface**

Run: from `~/sites/BeStudios`, `docker compose -f compose.yml -f compose.local.yml up --build` (dev), open the homepage and a journal post, confirm:
- [ ] Multi-paragraph `intro_body` / post body now shows vertical spacing between paragraphs.
- [ ] Links in that content are blue + underlined.
- [ ] BeStudios' own classes (`font-abel`, `text-navy`) still apply (not overridden).

- [ ] **Step 3: Commit**

```bash
git add components/Cp/SafeHtml.vue
git commit -m "fix(render): baseline block-flow + link styling for CpSafeHtml (#98, #107)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Right-size the Be Studios editors (#98 deliverable)

**Files (in the `~/sites/BeStudios` repo):**
- Modify: `pages/admin/home.vue:25` (`intro_body`), `:32` (`founder_bio`)
- Modify: `pages/admin/pillars/[id].vue:17` (`body`)
- Modify: `pages/admin/settings/index.vue:182` (`footer_text`)

**Interfaces:**
- Consumes: the `features`/`remove` API from Task 2 (must be deployed to the local ClaudePress layer first).

**Target toolbars (per #98: remove headers, strikethrough, image, inline code; add justification). Adjust at review if a field needs more/less:**
- `intro_body`, `founder_bio`, `pillar.body`: `:features="['blocks','layout']" :remove="['h1','h2','h3']"`
  (lists + blockquote + hr + justification; no headings, no strike/underline, no code, no image)
- `footer_text`: base only — no `features` (bold/italic/link is plenty for a footer)

- [ ] **Step 1: Update the four call sites**

Example (`pages/admin/home.vue`):

```vue
<CpRichEditor v-model="form.intro_body" placeholder="Homepage intro…" :features="['blocks','layout']" :remove="['h1','h2','h3']" />
...
<CpRichEditor v-model="form.founder_bio" placeholder="Founder bio…" :features="['blocks','layout']" :remove="['h1','h2','h3']" />
```

`pages/admin/pillars/[id].vue`:

```vue
<CpRichEditor v-model="form.body" placeholder="Pillar description…" :features="['blocks','layout']" :remove="['h1','h2','h3']" />
```

`pages/admin/settings/index.vue`:

```vue
<CpRichEditor v-model="form.footer_text" placeholder="Footer content…" />
```

- [ ] **Step 2: Verify in Be Studios admin**

Run (BeStudios dev up): open each admin editor and confirm the toolbar matches the target (no H1/H2/H3, no strike, no inline code, no image; justification present; footer shows base only).

- [ ] **Step 3: Commit (in the BeStudios repo)**

```bash
git add pages/admin/home.vue pages/admin/pillars/[id].vue pages/admin/settings/index.vue
git commit -m "feat(editor): right-size admin rich editors per Vikunja #98

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 4: Move Vikunja #98 to "In Testing"**

Set `task_buckets.bucket_id = 38` (In Testing, project 4 / view 20) for task 98; leave `tasks.done = 0`. Do NOT mark done. (See spec / memory `vikunja-completed-to-testing`.)

---

### Task 5: Migrate remaining consumers to the deprecated `full` shorthand + track cleanup

**Files (behavior-preserving one-liners; each repo its own commit):**
- `~/sites/ClaudePress`: `pages/admin/posts/[id].vue:58`, `pages/admin/posts/new.vue:40`, `pages/admin/pages/[id].vue:46`, `pages/admin/pages/new.vue:41`, `pages/admin/settings/index.vue:204`
- `~/sites/infinity`: `pages/admin/home.vue` (7 usages), `pages/admin/services/new.vue`, `pages/admin/services/[id].vue`, `pages/admin/work/new.vue`, `pages/admin/work/[id].vue`
- `~/sites/carillon`: `pages/admin/home.vue:41`
- `~/sites/whindancer`: `pages/admin/settings/index.vue:159`
- `~/sites/PawPress`: `pages/admin/kennel-settings.vue` (2), `pages/admin/news/[id].vue`, `pages/admin/puppy-inquiry/index.vue` (3), `pages/admin/page-text/index.vue`, `pages/admin/litters/[id].vue`, `components/DogFormFields.vue`, `components/PageTextFormFields.vue`

**Interfaces:** Consumes the `features="full"` shorthand from Task 2.

- [ ] **Step 1: Add `:features="'full'"` to every listed usage**

For each `<CpRichEditor v-model="…" …>` above, add `:features="'full'"`, preserving existing `v-model`/`placeholder`. This keeps today's toolbar exactly (minus the brand-new justification, which no site had). Example:

```vue
<CpRichEditor v-model="form.body" placeholder="Post content…" :features="'full'" />
```

- [ ] **Step 2: Commit per repo**

In each repo, stage only that repo's changed files and commit:

```bash
git commit -m "chore(editor): preserve current toolbar via CpRichEditor features=full (deprecated shim)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 3: Record the cleanup deferral**

Append to `~/sites/TODO.md` a deferral: "Right-size CpRichEditor `features=\"full\"` usages" listing the sites above, noting the dev-console deprecation warning is the in-code tracker, and that `argyle-village-v2` / `infinity-graphics` (live, off-box) must get `full` (or a right-sized array) in their own repos before deploying the ClaudePress layer change — untestable from this box.

```bash
cd ~/sites && git -C ClaudePress add ../TODO.md 2>/dev/null || true  # TODO.md is ungitted at ~/sites root; just save the file
```

(If `~/sites/TODO.md` is not in any git repo, saving the file is sufficient — no commit.)

- [ ] **Step 4: Note the external live repos at merge time**

When the ClaudePress layer change is merged to `main`, state explicitly in the merge/PR description that `argyle-village-v2` and `infinity-graphics` need `:features` added in their own repos before their next deploy, or their editors drop to base-only. These cannot be verified from this box.

---

## Self-Review

**1. Spec coverage:**
- Base + opt-in layers → Task 1 (resolver) + Task 2 (component). ✓
- `decoration`/`blocks`/`layout`/`markup`/`image` layers → Task 1 registry. ✓
- `remove` escape hatch + no-op on absent → Task 1 tests. ✓
- Footgun invariant (extension follows surviving buttons) → Task 1 tests + Task 2 Step 3 image guard. ✓
- Canonical control names → Task 1 `ControlId` + Global Constraints. ✓
- Default = minimal base (B) → Task 2 (no-props path) + manual check. ✓
- `full` deprecated shorthand + dev warn → Task 2 Step 2, Task 5. ✓
- Render fix: CpSafeHtml block flow (paragraph spacing) → Task 3. ✓
- Render fix: link styling (editor + site, #107) → Task 2 Step 5 (editor) + Task 3 (site). ✓
- Consumer audit / rollout, live external repos → Task 4 (BeStudios right-size), Task 5 (full shim + external note). ✓
- Finished ticket → In Testing → Task 4 Step 4. ✓

**2. Placeholder scan:** No "TBD"/"handle edge cases"/"similar to". Code steps carry real code. ✓

**3. Type consistency:** `resolveToolbar`, `starterKitDisabledConfig`, `FULL_FEATURES`, `ToolbarFeature`, `ControlId`, `ExtensionKey` used identically in Tasks 1–2. Control-view map keys are exactly the 18 `ControlId`s. ✓

**Open item for plan review:** the per-field Be Studios feature sets in Task 4 and the "footer = base only" calls are my proposals — red-line them before execution if Bridget wants a different mix. `alignLeft`/`Center`/`Right` glyphs in Task 2 Step 4 are placeholder characters; swap for icon set if desired.
