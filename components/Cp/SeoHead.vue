<script setup lang="ts">
const props = defineProps<{
  title?: string | null
  description?: string | null
  image?: string | null
  type?: 'website' | 'article'
}>()

const settings = await useSettings()
const route = useRoute()
const config = useRuntimeConfig()

const siteName = settings?.site_name || config.public.siteName
const siteUrl = ((config.public.siteUrl as string) || '').replace(/\/$/, '')

const fullTitle = computed(() =>
  props.title ? `${props.title} — ${siteName}` : siteName,
)

const description = computed(
  () => props.description || settings?.tagline || '',
)

// Social scrapers fetch from their own servers, so og:image / og:url must be
// absolute. Pass through anything already absolute; prefix the rest with
// siteUrl; give up (null) if siteUrl isn't configured.
const absolute = (u: string | null | undefined): string | null => {
  if (!u) return null
  if (/^https?:\/\//.test(u)) return u
  if (!siteUrl) return null
  return siteUrl + (u.startsWith('/') ? u : `/${u}`)
}

// Share image: explicit prop -> the settings.og_image upload -> the site's
// bundled /og.png -> none.
const ogImage = computed<string | null>(() => {
  if (props.image) return absolute(props.image)
  const fromSettings = settings ? useFile(settings, 'og_image') : null
  if (fromSettings) return fromSettings
  return absolute('/og.png')
})

const ogUrl = computed<string | null>(() => (siteUrl ? siteUrl + route.path : null))

useSeoMeta({
  title: fullTitle,
  description,
  ogTitle: fullTitle,
  ogDescription: description,
  ogImage,
  ogUrl,
  ogType: props.type || 'website',
  ogSiteName: siteName,
  twitterCard: 'summary_large_image',
  twitterTitle: fullTitle,
  twitterDescription: description,
  twitterImage: ogImage,
})
</script>

<template><div style="display:none" /></template>
