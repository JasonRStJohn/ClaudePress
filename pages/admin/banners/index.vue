<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold text-slate-900">Banners</h1>
      <NuxtLink
        to="/admin/banners/new"
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
      >
        New banner
      </NuxtLink>
    </div>

    <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div v-if="loading" class="px-6 py-10 text-center text-slate-400 text-sm">Loading…</div>
      <div v-else-if="banners.length === 0" class="px-6 py-10 text-center text-slate-400 text-sm">
        No banners yet.
      </div>
      <table v-else class="w-full text-sm">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-slate-600">Preview</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Window</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600">Status</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Order</th>
            <th class="w-16" />
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="a in banners" :key="a.id" class="hover:bg-slate-50 transition-colors">
            <td class="px-4 py-3">
              <span
                class="inline-block px-2 py-0.5 rounded text-xs font-medium truncate max-w-xs"
                :style="{ backgroundColor: a.color || 'red', color: a.text_color || 'white' }"
              >
                {{ a.content }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-500 hidden sm:table-cell text-xs">
              {{ formatWindow(a) }}
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-block px-2 py-0.5 rounded text-xs font-medium"
                :class="isLive(a)
                  ? 'bg-green-50 text-green-700'
                  : 'bg-slate-100 text-slate-500'"
              >
                {{ isLive(a) ? 'Live' : 'Hidden' }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-500 hidden sm:table-cell">{{ a.sort_order ?? 0 }}</td>
            <td class="px-4 py-3">
              <NuxtLink :to="`/admin/banners/${a.id}`" class="text-blue-600 hover:text-blue-800 font-medium">
                Edit
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RecordModel } from 'pocketbase'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const { pb } = useAuth()

const loading = ref(true)
const banners = ref<RecordModel[]>([])

onMounted(async () => {
  banners.value = await pb.collection('banners').getFullList({ sort: 'sort_order' })
  loading.value = false
})

function isLive(a: RecordModel): boolean {
  if (!a.active) return false
  const now = Date.now()
  if (a.start_date && now < new Date(a.start_date).getTime()) return false
  if (a.end_date && now > new Date(a.end_date).getTime()) return false
  return true
}

function formatWindow(a: RecordModel): string {
  const s = a.start_date ? new Date(a.start_date).toLocaleDateString() : null
  const e = a.end_date ? new Date(a.end_date).toLocaleDateString() : null
  if (!s && !e) return 'Always'
  if (s && !e) return `From ${s}`
  if (!s && e) return `Until ${e}`
  return `${s} → ${e}`
}
</script>
