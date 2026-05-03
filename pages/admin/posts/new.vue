<template>
  <div class="max-w-3xl">
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/admin/posts" class="text-slate-400 hover:text-slate-600 transition-colors">
        ← Posts
      </NuxtLink>
      <span class="text-slate-300">/</span>
      <h1 class="text-xl font-semibold text-slate-900">New post</h1>
    </div>

    <form class="space-y-6" @submit.prevent="handleSubmit">

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="title">Title</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          required
          :disabled="saving"
          class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          @input="autoSlug"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="slug">Slug</label>
        <input
          id="slug"
          v-model="form.slug"
          type="text"
          required
          :disabled="saving"
          class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Body</label>
        <CpRichEditor v-model="form.body" placeholder="Post content…" />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="excerpt">Excerpt</label>
        <textarea
          id="excerpt"
          v-model="form.excerpt"
          rows="2"
          :disabled="saving"
          class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
          placeholder="Short summary shown in post cards"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="category">Category</label>
          <select
            id="category"
            v-model="form.category"
            :disabled="saving"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">— none —</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="published_at">Publish date</label>
          <input
            id="published_at"
            v-model="form.published_at"
            type="date"
            :disabled="saving"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="cover">Featured image</label>
        <input
          id="cover"
          ref="imageInput"
          type="file"
          accept="image/*"
          :disabled="saving"
          class="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
        />
      </div>

      <label class="flex items-center gap-2 cursor-pointer">
        <input
          v-model="form.published"
          type="checkbox"
          :disabled="saving"
          class="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span class="text-sm font-medium text-slate-700">Published</span>
      </label>

      <div v-if="error" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
        {{ error }}
      </div>

      <div class="flex items-center gap-3 pt-2">
        <button
          type="submit"
          :disabled="saving"
          class="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ saving ? 'Saving…' : 'Create post' }}
        </button>
        <NuxtLink to="/admin/posts" class="px-5 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
          Cancel
        </NuxtLink>
      </div>

    </form>
  </div>
</template>

<script setup lang="ts">
import type { RecordModel } from 'pocketbase'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const { pb } = useAuth()

const categories = ref<RecordModel[]>([])
const imageInput = ref<HTMLInputElement | null>(null)
const saving = ref(false)
const error = ref('')
const slugTouched = ref(false)

const form = reactive({
  title: '',
  slug: '',
  body: '',
  excerpt: '',
  category: '',
  published_at: new Date().toISOString().slice(0, 10),
  published: false,
})

onMounted(async () => {
  categories.value = await pb.collection('post_categories').getFullList({ sort: 'name' })
})

const autoSlug = () => {
  if (!slugTouched.value) {
    form.slug = form.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
}

const handleSubmit = async () => {
  saving.value = true
  error.value = ''
  try {
    const data = new FormData()
    data.append('title', form.title)
    data.append('slug', form.slug)
    data.append('body', form.body)
    data.append('excerpt', form.excerpt)
    if (form.category) data.append('category', form.category)
    if (form.published_at) data.append('published_at', form.published_at)
    data.append('published', String(form.published))
    const image = imageInput.value?.files?.[0]
    if (image) data.append('cover', image)
    await pb.collection('posts').create(data)
    await navigateTo('/admin/posts')
  } catch (e: any) {
    error.value = e?.response?.message || e?.message || 'Save failed.'
  } finally {
    saving.value = false
  }
}
</script>
