<script setup lang="ts">
const props = defineProps<{
  title?: string | null
  description?: string | null
  image?: string | null
  type?: 'website' | 'article'
}>()

const settings = await useSettings()
const siteName = settings?.site_name || useRuntimeConfig().public.siteName

const fullTitle = computed(() =>
  props.title ? `${props.title} — ${siteName}` : siteName
)

useSeoMeta({
  title: fullTitle,
  description: props.description || settings?.tagline || '',
  ogTitle: fullTitle,
  ogDescription: props.description || settings?.tagline || '',
  ogImage: props.image || null,
  ogType: props.type || 'website',
  twitterCard: 'summary_large_image',
})
</script>

<template><div style="display:none" /></template>
