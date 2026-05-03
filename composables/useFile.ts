/**
 * Build a browser-safe URL for a PocketBase file field.
 * Handles both single-file (string) and multi-file (array) shapes.
 *
 * Usage:
 *   const url = useFile(post, 'cover')
 *   const url = useFile(post, 'cover', { thumb: '400x0' })
 */
export const useFile = (
  record: { id: string; collectionId?: string; collectionName?: string } & Record<string, any>,
  field: string,
  opts: { thumb?: string } = {},
): string | null => {
  if (!record) return null
  const raw = record[field]
  if (!raw) return null
  const filename = Array.isArray(raw) ? raw[0] : raw
  if (!filename) return null

  const base = usePbPublicUrl()
  const collection = record.collectionName || record.collectionId
  if (!collection) return null

  const qs = opts.thumb ? `?thumb=${encodeURIComponent(opts.thumb)}` : ''
  return `${base}/api/files/${collection}/${record.id}/${encodeURIComponent(filename)}${qs}`
}
