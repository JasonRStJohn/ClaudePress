/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  app.save(new Collection({
    type: 'base',
    name: 'banners',
    fields: [
      { type: 'text',   name: 'content',    required: true },
      { type: 'text',   name: 'color' },
      { type: 'text',   name: 'text_color' },
      { type: 'date',   name: 'start_date' },
      { type: 'date',   name: 'end_date' },
      { type: 'bool',   name: 'active' },
      { type: 'number', name: 'sort_order' },
    ],
    listRule: '',
    viewRule: '',
    createRule: null,
    updateRule: null,
    deleteRule: null,
    indexes: ['CREATE INDEX idx_banners_sort ON banners (sort_order)'],
  }))
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId('banners')
    if (col) app.delete(col)
  } catch (_) { /* already gone */ }
})
