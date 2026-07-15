<template>
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
