<template>
  <div>
    <template v-if="page">
      <CpSeoHead
        :title="page.seo_title || page.title"
        :description="page.seo_description"
      />
      <article class="max-w-3xl mx-auto px-6 py-12">
        <h1 class="font-serif text-4xl md:text-5xl font-bold text-brand-900 mb-2">
          {{ page.title }}
        </h1>
        <div class="h-1 w-24 bg-brand-600 mb-8" />
        <CpRichText :html="page.body" />
      </article>
    </template>

    <template v-else>
      <CpSeoHead title="Not found" />
      <div class="max-w-2xl mx-auto px-6 py-24 text-center">
        <h1 class="font-serif text-4xl font-bold text-brand-900 mb-4">Page not found</h1>
        <p class="text-slate-600 mb-6">The page you were looking for doesn't exist.</p>
        <NuxtLink to="/" class="text-brand-600 hover:text-brand-800 font-medium">← Back home</NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

// Normalize the catch-all slug: '/about' -> 'about', '/' -> 'home'
const slug = computed(() => {
  const raw = Array.isArray(route.params.slug)
    ? route.params.slug.join('/')
    : (route.params.slug as string) || ''
  return raw || 'home'
})

const { data: page } = await useAsyncData(
  () => `page:${slug.value}`,
  () => usePage(slug.value),
)

if (!page.value) {
  setResponseStatus(404)
}
</script>
