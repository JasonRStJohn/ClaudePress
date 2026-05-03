<template>
  <div class="max-w-xl">
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/admin/banners" class="text-slate-400 hover:text-slate-600 transition-colors">
        ← Banners
      </NuxtLink>
      <span class="text-slate-300">/</span>
      <h1 class="text-xl font-semibold text-slate-900">Edit banner</h1>
    </div>

    <div v-if="loadError" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-6">
      {{ loadError }}
    </div>

    <form v-if="record" class="space-y-5" @submit.prevent="handleSubmit">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="content">Content</label>
        <input
          id="content"
          v-model="form.content"
          type="text"
          required
          :disabled="saving"
          class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="color">Background color</label>
          <input
            id="color"
            v-model="form.color"
            type="text"
            :disabled="saving"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="text_color">Text color</label>
          <input
            id="text_color"
            v-model="form.text_color"
            type="text"
            :disabled="saving"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <div class="block text-sm font-medium text-slate-700 mb-1">Preview</div>
        <h2
          class="w-full text-center py-2 text-lg font-semibold rounded"
          :style="{ backgroundColor: form.color || 'red', color: form.text_color || 'white' }"
        >
          {{ form.content || 'Your banner here' }}
        </h2>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="start_date">Start date (optional)</label>
          <input
            id="start_date"
            v-model="form.start_date"
            type="date"
            :disabled="saving"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="end_date">End date (optional)</label>
          <input
            id="end_date"
            v-model="form.end_date"
            type="date"
            :disabled="saving"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="sort_order">Sort order</label>
        <input
          id="sort_order"
          v-model.number="form.sort_order"
          type="number"
          :disabled="saving"
          class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      <div class="flex items-center gap-2">
        <input id="active" v-model="form.active" type="checkbox" :disabled="saving" class="rounded border-slate-300" />
        <label for="active" class="text-sm font-medium text-slate-700">Active</label>
      </div>

      <div v-if="saveError" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
        {{ saveError }}
      </div>

      <div class="flex items-center gap-3 pt-2">
        <button
          type="submit"
          :disabled="saving"
          class="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
        <NuxtLink to="/admin/banners" class="px-5 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
          Cancel
        </NuxtLink>
        <button
          type="button"
          :disabled="saving"
          class="ml-auto px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
          @click="handleDelete"
        >
          Delete
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { RecordModel } from 'pocketbase'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const { pb } = useAuth()
const route = useRoute()
const id = route.params.id as string

const record = ref<RecordModel | null>(null)
const saving = ref(false)
const loadError = ref('')
const saveError = ref('')

const form = reactive({
  content: '',
  color: 'red',
  text_color: 'white',
  start_date: '',
  end_date: '',
  active: true,
  sort_order: 0,
})

// PB stores dates as "YYYY-MM-DD 00:00:00.000Z" — the date input wants "YYYY-MM-DD".
function toDateInput(v: any): string {
  if (!v) return ''
  const s = String(v)
  return s.length >= 10 ? s.slice(0, 10) : s
}

onMounted(async () => {
  try {
    const r = await pb.collection('banners').getOne(id)
    record.value = r
    form.content    = r.content ?? ''
    form.color      = r.color ?? 'red'
    form.text_color = r.text_color ?? 'white'
    form.start_date = toDateInput(r.start_date)
    form.end_date   = toDateInput(r.end_date)
    form.active     = !!r.active
    form.sort_order = r.sort_order ?? 0
  } catch (e: any) {
    loadError.value = e?.message || 'Banner not found.'
  }
})

const handleSubmit = async () => {
  saving.value = true
  saveError.value = ''
  try {
    const payload: Record<string, any> = {
      content: form.content,
      color: form.color,
      text_color: form.text_color,
      active: form.active,
      sort_order: form.sort_order ?? 0,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    }
    await pb.collection('banners').update(id, payload)
    await navigateTo('/admin/banners')
  } catch (e: any) {
    saveError.value = e?.response?.message || e?.message || 'Save failed.'
  } finally {
    saving.value = false
  }
}

const handleDelete = async () => {
  if (!window.confirm('Delete this banner? This cannot be undone.')) return
  saving.value = true
  try {
    await pb.collection('banners').delete(id)
    await navigateTo('/admin/banners')
  } catch (e: any) {
    saveError.value = e?.message || 'Delete failed.'
    saving.value = false
  }
}
</script>
