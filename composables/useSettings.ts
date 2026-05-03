/**
 * Fetch the site settings singleton. Cached per request via useState so
 * multiple components on a page share one fetch.
 */
export const useSettings = async () => {
  const state = useState<any | null>('cp:settings', () => null)
  if (state.value) return state.value

  const pb = usePb()
  try {
    const list = await pb.collection('settings').getList(1, 1)
    state.value = list.items[0] || null
  } catch (e) {
    console.error('[ClaudePress] failed to load settings', e)
    state.value = null
  }
  return state.value
}
