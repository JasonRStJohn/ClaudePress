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

## Account & password management

The layer ships self-service password flows on top of PocketBase's `users`
auth collection. All of it is inherited — consuming sites get it with no code:

- **Change password** — `/admin/account` (authed). Requires the current
  password. PocketBase invalidates all tokens on a password change, so
  `useAuth().changePassword()` silently re-authenticates afterward; the user
  stays signed in. Needs no configuration.
- **Forgot / reset password** — `/forgot-password` sends a reset email via
  PocketBase's `requestPasswordReset`; `/reset-password?token=…` is our own
  branded confirm page that calls `confirmPasswordReset`. The forgot page
  always shows the same "check your email" message so it can't be used to probe
  which addresses have accounts.

The forgot/reset flow is **off by default** and gated on a per-site flag,
`NUXT_PUBLIC_PASSWORD_RESET_ENABLED`. While it's off, the "Forgot password?"
link is hidden and `/forgot-password` redirects to `/login`, so a site never
advertises a flow it can't complete. The flag is read at runtime, so flipping it
is an env change + frontend recreate — no rebuild.

### Enabling forgot-password on a site

Run the setup script once per site — it does the PocketBase-side wiring for you
and is safe to re-run:

```bash
node scripts/setup-password-reset.mjs      # or: npm run setup:password-reset
```

It authenticates to the site's PocketBase as a superuser (over `/api`, so it
works even with the `/_/` admin UI behind Cloudflare Access) and:

1. **Retargets the reset email.** PocketBase's default template links to its own
   admin UI (`{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}`). The script
   rewrites the `users` collection's `resetPasswordTemplate` link to the site's
   **frontend** page — `https://your-site/reset-password?token={TOKEN}`. It must
   be the frontend origin, not `{APP_URL}` (PocketBase's own URL): the page is a
   Nuxt route, and keeping the link off `/_/` is what lets you gate the admin UI
   with Cloudflare Access without breaking reset.
2. **Optionally configures SMTP** (host/port/credentials/sender). Without SMTP no
   reset email is ever sent — the request just silently succeeds.
3. **Sends a test email** so you can confirm delivery before trusting it.
4. **Optionally sets `NUXT_PUBLIC_PASSWORD_RESET_ENABLED=true`** in a `.env` you
   point it at. Redeploy/recreate the **frontend** afterward for the flag to
   take effect (it lives in the Nuxt runtime, not PocketBase).

**Cloudflare Access note:** if you gate the PocketBase admin, scope the policy to
`/_/*` only — never the whole host. The reset flow (and the entire public site)
calls PocketBase under `/api/*`; gating that blackholes everything.

Change-password needs none of this — it works out of the box for any authed user.

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
