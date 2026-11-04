/**
 * Paginated post listing with optional category filter. Pinned posts
 * ("Pin to top") come first, then newest first.
 */
export const usePosts = async (opts: {
  page?: number
  perPage?: number
  category?: string // category slug
} = {}) => {
  const pb = usePb()
  const page = opts.page ?? 1
  const perPage = opts.perPage ?? 12

  let filter = ''
  if (opts.category) {
    filter = `category.slug = "${opts.category}"`
  }

  const list = (sort: string) =>
    pb.collection('posts').getList(page, perPage, { sort, expand: 'category', filter })

  try {
    try {
      return await list('-pinned,-published_at')
    } catch (e: any) {
      // A backend that hasn't run 1710000007_posts_pinned yet (frontend
      // deployed ahead of it) rejects the unknown sort field with a 400.
      // Fall back to date order rather than rendering no posts at all.
      if (e?.status !== 400) throw e
      return await list('-published_at')
    }
  } catch (e) {
    console.error('[ClaudePress] failed to load posts', e)
    return { page: 1, perPage, totalItems: 0, totalPages: 0, items: [] }
  }
}

export const usePost = async (slug: string) => {
  const pb = usePb()
  try {
    return await pb.collection('posts').getFirstListItem(`slug = "${slug}"`, {
      expand: 'category',
    })
  } catch (e: any) {
    if (e?.status === 404) return null
    console.error('[ClaudePress] failed to load post', slug, e)
    return null
  }
}
