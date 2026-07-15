/// <reference path="../pb_data/types.d.ts" />

// Notify Nuxt to purge ISR cache after content changes.
// Env vars: NUXT_REVALIDATE_URL, NUXT_REVALIDATE_SECRET

function revalidate(e) {
  // Declared inside the handler: PocketBase runs each hook event in an
  // isolated JS context, so module-level vars aren't visible here.
  // '*' means "site-wide" — settings and navigation render into the header/
  // footer on every page (see layouts/default.vue), not just '/', so a
  // change must purge every cached route, not one path.
  const PATHS_FOR = {
    settings:            ['*'],
    navigation:          ['*'],
    pages:               ['/'],
    posts:               ['/blog', '/'],
    post_categories:     ['/blog'],
    documents:           ['/documents'],
    document_categories: ['/documents'],
    banners:             ['/'],
  }

  try {
    const url    = $os.getenv('NUXT_REVALIDATE_URL')
    const secret = $os.getenv('NUXT_REVALIDATE_SECRET')
    const name   = e.record.collectionName
                ?? e.record.collection?.name
                ?? e.record.collection?.().name
    const paths  = PATHS_FOR[name]
    if (url && secret && paths) {
      $http.send({ url, method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, paths }), timeout: 5 })
    }
  } catch (err) {
    console.error('[revalidate] failed:', err)
  }
  e.next()
}

onRecordAfterCreateSuccess(revalidate)
onRecordAfterUpdateSuccess(revalidate)
onRecordAfterDeleteSuccess(revalidate)
