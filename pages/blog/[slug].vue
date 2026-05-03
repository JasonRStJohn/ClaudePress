<template>
  <div>
    <template v-if="post">
      <CpSeoHead
        :title="post.seo_title || post.title"
        :description="post.seo_description || post.excerpt"
        :image="coverUrl || undefined"
        type="article"
      />

      <article class="max-w-3xl mx-auto px-6 py-12">
        <div v-if="categoryName" class="text-xs uppercase tracking-wider text-brand-600 font-semibold mb-2">
          {{ categoryName }}
        </div>
        <h1 class="font-serif text-4xl md:text-5xl font-bold text-brand-900 mb-3">
          {{ post.title }}
        </h1>
        <p v-if="post.published_at" class="text-sm text-slate-500 mb-6">
          {{ formatDate(post.published_at) }}
        </p>

        <img
          v-if="coverUrl"
          :src="coverUrl"
          :alt="post.title"
          class="w-full rounded-xl mb-8"
        />

        <CpRichText :html="post.body" />

        <div class="mt-12 pt-6 border-t border-slate-200">
          <NuxtLink to="/blog" class="text-brand-600 hover:text-brand-800 font-medium">
            ← All posts
          </NuxtLink>
        </div>
      </article>
    </template>

    <template v-else>
      <CpSeoHead title="Post not found" />
      <div class="max-w-2xl mx-auto px-6 py-24 text-center">
        <h1 class="font-serif text-4xl font-bold text-brand-900 mb-4">Post not found</h1>
        <NuxtLink to="/blog" class="text-brand-600 hover:text-brand-800 font-medium">← Back to blog</NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { data: post } = await useAsyncData(
  () => `post:${slug.value}`,
  () => usePost(slug.value),
)

if (!post.value) setResponseStatus(404)

const coverUrl = computed(() =>
  post.value ? useFile(post.value as any, 'cover') : null
)
const categoryName = computed(() => post.value?.expand?.category?.name || '')

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  } catch { return '' }
}
</script>
