import PocketBase from 'pocketbase'

/**
 * SSR-aware PocketBase client.
 *
 * On the server: uses runtimeConfig.pbUrl (e.g. http://backend:8090 inside Docker)
 * On the client: uses runtimeConfig.public.pbUrl (e.g. https://cms.example.com)
 *
 * This fixes the two-URL problem identified in the Argyle build.
 */

// Per-request server instances so auth state never leaks between requests.
// Single shared instance on the client for efficiency.
let _clientPb: PocketBase | null = null

export const usePb = (): PocketBase => {
  const config = useRuntimeConfig()

  if (import.meta.server) {
    // Fresh instance per request on the server.
    return new PocketBase(config.pbUrl as string)
  }

  if (!_clientPb) {
    _clientPb = new PocketBase(config.public.pbUrl as string)
  }
  return _clientPb
}

/**
 * Public URL for PocketBase (client-visible). Use this when building file URLs
 * that will be rendered in markup — those URLs must resolve in the browser.
 */
export const usePbPublicUrl = (): string => {
  const config = useRuntimeConfig()
  return config.public.pbUrl as string
}
