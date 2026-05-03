/**
 * Fetch a single page by slug. Returns null if not found or not published.
 * The `pages` collection list/view rules enforce published = true.
 */
export const usePage = async (slug: string) => {
  const pb = usePb()
  try {
    return await pb.collection('pages').getFirstListItem(`slug = "${slug}"`)
  } catch (e: any) {
    if (e?.status === 404) return null
    console.error('[ClaudePress] failed to load page', slug, e)
    return null
  }
}
