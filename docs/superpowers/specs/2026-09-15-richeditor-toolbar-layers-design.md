# CpRichEditor toolbar layers — design

**Date:** 2026-09-15
**Component:** `ClaudePress/components/Cp/RichEditor.vue`
**Origin:** Be Studios Vikunja #98 ("Text boxes do not function properly"), plus
the recurring TipTap→HTML friction across ClaudePress consumers.
**Status:** design approved in chat; awaiting spec review before planning.

## Problem

`CpRichEditor` is the single rich-text editor shared by every ClaudePress site.
Its toolbar is hardwired — every consumer gets the full set (headings, image,
inline code, strikethrough, blockquote, code block, …) whether the site wants it
or not. Clients are picky and the surface area is a footgun: an admin can inject
formatting a given site's design never intended, and the only way to trim it today
is to fork the component.

Be Studios #98 asks specifically to remove headings, strikethrough, image, and
inline code from one site's editor, and to add text justification. That is really
a request for **granular, per-use control of the editor**, consistent with the
ClaudePress "minimal footgun" philosophy.

#98 also has two render-side items, folded into this work (they are the same
"text boxes don't function properly" complaint, and belong with the editor fix):

- **Paragraph / line-break spacing not rendering on the published site.**
- **Links not visually distinct** — in the editor and on the site (overlaps #107).

### Render-side root cause (confirmed 2026-09-15)

ClaudePress has two render components: `CpRichText` (wraps content in Tailwind
`prose` + brand overrides → `<p>` margins and `prose-a:text-brand-600` link color)
and `CpSafeHtml` (bare `<div v-html>`, **no governing CSS**). Be Studios renders
`intro_body`, `pillar.body`, `post.body`, and `founder_bio` through **`CpSafeHtml`**
by design — it wants its own type (`font-abel`, `text-navy`), not the branded
`prose` theme. The `<p>` tags survive `sanitize-html` (they are allow-listed); they
simply have **no margins**, so authored blank lines/paragraph spacing collapse. The
same absence of CSS is why links render plain there.

**Fix direction:** give `CpSafeHtml` a low-specificity baseline "flow" — margins
between block elements (`p`, `ul`, `ol`, `blockquote`, `pre`) and `<a>` styling —
authored with `:where()` so a consumer's own classes (BeStudios' `font-abel`,
`text-navy`, custom link color) still win. NOT a switch to `CpRichText`, which would
re-impose the brand fonts/colors BeStudios deliberately avoids.

**Editor-side link color (#98):** add `.tiptap a { … }` styling in `RichEditor.vue`
so a set link is visible while editing.

## Goals

- Let each `<CpRichEditor>` usage declare exactly which controls it exposes.
- Keep the common cases short; make the picky-client case possible without a fork.
- Reduce footguns: a control that is not exposed should not be injectable via
  paste/drop either.
- No regression for the live consumers (`argyle-village-v2`, `infinity-graphics`)
  that cannot be tested from this box.

## Design

### Base + opt-in layers

An always-on **base** plus opt-in feature layers, chosen with a `features` array.

```vue
<!-- base only: bold, italic, link -->
<CpRichEditor v-model="body" />

<!-- base + justification + block structure -->
<CpRichEditor v-model="body" :features="['layout', 'blocks']" />

<!-- base + image + code -->
<CpRichEditor v-model="body" :features="['image', 'markup']" />
```

| Layer            | Always on? | Toolbar buttons                                   | TipTap extension(s) enabled                       | New dep |
|------------------|-----------|----------------------------------------------------|---------------------------------------------------|---------|
| **base**         | yes       | bold, italic, link (+ undo/redo, clear-formatting) | Bold, Italic, Link                                | —       |
| **`decoration`** | opt-in    | underline, strikethrough (future: highlight)       | Underline, Strike (both from StarterKit v3)       | —       |
| **`blocks`**     | opt-in    | H1/H2/H3, bullet list, numbered list, blockquote, horizontal rule | Heading, BulletList, OrderedList, ListItem, Blockquote, HorizontalRule | — |
| **`layout`**     | opt-in    | align left / center / right                        | TextAlign                                         | `@tiptap/extension-text-align` |
| **`markup`**     | opt-in    | inline code, code block                            | Code, CodeBlock                                   | —       |
| **`image`**      | opt-in    | image upload button + drag/paste upload            | Image (+ existing upload handlers)                | —       |

Underline and strikethrough are split into their own `decoration` layer (not
`blocks`) because a site may want them in a plain-text-ish space without opening
block structure. The name is honest (both are `text-decoration` values) and scales
to highlight later.

### Subtractive escape hatch: `remove`

For picky clients, a `remove` array subtracts individual controls after the layers
resolve. This is the conventional "presets + override" shape (cf. ESLint `extends`
+ rule overrides); a purely additive per-button `add` was rejected as more verbose
for every normal editor and a second path to the same result (YAGNI).

```vue
<!-- blocks, but this client hates blockquotes and rules -->
<CpRichEditor v-model="body" :features="['blocks']" :remove="['blockquote', 'horizontalRule']" />
```

- **Order of operations:** layers add → `remove` subtracts.
- Removing a control that is not present is a **silent no-op** (no error).
- `remove` may target base controls too (e.g. `remove: ['link']`).

### The footgun invariant

`remove` (and layer selection) operate on **buttons**, but an extension is
registered **iff at least one button that uses it survives** the resolve:

- Drop `image` → no button **and** Image extension off → pasted/dropped images are
  discarded, not silently injected.
- `remove: ['h3']` → H3 button gone, Heading extension stays (H1/H2 still use it).
- `remove: ['h1','h2','h3']` → Heading extension off entirely.

This keeps the toolbar and the content model consistent automatically; no consumer
ever reasons about the extension list, only about buttons.

### Canonical control names

`remove` targets stable, documented identifiers. The vocabulary:

```
bold, italic, underline, strike, link,
h1, h2, h3, bulletList, orderedList, blockquote, horizontalRule,
code, codeBlock, image,
alignLeft, alignCenter, alignRight
```

Documented in the component so nobody guesses. (undo / redo / clear-formatting are
always present and not `remove`-able in v1.)

### Default behavior — DECIDED: minimal base (B)

`<CpRichEditor>` with no props renders **base only** (bold, italic, link). Every
richer control is opt-in. This is the cleanest footgun posture and the intended
end state; the cost is that existing consumers must declare their `:features`
explicitly or their editors lose buttons on next deploy.

Chosen deliberately (2026-09-15): we update the existing sites as part of this
work rather than default to backward-compatibility. See Rollout — every current
`CpRichEditor` usage is audited and given an explicit `:features`/`:remove`
**before** the layer change ships, so no live site silently loses controls.

## Internal structure

A single source-of-truth control registry (id → { label, layer, extension(s),
`isActive` predicate, `run` command }) drives both the enabled extension set and
the rendered toolbar, so the two can never drift. The template maps over the
resolved, ordered control list instead of hardcoding buttons. This also shrinks
the template, which currently hardcodes ~20 buttons inline.

Resolve pipeline (pure, unit-testable, no editor needed):
`features + remove → resolved control ids → { toolbar order, extension set }`.

## Testing

- Unit-test the resolver in isolation: base-only; each layer; layer combos;
  `remove` of a present control; `remove` of an absent control (no-op); `remove`
  that empties an extension (extension dropped) vs. leaves a sibling (extension
  kept); `remove` of a base control.
- Component test: a `:features`/`:remove` combination renders exactly the expected
  buttons, and a paste of a disallowed node (e.g. image when `image` is off) does
  not appear in the emitted HTML.
- Regression: default render (per the pending decision) matches expectation.

## Rollout / blast radius

Per ClaudePress rule, a change to `main` reaches every consuming site on its next
deploy, including `argyle-village-v2` and `infinity-graphics`, which are live and
not on this box. Because the default is now **minimal base (B)**, every existing
consumer must be updated or its editor loses controls. The plan therefore includes
an explicit audit step:

1. Find every `CpRichEditor` / `<cp-rich-editor>` usage across all consuming sites
   (local dev copies here, plus the live-only `argyle-village-v2` and
   `infinity-graphics` — for those, update in their own repos; they cannot be
   tested from this box, so state that at merge time).
2. For each usage, set the `:features`/`:remove` that reproduces its current
   toolbar (or the intended trimmed one, where a site owner has asked — e.g. Be
   Studios #98).
3. Land the consumer updates together with / ahead of the layer change so nothing
   silently regresses.

Be Studios sets its own `:features`/`:remove` to get the trimmed editor #98 asks
for. Finished work goes to the project's "In Testing" bucket, not Done.

## Out of scope

Nothing from #98 is deferred — the toolbar layer system and both render-side fixes
(block-flow spacing + link styling in `CpSafeHtml`, and editor-side link color) are
all in scope. #107 (rendered link styling) is resolved by the same `CpSafeHtml`
flow fix. Be Studios #106/#107/#110/#111 remain their own separate tickets.
