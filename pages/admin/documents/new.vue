<template>
  <div class="max-w-xl">
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/admin/documents" class="text-slate-400 hover:text-slate-600 transition-colors">
        ← Documents
      </NuxtLink>
      <span class="text-slate-300">/</span>
      <h1 class="text-xl font-semibold text-slate-900">Upload document</h1>
    </div>

    <form class="space-y-5" @submit.prevent="handleSubmit">

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="title">Title</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          required
          :disabled="saving"
          class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

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
        <label class="block text-sm font-medium text-slate-700 mb-1" for="year">Year</label>
        <input
          id="year"
          v-model.number="form.year"
          type="number"
          min="1900"
          :max="new Date().getFullYear() + 1"
          :disabled="saving"
          class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="file">PDF file</label>
        <input
          id="file"
          ref="fileInput"
          type="file"
          accept=".pdf,application/pdf"
          required
          :disabled="saving"
          class="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
        />
      </div>

      <div v-if="error" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
        {{ error }}
      </div>

      <div class="flex gap-3 pt-2">
        <button
          type="submit"
          :disabled="saving"
          class="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ saving ? 'Uploading…' : 'Upload' }}
        </button>
        <NuxtLink to="/admin/documents" class="px-5 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
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
const fileInput = ref<HTMLInputElement | null>(null)
const saving = ref(false)
const error = ref('')

const form = reactive({
  title: '',
  category: '',
  year: null as number | null,
})

onMounted(async () => {
  categories.value = await pb.collection('document_categories').getFullList({ sort: 'name' })
})

const handleSubmit = async () => {
  saving.value = true
  error.value = ''
  try {
    const data = new FormData()
    data.append('title', form.title)
    if (form.category) data.append('category', form.category)
    if (form.year) data.append('year', String(form.year))
    const file = fileInput.value?.files?.[0]
    if (file) data.append('file', file)
    await pb.collection('documents').create(data)
    await navigateTo('/admin/documents')
  } catch (e: any) {
    error.value = e?.response?.message || e?.message || 'Upload failed.'
  } finally {
    saving.value = false
  }
}
</script>
