export interface NavItem {
  id: string
  label: string
  href: string
  external: boolean
  sort_order: number
  parent_id: string
  children: NavItem[]
}

/**
 * Load the navigation collection and build a parent/child tree.
 * Cached per request via useState.
 */
export const useNav = async (): Promise<NavItem[]> => {
  const state = useState<NavItem[] | null>('cp:nav', () => null)
  if (state.value) return state.value

  const pb = usePb()
  try {
    const list = await pb.collection('navigation').getList(1, 200, {
      sort: 'sort_order,label',
    })

    const byId = new Map<string, NavItem>()
    for (const r of list.items) {
      byId.set(r.id, {
        id: r.id,
        label: r.label,
        href: r.href,
        external: !!r.external,
        sort_order: r.sort_order || 0,
        parent_id: r.parent_id || '',
        children: [],
      })
    }

    const roots: NavItem[] = []
    for (const item of byId.values()) {
      if (item.parent_id && byId.has(item.parent_id)) {
        byId.get(item.parent_id)!.children.push(item)
      } else {
        roots.push(item)
      }
    }
    state.value = roots
  } catch (e) {
    console.error('[ClaudePress] failed to load navigation', e)
    state.value = []
  }
  return state.value!
}
