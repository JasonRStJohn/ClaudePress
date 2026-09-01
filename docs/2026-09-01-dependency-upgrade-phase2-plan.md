# Dependency Upgrade — Phase 1 record & Phase 2 plan

**Date:** 2026-09-01
**Context:** Freshening ClaudePress deps ahead of a possible sale. Priority the
owner set: **clean `npm audit` + stability** over "newest possible stack." A buyer
runs `npm audit` and a build first; zero CVEs on a green build is the strongest
signal, and "modern but not bleeding-edge" is acceptable.

**Load-bearing constraint (why this is split into phases):** a change to
ClaudePress `main` reaches **every consuming site on its next deploy** — including
`whindancer`, `argyle-village-v2`, and `infinity-graphics`, which are **live and
not on this machine**, so they cannot be tested locally before they pull. Sites
consume the layer as *source* (`extends: ['../ClaudePress']`) and each resolves
its **own** dependency tree; they do not inherit ClaudePress's lockfile. That means
ClaudePress's build-tooling CVEs are ClaudePress's own, with near-zero runtime
blast radius on consumers — which is what made Phase 1 safe to land directly.

---

## Phase 1 — DONE (landed on the working branch, safe to ship to `main`)

**What was done:**
- `npm audit fix` (no `--force`) + `npm update` (in-range minors only).
- Result: **23 vulnerabilities → 3.** Cleared all 4 critical and 9 of 12 high.
  The critical was `tar` (file-smuggling + DoS chain); highs were `vite`, `ws`,
  `svgo`.
- In-range bumps picked up: tiptap 3.22→3.30, vue 3.5.32→3.5.42,
  pocketbase 0.26.8→0.26.9, nuxt 3.21.2→3.21.11, vite/ws/tar/svgo transitives.
- **Only `package-lock.json` changed** — `package.json` ranges untouched, so no
  consuming site's resolved layer behavior changes.
- **Verified:** 13/13 vitest pass; `nuxi build` green. Only remaining build warning
  is the pre-existing `sharp` native-binary notice (unrelated, present at baseline).

**Trivial in-range bump still available:** tiptap 3.31.0 shipped after this pass
(we're at 3.30.6, within `^3.0.0`). Optional — sweep into Phase 1 or leave it.

**The 3 remaining highs, deliberately deferred:** all one chain —
`sharp <0.35` → `ipx` → `@nuxt/image <=2.0` (libvips CVEs). The only fix is
`@nuxt/image` **2.0**, a breaking major. It belongs in Phase 2, not forced here.

---

## Phase 2 — the "full swing," isolated (planned, not started)

**Goal:** take the majors — but do it where breakage is reversible and never risks
a live site. Owner's framing: fork it (working name "ClaudePressToo" — *probably
not the real name*), repoint inheritance, and if something breaks, change it back.

**The majors in scope:**

| Package | From | To | Risk | Notes |
|---|---|---|---|---|
| tailwindcss | 3.4 | 4.3.3 | **Highest** | Not just a bump — an **integration swap + config rewrite**. See row below. |
| Tailwind Nuxt integration | `@nuxtjs/tailwindcss` 6.14 (v3-era) | **`@tailwindcss/vite` 4.3.3** | **Highest** | `@nuxtjs/tailwindcss` has **no stable Tailwind-4 line** (latest stable is still v3). Tailwind 4 on Nuxt means *removing* the module and adopting the `@tailwindcss/vite` plugin, **plus** the CSS-first `@theme` rewrite. Touches every consumer's styling; each has its own config/theme. |
| nuxt | 3.21 | 4.x | High | Dir-structure + compat-flag changes; ripples to all 7 consumers. |
| @nuxt/image | 1.x | 2.x | Med | Clears the last 3 CVEs (sharp/ipx/libvips). |
| vue-router | 4 | 5 | Med | Usually transitive via Nuxt; watch custom routing. |
| typescript | 5 | 7 | Low–Med | Stricter checks may surface latent type errors. |
| pocketbase (JS **SDK**, npm) | 0.26 | 0.28 | Med | 0.x — minor bumps can break; check auth/list APIs. 0.28 **is** the latest SDK on npm. |
| PocketBase **server** (Go binary, `backend/Dockerfile` `PB_VERSION`) | 0.36.8 | **0.40.1** | **High** | Crosses 4 PB minors. PB routinely breaks the JSVM **migrations/hooks API** between 0.x minors — re-verify every file in `backend/pb_migrations/` and `backend/pb_hooks/` boots clean. See existing `PocketBase-v0.36-Notes.md`. |

**Recommended mechanism — a branch/worktree spike, not a second product yet.**
- `extends` is a filesystem path, so a *separate directory* is the only way to run
  two layer versions **simultaneously** and A/B several sites at once. But a whole
  parallel copy means two layers **drifting apart** — a real maintenance cost.
- Cheaper for a first proof: a `feat/nuxt4-tailwind4` **branch** of ClaudePress in
  a git worktree, with **one local dev consuming site** pointed at it. Prove
  Nuxt 4 + Tailwind 4 there first.
- **Only promote to a named fork/product if** it proves out *and* there's a reason
  to keep both alive. Otherwise the branch simply becomes the new `main`. Don't
  commit to maintaining two layers before the swing actually passes on a real site.

**Reversibility, precisely:**
- For **local dev copies**: repointing `extends` back is instant and clean.
- For **live sites**: reversibility is automatic *because we never repoint them*
  until proven. They keep pulling old `main` from GitHub. Repointing a live site is
  a separate, deliberate, per-site decision made only after local proof.

**Suggested Phase 2 order (each gated on green build + tests on a real consumer):**
1. `@nuxt/image` 1→2 in isolation — clears the last 3 CVEs, smallest of the majors.
2. Nuxt 3→4 with compat flags; walk the dir-structure / config changes.
3. Tailwind 3→4 last — the riskiest. It is a **package swap**
   (`@nuxtjs/tailwindcss` → `@tailwindcss/vite`) **plus** the CSS-first `@theme`
   config rewrite, and it forces per-site config work on every consumer. Do it when
   everything else is stable so failures are unambiguous.
4. TypeScript 7 + vue-router 5 fall out mostly transitively; fix type fallout.
5. **PocketBase server 0.36.8 → 0.40.1** (bump `PB_VERSION` in `backend/Dockerfile`)
   — do this *paired with* the SDK 0.26→0.28 bump and gate it hard: bring the
   backend up on a scratch data dir and confirm **every** migration in
   `backend/pb_migrations/` and **every** hook in `backend/pb_hooks/` boots without
   error before running any consuming site against it. This is backend, not
   frontend, so it can be spiked independently of the Nuxt/Tailwind track.

**Definition of done for Phase 2:** Nuxt 4 + Tailwind 4 build green and pass tests
on at least one real consuming site locally, `npm audit` at **0**, and a written
per-site migration note before any live site is repointed.

---

## What ships for the sale *now*

Phase 1 alone already delivers the owner's stated priority: **0 critical, green
build, deterministic lockfile, 7 sites in production on the layer.** Phase 2 is
upside (newest stack, no migration debt for a buyer) but is explicitly **not** on
the sale-critical path and must not destabilize it.
