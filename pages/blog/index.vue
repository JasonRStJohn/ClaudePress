<template>
  <div class="max-w-6xl mx-auto px-6 py-12">
    <CpSeoHead title="Blog" description="Latest posts" />

    <header class="mb-10">
      <h1 class="font-serif text-4xl font-bold text-brand-900 mb-2">Blog</h1>
      <div class="h-1 w-24 bg-brand-600" />
    </header>

    <div v-if="!posts?.items?.length" class="text-slate-400 italic py-12 text-center">
      No posts yet.
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <CpPostCard v-for="post in posts.items" :key="post.id" :post="post" />
    </div>

    <CpPagination
      v-if="posts"
      :page="posts.page"
      :total-pages="posts.totalPages"
      base-path="/blog"
    />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const page = computed(() => Number(route.query.page) || 1)

const { data: posts } = await useAsyncData(
  () => `posts:${page.value}`,
  () => usePosts({ page: page.value, perPage: 12 }),
  { watch: [page] },
)
</script>
