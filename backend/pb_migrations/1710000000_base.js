/// <reference path="../pb_data/types.d.ts" />

// ClaudePress base migration — PocketBase v0.23+
// All field properties are flat (no options nesting).
// Explicit IDs on collections used as relation targets.

migrate((app) => {

  // ── settings (singleton) ──────────────────────────────────────────────
  app.save(new Collection({
    type: 'base',
    name: 'settings',
    fields: [
      { type: 'text',   name: 'site_name' },
      { type: 'text',   name: 'tagline' },
      { type: 'file',   name: 'logo',    maxSelect: 1, mimeTypes: ['image/png','image/jpeg','image/svg+xml','image/webp'] },
      { type: 'file',   name: 'favicon', maxSelect: 1, mimeTypes: ['image/png','image/x-icon','image/svg+xml'] },
      { type: 'text',   name: 'contact_email' },
      { type: 'text',   name: 'contact_phone' },
      { type: 'text',   name: 'address' },
      { type: 'json',   name: 'socials' },
      { type: 'editor', name: 'footer_text' },
    ],
    listRule: '', viewRule: '', createRule: null, updateRule: null, deleteRule: null,
  }))

  // ── navigation ────────────────────────────────────────────────────────
  app.save(new Collection({
    type: 'base',
    name: 'navigation',
    fields: [
      { type: 'text',   name: 'label',      required: true },
      { type: 'text',   name: 'href',       required: true },
      { type: 'number', name: 'sort_order' },
      { type: 'text',   name: 'parent_id' },
      { type: 'bool',   name: 'external' },
    ],
    listRule: '', viewRule: '', createRule: null, updateRule: null, deleteRule: null,
    indexes: ['CREATE INDEX idx_nav_sort ON navigation (sort_order)'],
  }))

  // ── pages ─────────────────────────────────────────────────────────────
  app.save(new Collection({
    type: 'base',
    name: 'pages',
    fields: [
      { type: 'text',   name: 'slug',            required: true },
      { type: 'text',   name: 'title',           required: true },
      { type: 'editor', name: 'body' },
      { type: 'text',   name: 'seo_title' },
      { type: 'text',   name: 'seo_description' },
      { type: 'file',   name: 'og_image', maxSelect: 1, mimeTypes: ['image/png','image/jpeg','image/webp'] },
      { type: 'bool',   name: 'published' },
    ],
    listRule: 'published = true', viewRule: 'published = true',
    createRule: null, updateRule: null, deleteRule: null,
    indexes: ['CREATE UNIQUE INDEX idx_pages_slug ON pages (slug)'],
  }))

  // ── post_categories ───────────────────────────────────────────────────
  app.save(new Collection({
    id:   'cp_post_cats',
    type: 'base',
    name: 'post_categories',
    fields: [
      { type: 'text', name: 'name', required: true },
      { type: 'text', name: 'slug', required: true },
      { type: 'text', name: 'description' },
    ],
    listRule: '', viewRule: '', createRule: null, updateRule: null, deleteRule: null,
    indexes: ['CREATE UNIQUE INDEX idx_postcat_slug ON post_categories (slug)'],
  }))

  // ── posts ─────────────────────────────────────────────────────────────
  app.save(new Collection({
    type: 'base',
    name: 'posts',
    fields: [
      { type: 'text',     name: 'slug',         required: true },
      { type: 'text',     name: 'title',        required: true },
      { type: 'text',     name: 'excerpt' },
      { type: 'editor',   name: 'body' },
      { type: 'file',     name: 'cover',        maxSelect: 1, mimeTypes: ['image/png','image/jpeg','image/webp'] },
      { type: 'relation', name: 'category',     collectionId: 'cp_post_cats', maxSelect: 1 },
      { type: 'date',     name: 'published_at' },
      { type: 'bool',     name: 'published' },
      { type: 'text',     name: 'seo_title' },
      { type: 'text',     name: 'seo_description' },
    ],
    listRule: 'published = true', viewRule: 'published = true',
    createRule: null, updateRule: null, deleteRule: null,
    indexes: [
      'CREATE UNIQUE INDEX idx_posts_slug ON posts (slug)',
      'CREATE INDEX idx_posts_published_at ON posts (published_at)',
    ],
  }))

  // ── document_categories ───────────────────────────────────────────────
  app.save(new Collection({
    id:   'cp_doc_cats',
    type: 'base',
    name: 'document_categories',
    fields: [
      { type: 'text',   name: 'name',        required: true },
      { type: 'text',   name: 'slug',        required: true },
      { type: 'text',   name: 'description' },
      { type: 'number', name: 'sort_order' },
    ],
    listRule: '', viewRule: '', createRule: null, updateRule: null, deleteRule: null,
    indexes: ['CREATE UNIQUE INDEX idx_doccat_slug ON document_categories (slug)'],
  }))

  // ── documents ─────────────────────────────────────────────────────────
  app.save(new Collection({
    type: 'base',
    name: 'documents',
    fields: [
      { type: 'text',     name: 'title',    required: true },
      { type: 'file',     name: 'file',     maxSelect: 1, mimeTypes: ['application/pdf'] },
      { type: 'relation', name: 'category', collectionId: 'cp_doc_cats', maxSelect: 1 },
      { type: 'number',   name: 'year' },
      { type: 'text',     name: 'description' },
      { type: 'number',   name: 'sort_order' },
    ],
    listRule: '', viewRule: '', createRule: null, updateRule: null, deleteRule: null,
  }))

  // ── forms ─────────────────────────────────────────────────────────────
  app.save(new Collection({
    id:   'cp_forms',
    type: 'base',
    name: 'forms',
    fields: [
      { type: 'text',   name: 'slug',            required: true },
      { type: 'text',   name: 'title',           required: true },
      { type: 'text',   name: 'description' },
      { type: 'json',   name: 'schema' },
      { type: 'text',   name: 'submit_label' },
      { type: 'text',   name: 'success_message' },
      { type: 'text',   name: 'notify_email' },
      { type: 'bool',   name: 'published' },
    ],
    listRule: 'published = true', viewRule: 'published = true',
    createRule: null, updateRule: null, deleteRule: null,
    indexes: ['CREATE UNIQUE INDEX idx_forms_slug ON forms (slug)'],
  }))

  // ── form_submissions ──────────────────────────────────────────────────
  app.save(new Collection({
    type: 'base',
    name: 'form_submissions',
    fields: [
      { type: 'relation', name: 'form', collectionId: 'cp_forms', maxSelect: 1 },
      { type: 'json',     name: 'data' },
      { type: 'text',     name: 'ip' },
      { type: 'text',     name: 'user_agent' },
    ],
    listRule: null, viewRule: null, createRule: '', updateRule: null, deleteRule: null,
  }))

  // ── seed settings singleton ───────────────────────────────────────────
  const settingsCol = app.findCollectionByNameOrId('settings')
  const settingsRec = new Record(settingsCol)
  settingsRec.set('site_name', 'ClaudePress Site')
  settingsRec.set('tagline', 'A new site built with ClaudePress')
  app.save(settingsRec)

}, (app) => {
  const names = [
    'form_submissions', 'forms',
    'documents', 'document_categories',
    'posts', 'post_categories',
    'pages', 'navigation', 'settings',
  ]
  for (const name of names) {
    try {
      const col = app.findCollectionByNameOrId(name)
      if (col) app.delete(col)
    } catch (_) { /* already gone */ }
  }
})
