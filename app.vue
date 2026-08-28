<template>
  <!-- Site-wide SEO/social baseline: every route gets og:title, og:description,
       og:url, og:image (from settings.og_image or the site's /og.png) and the
       twitter card, derived from the settings singleton. A page that renders
       its own <CpSeoHead> with props overrides these per-key. -->
  <CpSeoHead />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// Site favicon comes from the settings singleton — set once here so every
// route gets it, rather than per-page (not every page includes CpSeoHead).
const settings = await useSettings()
const faviconUrl = settings ? useFile(settings, 'favicon') : null

useHead({
  link: faviconUrl ? [{ rel: 'icon', href: faviconUrl }] : [],
})
</script>
