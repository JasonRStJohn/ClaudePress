/// <reference path="../pb_data/types.d.ts" />

// ClaudePress base layer — client-authored social/SEO defaults on the settings
// singleton. All optional: CpSeoHead falls back to tagline / per-page props /
// the bundled og.png when unset, so existing sites are unchanged until filled.

migrate((app) => {
  const settings = app.findCollectionByNameOrId('settings')
  const text = (name) => new Field({ type: 'text', name })
  settings.fields.add(text('social_title'))
  settings.fields.add(text('social_description'))
  settings.fields.add(text('og_image_alt'))
  settings.fields.add(text('twitter_site'))
  app.save(settings)
}, (app) => {
  const settings = app.findCollectionByNameOrId('settings')
  for (const name of ['social_title', 'social_description', 'og_image_alt', 'twitter_site']) {
    settings.fields.removeByName(name)
  }
  app.save(settings)
})
