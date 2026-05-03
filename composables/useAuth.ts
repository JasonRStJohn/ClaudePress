import type { RecordModel } from 'pocketbase'

/**
 * Auth composable for ClaudePress admin.
 *
 * Uses useState as the in-session source of truth so auth state is
 * immediately visible to middleware on client-side navigation (useCookie
 * can return stale values across navigations in the same Nuxt session).
 *
 * Cookies are still written on login/logout so auth survives page reloads.
 * On first call after a reload, the cookie values are used to re-hydrate
 * the useState refs.
 *
 * Always use the pb instance returned here in admin pages — it is hydrated
 * with the current auth token. usePb() returns a fresh unauthenticated
 * instance per server request.
 */
export const useAuth = () => {
  const pb = usePb()

  // useState is shared across all composable calls within the same app
  // session and is updated synchronously — middleware sees it immediately.
  const authToken = useState<string>('cp:auth:token', () => '')
  const currentUser = useState<RecordModel | null>('cp:auth:user', () => null)

  // Cookies persist auth across page reloads.
  const tokenCookie = useCookie<string>('pb_token', {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  })
  const modelCookie = useCookie<RecordModel | null>('pb_model', {
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  })

  // On first call after a page load, useState is empty — hydrate from cookies.
  if (!authToken.value && tokenCookie.value && modelCookie.value) {
    authToken.value = tokenCookie.value
    currentUser.value = modelCookie.value
  }

  // Keep pb.authStore in sync with whatever auth state we have.
  if (authToken.value && currentUser.value) {
    pb.authStore.save(authToken.value, currentUser.value)
  }

  const isAuthenticated = computed<boolean>(
    () => !!(authToken.value && currentUser.value),
  )

  const login = async (email: string, password: string): Promise<void> => {
    const authData = await pb.collection('users').authWithPassword(email, password)
    const token = pb.authStore.token
    const record = authData.record as RecordModel
    // Update in-session state first (middleware reads this).
    authToken.value = token
    currentUser.value = record
    // Then persist to cookies for reload survival.
    tokenCookie.value = token
    modelCookie.value = record
  }

  const logout = (): void => {
    pb.authStore.clear()
    authToken.value = ''
    currentUser.value = null
    tokenCookie.value = ''
    modelCookie.value = null
  }

  return {
    pb,
    currentUser,
    isAuthenticated,
    login,
    logout,
  }
}
