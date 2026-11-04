/// <reference path="../pb_data/types.d.ts" />

// ClaudePress base layer — add `pinned` to posts.
//
// "Pin to top": a pinned post sorts ahead of everything else in usePosts
// (pinned first, then newest first) and stays there until an admin unticks
// it — no expiry. Sites may present it under their own name (Argyle Village
// badges pinned posts as "Urgent"). Missing/false means an ordinary post.

migrate((app) => {
  const posts = app.findCollectionByNameOrId('posts')
  posts.fields.add(new Field({ type: 'bool', name: 'pinned' }))
  app.save(posts)
}, (app) => {
  const posts = app.findCollectionByNameOrId('posts')
  posts.fields.removeByName('pinned')
  app.save(posts)
})
