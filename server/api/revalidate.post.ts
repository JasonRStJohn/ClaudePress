/**
 * ISR revalidate webhook.
 *
 * Called by a PocketBase hook (pb_hooks/revalidate.pb.js) after any content
 * record is created/updated/deleted. Nuxt Nitro drops the matching ISR cache
 * entries so the next request re-renders fresh.
 *
 * Expected payload: { secret: string, paths: string[] }
 * The secret must match runtimeConfig.revalidateSecret.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ secret?: string; paths?: string[] }>(event)
  const config = useRuntimeConfig()

  if (!config.revalidateSecret) {
    throw createError({ statusCode: 500, statusMessage: 'REVALIDATE_SECRET not configured' })
  }
  if (!body?.secret || body.secret !== config.revalidateSecret) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const paths = Array.isArray(body.paths) ? body.paths : []
  if (paths.length === 0) {
    return { ok: true, revalidated: 0 }
  }

  // Nitro exposes a per-route cache that we purge by calling the route with
  // the `x-nitro-prerender` header, but the supported API is simpler:
  // delete the cached entries directly from storage.
  const storage = useStorage('cache')
  const keys = await storage.getKeys(`nitro:functions`)

  // '*' means site-wide content changed (settings, navigation render into
  // every page's header/footer) — purge every cached route, not one path.
  if (paths.includes('*')) {
    for (const key of keys) {
      await storage.removeItem(key)
    }
    return { ok: true, revalidated: keys.length, paths: ['*'] }
  }

  let count = 0
  for (const path of paths) {
    // ISR cache keys look like: nitro:functions:_nitro_isr:<path>.json
    // We use a broad prefix match to be safe across nitro versions.
    for (const key of keys) {
      if (key.includes(path)) {
        await storage.removeItem(key)
        count++
      }
    }
  }

  return { ok: true, revalidated: count, paths }
})
