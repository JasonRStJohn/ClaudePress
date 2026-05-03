/// <reference path="../pb_data/types.d.ts" />

// Media collection for editor image uploads.
// Auth users can upload; public can read (images appear in published pages/posts).

migrate((app) => {
  app.save(new Collection({
    type: 'base',
    name: 'media',
    fields: [
      {
        type: 'file',
        name: 'file',
        required: true,
        maxSelect: 1,
        mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'],
      },
      { type: 'text', name: 'alt' },
    ],
    listRule: '',
    viewRule: '',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""',
  }))
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId('media')
    if (col) app.delete(col)
  } catch (_) {}
})
