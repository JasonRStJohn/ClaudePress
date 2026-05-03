/**
 * Paginated post listing with optional category filter.
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

  try {
    return await pb.collection('posts').getList(page, perPage, {
      sort: '-published_at',
      expand: 'category',
      filter,
    })
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
