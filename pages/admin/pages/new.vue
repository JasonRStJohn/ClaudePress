<template>
  <div class="max-w-3xl">
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/admin/pages" class="text-slate-400 hover:text-slate-600 transition-colors">
        ← Pages
      </NuxtLink>
      <span class="text-slate-300">/</span>
      <h1 class="text-xl font-semibold text-slate-900">New page</h1>
    </div>

    <form class="space-y-6" @submit.prevent="handleSubmit">

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Body</label>
        <CpRichEditor v-model="form.body" placeholder="Page content…" />
      </div>

      <details class="border border-slate-200 rounded-md">
        <summary class="px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer select-none hover:bg-slate-50">
          SEO settings
        </summary>
        <div class="px-4 pb-4 pt-3 space-y-4 border-t border-slate-200">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="seo_title">SEO title</label>
            <input
              id="seo_title"
              v-model="form.seo_title"
              type="text"
              :disabled="saving"
              class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              placeholder="Defaults to page title if blank"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="seo_description">Meta description</label>
            <textarea
              id="seo_description"
              v-model="form.seo_description"
              rows="2"
              :disabled="saving"
              class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
            />
          </div>
        </div>
      </details>

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
          {{ saving ? 'Saving…' : 'Create page' }}
        </button>
        <NuxtLink to="/admin/pages" class="px-5 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
          Cancel
        </NuxtLink>
      </div>

    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { pb } = useAuth()

const saving = ref(false)
const error = ref('')
const slugTouched = ref(false)

const form = reactive({
  title: '',
  slug: '',
  body: '',
  seo_title: '',
  seo_description: '',
  published: false,
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
    await pb.collection('pages').create({ ...form })
    await navigateTo('/admin/pages')
  } catch (e: any) {
    error.value = e?.response?.message || e?.message || 'Save failed.'
  } finally {
    saving.value = false
  }
}
</script>
