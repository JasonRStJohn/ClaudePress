// ClaudePress base layer config.
// Sites extending this layer inherit pages, composables, components, and runtime config.
// Override anything by declaring it in the consuming site's nuxt.config.ts.

import { noindexPaths } from './utils/sitemap'

// Private layer routes answer with a noindex header rather than a robots.txt
// Disallow: a disallowed URL is never fetched, so its noindex is never seen,
// and robots.txt would publish the admin paths. '/x/**' also matches bare '/x'.
const noindexHeader = { headers: { 'x-robots-tag': 'noindex, nofollow' } }
const noindexRules = Object.fromEntries(noindexPaths.map(p => [`${p}/**`, noindexHeader]))

export default defineNuxtConfig({
  ssr: true,

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/image',
  ],

  runtimeConfig: {
    // Server-side only. Used for server-rendered fetches from inside Docker.
    // e.g. http://backend:8090 on the compose network.
    pbUrl: process.env.POCKETBASE_URL || 'http://backend:8090',

    // Secret used by the ISR revalidate webhook (PocketBase hook -> Nuxt).
    revalidateSecret: process.env.REVALIDATE_SECRET || '',

    // /sitemap.xml inputs (server/routes/sitemap.xml.ts). postsPath is where
    // posts are served ('' = none); extraPaths are routes the site owns in
    // its own pages/ dir. Sites override in their own runtimeConfig.
    sitemap: {
      postsPath: '/blog',
      extraPaths: [] as string[],
    },

    public: {
      // Public URL the browser uses to reach PocketBase directly
      // (file downloads, realtime, client-side fetches).
      pbUrl: process.env.NUXT_PUBLIC_PB_URL || 'http://localhost:8090',

      siteName: process.env.NUXT_PUBLIC_SITE_NAME || 'ClaudePress Site',

      // Canonical public origin (scheme + host, no trailing slash), e.g.
      // https://example.com. Consuming sites set NUXT_PUBLIC_SITE_URL. Used to
      // make og:image / og:url absolute — social scrapers fetch from their own
      // servers, so relative URLs don't resolve. Empty → CpSeoHead emits
      // og:image only when it's already absolute (a PocketBase file URL) and
      // skips og:url.
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || '',

      // Whether the self-service password-reset flow (forgot / reset pages and
      // the "Forgot password?" link) is offered. Off by default: the flow only
      // works once the site has SMTP configured in PocketBase and the reset
      // email template retargeted (see README). A site opts in at runtime by
      // setting NUXT_PUBLIC_PASSWORD_RESET_ENABLED=true — boolean here so Nuxt
      // coerces the env string on override. Change-password is unaffected.
      passwordResetEnabled: process.env.NUXT_PUBLIC_PASSWORD_RESET_ENABLED === 'true',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },

  image: {
    // PocketBase file URLs are served from the same origin as the API.
    domains: [],
  },

  nitro: {
    // Enable ISR for pages extending sites will typically cache.
    // Consuming site can override per-route under `routeRules`.
    routeRules: {
      '/': { isr: 60 },
      '/blog': { isr: 60 },
      '/blog/**': { isr: 300 },
      ...noindexRules,
      // Admin pages are client-only — no SSR needed for auth-gated content.
      // Replaces the generated '/admin/**' entry, so it restates the header.
      '/admin/**': { ssr: false, ...noindexHeader },
      // Rebuilt from PocketBase at most hourly; crawlers fetch it rarely.
      '/sitemap.xml': { isr: 3600 },
    },
  },

  typescript: {
    strict: true,
  },
})
