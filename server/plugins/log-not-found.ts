/**
 * Logs unmatched 404s as structured JSON on stdout.
 *
 * After a site migration you never get the full redirect map up front — Search
 * Console's 404 report fills in over weeks and always misses some. This is the
 * backstop: what real visitors and crawlers actually asked for and didn't get.
 *
 * Read it with:
 *   docker compose logs frontend \
 *     | grep '"tag":"not-found"' | jq -r .path | sort | uniq -c | sort -rn
 *
 * Container logs are ephemeral across `docker compose down` — mine the log
 * before recreating the stack.
 *
 * Storage is stdout on purpose: no migration, no admin page, and no database
 * write on traffic that is overwhelmingly bots.
 *
 * The query string is deliberately dropped before logging. `event.path`
 * includes it, and a 404 URL can carry arbitrary visitor-supplied params
 * (`?token=`, `?email=`) that have no business sitting in container logs.
 */
import { getRequestHeader } from 'h3'

// Bot and asset noise. Without this the signal drowns — a public site takes
// constant /wp-login.php and /xmlrpc.php probes.
const SKIP = [
  /^\/_nuxt\//,
  /^\/__nuxt/,
  /^\/api\//,
  /^\/\.well-known\//,
  /^\/wp-/,
  /^\/xmlrpc/,
  /\.php$/,
  /\.(ico|png|jpe?g|gif|svg|webp|css|js|map|woff2?|ttf|eot|txt|xml|json)$/i,
]

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:response', (response, { event }) => {
    if (response.statusCode !== 404) return

    const path = (event.path || '').split('?')[0]
    if (SKIP.some((re) => re.test(path))) return

    console.warn(JSON.stringify({
      tag: 'not-found',
      path,
      referer: getRequestHeader(event, 'referer') ?? null,
      ua: getRequestHeader(event, 'user-agent') ?? null,
      at: new Date().toISOString(),
    }))
  })
})
