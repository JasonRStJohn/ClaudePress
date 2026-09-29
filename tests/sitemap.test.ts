import { describe, it, expect } from 'vitest'
import { isNoindexPath, renderSitemap, sitemapEntries } from '../utils/sitemap'

const blog = { postsPath: '/blog', extraPaths: [] }

describe('sitemapEntries', () => {
  it('lists home, published pages and posts under the layer default /blog', () => {
    const paths = sitemapEntries(blog, ['about'], [{ slug: 'hello' }]).map(e => e.path)
    expect(paths).toEqual(['/', '/about', '/blog', '/blog/hello'])
  })

  it('serves posts under a renamed path and adds site-owned routes', () => {
    const opts = { postsPath: '/journal/', extraPaths: ['/points-calculator'] }
    const paths = sitemapEntries(opts, [], [{ slug: 'a' }]).map(e => e.path)
    expect(paths).toEqual(['/', '/points-calculator', '/journal', '/journal/a'])
  })

  it('leaves out the posts index when there are no posts', () => {
    expect(sitemapEntries(blog, [], []).map(e => e.path)).toEqual(['/'])
  })

  it('skips posts entirely when postsPath is empty', () => {
    const paths = sitemapEntries({ postsPath: '', extraPaths: [] }, [], [{ slug: 'a' }])
    expect(paths.map(e => e.path)).toEqual(['/'])
  })

  it('drops the home slug, duplicates and private routes', () => {
    const opts = { postsPath: '', extraPaths: ['/about', '/admin/pages'] }
    const paths = sitemapEntries(opts, ['home', 'about', 'login'], []).map(e => e.path)
    expect(paths).toEqual(['/', '/about'])
  })

  it('turns a PocketBase published_at into a W3C date, or omits it', () => {
    const entries = sitemapEntries(blog, [], [
      { slug: 'a', published_at: '2026-08-19 00:00:00.000Z' },
      { slug: 'b' },
      { slug: 'c', published_at: 'nope' },
    ])
    expect(entries.slice(-3).map(e => e.lastmod)).toEqual(['2026-08-19', undefined, undefined])
  })
})

describe('isNoindexPath', () => {
  it('matches private routes and their children only', () => {
    expect(isNoindexPath('/admin')).toBe(true)
    expect(isNoindexPath('/admin/posts/new')).toBe(true)
    expect(isNoindexPath('/login')).toBe(true)
    expect(isNoindexPath('/administrator')).toBe(false)
    expect(isNoindexPath('/blog/login-tips')).toBe(false)
  })
})

describe('renderSitemap', () => {
  it('emits absolute, escaped locs against the origin', () => {
    const xml = renderSitemap('https://example.com/', [
      { path: '/' },
      { path: '/blog/a&b', lastmod: '2026-08-19' },
    ])
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain('<loc>https://example.com/</loc>')
    expect(xml).toContain('<loc>https://example.com/blog/a&amp;b</loc><lastmod>2026-08-19</lastmod>')
  })
})
