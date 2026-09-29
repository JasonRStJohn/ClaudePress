// Pure helpers for /sitemap.xml and for the routes kept out of search. The
// PocketBase reads live in server/routes/sitemap.xml.ts; nuxt.config.ts and
// CpSeoHead share the noindex list so the header and the canonical never
// disagree about which paths are private.

export interface SitemapEntry {
  path: string
  lastmod?: string
}

export interface SitemapOptions {
  // Where the posts collection is served. '/blog' is the layer's own pages;
  // a site that renames it (BeStudios -> '/journal') sets this. '' = no posts.
  postsPath: string
  // Routes a site owns in its own pages/ dir, not backed by a `pages` record.
  extraPaths: string[]
}

// Layer routes that exist on every site and must never be indexed. /admin is
// a prefix: it covers /admin/** too.
export const noindexPaths = ['/admin', '/login', '/forgot-password', '/reset-password']

export const isNoindexPath = (path: string) =>
  noindexPaths.some(p => path === p || path.startsWith(`${p}/`))

// `home` is the catch-all's name for '/', which is always listed.
const reservedSlugs = new Set(['home'])

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')

// PocketBase dates look like "2026-08-19 00:00:00.000Z"; sitemaps want W3C
// datetime. Keep just the date — it's all Google uses.
const toW3cDate = (d?: string) => {
  if (!d) return undefined
  const parsed = new Date(d.replace(' ', 'T'))
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10)
}

const trimSlash = (p: string) => p.replace(/\/+$/, '')

export function sitemapEntries(
  opts: SitemapOptions,
  pageSlugs: string[],
  posts: { slug: string, published_at?: string }[],
): SitemapEntry[] {
  const entries: SitemapEntry[] = [{ path: '/' }]
  for (const path of opts.extraPaths) entries.push({ path })
  for (const slug of pageSlugs) {
    if (!slug || reservedSlugs.has(slug)) continue
    entries.push({ path: `/${slug}` })
  }
  const postsPath = trimSlash(opts.postsPath)
  // The posts index is only worth listing once there is something on it.
  if (postsPath && posts.length) {
    entries.push({ path: postsPath })
    for (const post of posts) {
      if (!post.slug) continue
      entries.push({ path: `${postsPath}/${post.slug}`, lastmod: toW3cDate(post.published_at) })
    }
  }
  // List each URL once, and never a private one (a site's extraPaths or a
  // page slug could collide with either).
  const seen = new Set<string>()
  return entries.filter(e => !isNoindexPath(e.path) && !seen.has(e.path) && seen.add(e.path))
}

export function renderSitemap(origin: string, entries: SitemapEntry[]): string {
  const base = trimSlash(origin)
  const urls = entries.map((e) => {
    const lastmod = e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''
    return `  <url><loc>${escapeXml(base + e.path)}</loc>${lastmod}</url>`
  })
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}
