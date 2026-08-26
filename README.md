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
is an env change + container recreate — no rebuild.

**Forgot-password needs three per-site setup steps** (change-password does not):

0. **Set `NUXT_PUBLIC_PASSWORD_RESET_ENABLED=true`** for the site (its `.env` /
   compose `environment:`), once the two steps below are done.

1. **Configure SMTP** in the site's PocketBase settings
   (*Settings → Mail settings*), or no reset email is ever sent. Without it,
   the request silently succeeds and nothing arrives.
2. **Point the reset email at our page.** PocketBase's default
   "Password reset" email template links to its own admin UI
   (`{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}`). Edit that template
   (*Settings → Mail settings → Password reset*) so the link target is:

   ```
   {APP_URL}/reset-password?token={TOKEN}
   ```

   `{APP_URL}` must be the site's **public** URL (the one the browser uses),
   set in *Settings → Application → Application URL* — not the internal Docker
   URL. Otherwise the emailed link won't resolve for the recipient.

As of this writing only whindancer has SMTP configured, so it is the reference
end-to-end test for the email path; other sites get working change-password
immediately and working reset once their SMTP is set up.

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
