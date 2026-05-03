<template>
  <div>
    <h1 class="text-xl font-semibold text-slate-900 mb-1">Dashboard</h1>
    <p class="text-slate-500 text-sm mb-8">
      Welcome back{{ displayName ? ', ' + displayName : '' }}.
    </p>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-white border border-slate-200 rounded-lg p-5"
      >
        <div class="text-3xl font-bold text-slate-900">{{ stat.count }}</div>
        <div class="text-sm text-slate-500 mt-1">{{ stat.label }}</div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="flex flex-wrap gap-3">
      <NuxtLink to="/admin/pages" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
        Edit Pages
      </NuxtLink>
      <NuxtLink to="/admin/posts/new" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
        New Post
      </NuxtLink>
      <NuxtLink to="/admin/documents/new" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
        Upload Document
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { pb, currentUser } = useAuth()

const displayName = computed(() =>
  currentUser.value?.name || currentUser.value?.email?.split('@')[0] || '',
)

const statCounts = ref({ pages: 0, posts: 0, documents: 0 })

onMounted(async () => {
  const [pages, posts, documents] = await Promise.all([
    pb.collection('pages').getList(1, 1).catch(() => ({ totalItems: 0 })),
    pb.collection('posts').getList(1, 1).catch(() => ({ totalItems: 0 })),
    pb.collection('documents').getList(1, 1).catch(() => ({ totalItems: 0 })),
  ])
  statCounts.value = {
    pages: pages.totalItems,
    posts: posts.totalItems,
    documents: documents.totalItems,
  }
})

const stats = computed(() => [
  { label: 'Pages', count: statCounts.value.pages },
  { label: 'Posts', count: statCounts.value.posts },
  { label: 'Documents', count: statCounts.value.documents },
])
</script>
