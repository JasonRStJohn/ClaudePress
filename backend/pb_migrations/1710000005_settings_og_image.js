/// <reference path="../pb_data/types.d.ts" />

// ClaudePress base layer — add `og_image` to the settings singleton.
//
// The social share card (og:image / twitter:image). CpSeoHead resolves the
// share image in this order: an explicit per-page image -> this settings
// field -> the consuming site's bundled /og.png -> none. Client-editable so a
// site owner can swap the card from the admin without a deploy.

migrate((app) => {
  const settings = app.findCollectionByNameOrId('settings')
  settings.fields.add(new Field({
    type: 'file',
    name: 'og_image',
    maxSelect: 1,
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  }))
  app.save(settings)
}, (app) => {
  const settings = app.findCollectionByNameOrId('settings')
  settings.fields.removeByName('og_image')
  app.save(settings)
})
