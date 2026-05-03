/// <reference path="../pb_data/types.d.ts" />

// Grant authenticated users (regular site users) create/update/delete access
// on content collections. Superuser-only (null) rules locked out everyone
// except PocketBase admins.
//
// Also opens list/view rules on pages and posts so auth'd users can see
// drafts — needed for the admin panel to list unpublished content.

migrate((app) => {
  const auth = '@request.auth.id != ""'

  // pages — auth users can see drafts and edit
  const pages = app.findCollectionByNameOrId('pages')
  pages.listRule = `published = true || ${auth}`
  pages.viewRule = `published = true || ${auth}`
  pages.createRule = auth
  pages.updateRule = auth
  pages.deleteRule = auth
  app.save(pages)

  // posts — same pattern
  const posts = app.findCollectionByNameOrId('posts')
  posts.listRule = `published = true || ${auth}`
  posts.viewRule = `published = true || ${auth}`
  posts.createRule = auth
  posts.updateRule = auth
  posts.deleteRule = auth
  app.save(posts)

  // documents — list/view already public; just unlock writes
  const documents = app.findCollectionByNameOrId('documents')
  documents.createRule = auth
  documents.updateRule = auth
  documents.deleteRule = auth
  app.save(documents)

  // navigation — unlock writes
  const navigation = app.findCollectionByNameOrId('navigation')
  navigation.createRule = auth
  navigation.updateRule = auth
  navigation.deleteRule = auth
  app.save(navigation)

  // settings — unlock writes
  const settings = app.findCollectionByNameOrId('settings')
  settings.createRule = auth
  settings.updateRule = auth
  settings.deleteRule = auth
  app.save(settings)

}, (app) => {
  // Revert to superuser-only writes
  const names = ['pages', 'posts', 'documents', 'navigation', 'settings']
  for (const name of names) {
    try {
      const col = app.findCollectionByNameOrId(name)
      col.createRule = null
      col.updateRule = null
      col.deleteRule = null
      if (name === 'pages' || name === 'posts') {
        col.listRule = 'published = true'
        col.viewRule = 'published = true'
      }
      app.save(col)
    } catch (_) { /* already gone */ }
  }
})
