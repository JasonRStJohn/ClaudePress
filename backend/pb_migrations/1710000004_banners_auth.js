/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const auth = '@request.auth.id != ""'
  const banners = app.findCollectionByNameOrId('banners')
  banners.createRule = auth
  banners.updateRule = auth
  banners.deleteRule = auth
  app.save(banners)
}, (app) => {
  try {
    const banners = app.findCollectionByNameOrId('banners')
    banners.createRule = null
    banners.updateRule = null
    banners.deleteRule = null
    app.save(banners)
  } catch (_) { /* already gone */ }
})
