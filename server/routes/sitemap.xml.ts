import PocketBase from 'pocketbase'
import { renderSitemap, sitemapEntries, type SitemapOptions } from '../../utils/sitemap'

/**
 * /sitemap.xml, built from PocketBase at request time so new posts and pages
 * appear without a rebuild. Cached via the routeRules entry in nuxt.config.ts.
 *
 * What goes in: '/', runtimeConfig.sitemap.extraPaths, published `pages`
 * (served by the catch-all) and published `posts` under
 * runtimeConfig.sitemap.postsPath. The collections' list rules already
 * restrict to published = true; the filter repeats it so the sitemap stays
 * correct if a rule is ever loosened.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const pb = new PocketBase(config.pbUrl as string)
  const opts = config.sitemap as SitemapOptions

  // Absolute URLs are required. NUXT_PUBLIC_SITE_URL is the canonical origin;
  // fall back to the request origin so a missing env still yields a sitemap.
  const origin = (config.public.siteUrl as string) || getRequestURL(event).origin

  const [pages, posts] = await Promise.all([
    pb.collection('pages').getFullList({ filter: 'published = true', fields: 'slug' }),
    opts.postsPath
      ? pb.collection('posts').getFullList({
          filter: 'published = true',
          sort: '-published_at',
          fields: 'slug,published_at',
        })
      : [],
  ])

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return renderSitemap(
    origin,
    sitemapEntries(
      opts,
      pages.map(p => p.slug as string),
      posts.map(p => ({ slug: p.slug as string, published_at: p.published_at as string })),
    ),
  )
})
