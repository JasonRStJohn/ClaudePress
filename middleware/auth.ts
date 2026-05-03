/**
 * Named auth middleware. Apply to admin pages with:
 *   definePageMeta({ middleware: 'auth' })
 *
 * Redirects unauthenticated users to /login.
 */
export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
