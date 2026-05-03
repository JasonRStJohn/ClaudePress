<template>
  <div class="max-w-xl">
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/admin/banners" class="text-slate-400 hover:text-slate-600 transition-colors">
        ← Banners
      </NuxtLink>
      <span class="text-slate-300">/</span>
      <h1 class="text-xl font-semibold text-slate-900">New banner</h1>
    </div>

    <form class="space-y-5" @submit.prevent="handleSubmit">
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
          {{ saving ? 'Saving…' : 'Create' }}
        </button>
        <NuxtLink to="/admin/banners" class="px-5 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
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
    }
    if (form.start_date) payload.start_date = form.start_date
    if (form.end_date)   payload.end_date   = form.end_date
    await pb.collection('banners').create(payload)
    await navigateTo('/admin/banners')
  } catch (e: any) {
    saveError.value = e?.response?.message || e?.message || 'Save failed.'
  } finally {
    saving.value = false
  }
}
</script>
