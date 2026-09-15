# ClaudePress Code Review & Release Roadmap

**Date:** 2026-08-28  
**Scope:** `ClaudePress/` base layer, inheritance model, and consuming site interfaces (`BeStudios`, `infinity`, `whindancer`)  
**Status:** Completed Architectural Review & Proposed Roadmap  

---

## 1. Executive Summary

ClaudePress is a reusable **Nuxt 3 (SSR + ISR) + PocketBase + Tailwind CSS** base layer designed to rapidly deploy self-hosted, content-driven websites. Sites consume the layer via `extends: ['../ClaudePress']`, inheriting composables, components, catch-all routing, auth/password reset flows, and standard CMS collections.

This review evaluates the layer's architectural integrity, identifies concrete technical gaps, and defines a prioritized roadmap for upcoming releases.

---

## 2. Architectural Strengths

- **Low-Overhead Layer Inheritance (`nuxt.config.ts`)**: Consuming sites extend the base layer seamlessly without boilerplate or duplicate config.
- **SSR-Safe Dual-URL Model (`composables/usePb.ts`)**: Instantiates isolated PocketBase instances on the server (using Docker's internal `POCKETBASE_URL`) while sharing a client singleton in the browser (`NUXT_PUBLIC_PB_URL`).
- **Resilient Auth State (`composables/useAuth.ts`)**: Combines in-session `useState` (synchronously visible to client-side middleware) with `useCookie` (persisting state across reloads), avoiding hydration race conditions.
- **Rich Editor Asset Pipeline (`components/Cp/RichEditor.vue`)**: Streamlined Tiptap v3 integration with direct file drag-and-drop / paste uploading into PocketBase's `media` collection, with debounce watchers preventing cursor-position resets.

---

## 3. Detailed Findings & Technical Gaps

### 3.1 Missing Thumbnails on Base Image Fields
* **Files:** `backend/pb_migrations/1710000000_base.js`, `1710000005_settings_og_image.js`
* **Issue:** While layer documentation advises consuming sites to declare `thumbs` on image fields, the base migrations themselves omit `thumbs` on:
  - `settings.logo`
  - `settings.favicon`
  - `settings.og_image`
  - `pages.og_image`
  - `posts.cover`
* **Impact:** PocketBase silently serves raw, unoptimized originals (often multiple megabytes) when components request image assets.
* **Remediation:** Add migration `1710000007_base_thumbs.js` updating these collections with standard thumb sizes (`1600x0`, `900x0`, `600x0`, `300x0`).

---

### 3.2 Incomplete Post ISR Revalidation
* **File:** `backend/pb_hooks/revalidate.pb.js:16`
* **Issue:** When a blog post is created or updated, `revalidate.pb.js` purges only `['/blog', '/']`. It does not purge the specific post route `/blog/[slug]`.
* **Impact:** Because `nuxt.config.ts` caches `/blog/**` with `{ isr: 300 }`, editing a post in `/admin/posts/[id]` leaves the public post page stale for up to 5 minutes.
* **Remediation:** Dynamically resolve the record's slug in `revalidate.pb.js`:
  ```js
  if (name === 'posts') {
    const slug = e.record.get('slug')
    paths = ['/blog', '/', `/blog/${slug}`]
  }
  ```

---

### 3.3 Dangerous Cascade Deletion in Media Cleanup
* **Files:** `pages/admin/pages/[id].vue:169-175`, `pages/admin/posts/[id].vue`
* **Issue:** When deleting a page or post, the admin code executes a regular expression against the HTML body to extract 15-character PocketBase IDs and deletes all matching `media` records.
* **Impact:** If an image is shared across multiple pages or blog posts, deleting one page permanently deletes the media record, breaking image links across the rest of the site.
* **Remediation:** Remove inline regex media deletion on entity delete. Media records should remain in the `media` library and be managed directly via `/admin/media`.

---

### 3.4 404 Route Precedence & Case-Variant Handling
* **Files:** `pages/[...slug].vue:44-46`, `server/plugins/log-not-found.ts`
* **Issue:** In `[...slug].vue`, missing pages call `setResponseStatus(404)` but render an inline template. Casing variants (e.g. `/Our-Girls` when a site has `/pages/our-girls.vue`) fall through to `[...slug].vue` and can result in soft-200 responses on client-side routing.
* **Remediation:** Throw a standard Nuxt error (`createError({ statusCode: 404, statusMessage: 'Page Not Found', fatal: false })`) to ensure uniform 404 status across SSR, client navigation, and Nitro log monitoring.

---

### 3.5 Settings Admin Shadowing Overhead
* **File:** `pages/admin/settings/index.vue`
* **Issue:** Consuming sites requiring additional global settings (e.g. `whindancer`'s `health_database_path_root`) currently have to copy the entire 390-line `index.vue` file.
* **Impact:** Upstream additions (such as the social sharing metadata editor) are not automatically inherited by shadowed sites.
* **Remediation:** Introduce a slot or custom component hook (e.g. `<CpSettingsCustomFields />`) in the settings admin page to isolate site-specific fields.

---

### 3.6 Unimplemented Base Form Engine
* **Files:** `backend/pb_migrations/1710000000_base.js:129-159`
* **Issue:** The base schema provisions `forms` and `form_submissions` collections, but lacks a public `<CpForm>` component, submission API endpoint, and admin review interface.
* **Impact:** Consuming sites currently bypass the base form schema, relying on `mailto:` links or custom scripts.

---

## 4. Release Roadmap & Implementation Priorities

```
┌─────────────────────────────────────────────────────────────────┐
│                    ClaudePress Release Roadmap                  │
├─────────────────────────────────────────────────────────────────┤
│ Release 0.2: Stability & Cache Hardening (Immediate)           │
│   • Base schema thumbs migration (1710000007_base_thumbs.js)    │
│   • Dynamic post ISR revalidation in PB hook                    │
│   • Lockfile synchronization & automated unit test suite       │
├─────────────────────────────────────────────────────────────────┤
│ Release 0.3: Extensible Admin Architecture                     │
│   • Modular settings fields via slots / dynamic schema          │
│   • Safe media management (remove regex auto-delete)            │
│   • Standardized 404 error throwing                             │
├─────────────────────────────────────────────────────────────────┤
│ Release 0.4: Form Engine & Interactive Components               │
│   • Public <CpForm> JSON-schema renderer                        │
│   • Admin submission viewer & email notification webhook        │
│   • Shared <CpFocalPicker> and gallery lightbox components      │
└─────────────────────────────────────────────────────────────────┘
```

---

### Release 0.2: Stability & Cache Hardening *(Target: Next Sprint)*
1. **Base Thumbs Migration (`1710000007_base_thumbs.js`)**: Add explicit thumb definitions (`1600x0`, `900x0`, `600x0`, `300x0`) to all base image fields.
2. **Dynamic Post Revalidation (`pb_hooks/revalidate.pb.js`)**: Purge individual post paths (`/blog/${slug}`) on post updates.
3. **Lockfile Alignment & CI Tests**:
   - Re-sync `package-lock.json` with `package.json` to enable deterministic `npm ci` in Docker builds.
   - Expand Vitest suite covering `usePb`, `useAuth`, `usePage`, and `server/api/revalidate.post.ts`.

---

### Release 0.3: Admin Extensibility *(Target: Phase 2 Completion)*
1. **Modular Settings Hook**: Allow consuming sites to mount custom settings fields inside `/admin/settings` without replacing the whole view.
2. **Media Safety Refactor**: Remove regex media deletion on entity deletion; introduce unreferenced media filters in `/admin/media`.
3. **Unified 404 Propagation**: Standardize `createError` usage in `[...slug].vue` to fix soft-200 case-variant edge cases.

---

### Release 0.4: Form Engine & Upstream Components *(Target: Phase 3)*
1. **`<CpForm>` Component**: Dynamic Vue component rendering and validating against `forms.schema` JSON, posting to `/api/forms/submit`.
2. **Admin Submissions Dashboard**: Add `/admin/forms` and `/admin/submissions` with CSV export and email alerting.
3. **Component Promotion**: Upstream proven patterns from consuming sites into the layer:
   - `<CpFocalPicker>` (from `BeStudios`)
   - `<CpGallery>` and `<CpLightbox>` (from `whindancer`)
   - `<CpWorkCarousel>` (from `infinity`)
