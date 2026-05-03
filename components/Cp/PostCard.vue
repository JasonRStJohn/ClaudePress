<template>
  <NuxtLink
    :to="`/blog/${post.slug}`"
    class="group block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
  >
    <div v-if="coverUrl" class="aspect-[16/9] overflow-hidden bg-slate-100">
      <img
        :src="coverUrl"
        :alt="post.title"
        loading="lazy"
        class="w-full h-full object-cover group-hover:scale-105 transition duration-500"
      />
    </div>
    <div class="p-5">
      <div v-if="categoryName" class="text-xs uppercase tracking-wider text-brand-600 font-semibold mb-1">
        {{ categoryName }}
      </div>
      <h3 class="font-serif text-lg font-bold text-slate-900 group-hover:text-brand-700 transition mb-1">
        {{ post.title }}
      </h3>
      <p v-if="post.excerpt" class="text-sm text-slate-600 line-clamp-2">{{ post.excerpt }}</p>
      <p v-if="post.published_at" class="mt-3 text-xs text-slate-400">
        {{ formatDate(post.published_at) }}
      </p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{ post: Record<string, any> }>()

const coverUrl = computed(() => useFile(props.post as any, 'cover', { thumb: '800x0' }))
const categoryName = computed(() => props.post.expand?.category?.name || '')

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch { return '' }
}
</script>
