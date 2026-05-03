<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold text-slate-900">Media</h1>
      <span class="text-sm text-slate-500">{{ media.length }} file{{ media.length === 1 ? '' : 's' }}</span>
    </div>

    <div v-if="loading" class="text-center text-slate-400 text-sm py-10">Loading…</div>
    <div v-else-if="media.length === 0" class="text-center text-slate-400 text-sm py-10">No media uploads yet.</div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <div
        v-for="item in media"
        :key="item.id"
        class="group relative bg-white border border-slate-200 rounded-lg overflow-hidden"
      >
        <img
          :src="fileUrl(item)"
          :alt="item.alt || ''"
          class="w-full h-28 object-cover"
        />
        <div class="px-2 py-1.5">
          <p class="text-xs text-slate-500 truncate" :title="item.file">{{ item.file }}</p>
        </div>
        <button
          class="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 text-xs leading-none"
          title="Delete"
          @click="handleDelete(item)"
        >✕</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RecordModel } from 'pocketbase'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const { pb } = useAuth()
const pbPublicUrl = usePbPublicUrl()

const loading = ref(true)
const media = ref<RecordModel[]>([])

onMounted(async () => {
  media.value = await pb.collection('media').getFullList()
  loading.value = false
})

const fileUrl = (item: RecordModel) => {
  const filename = Array.isArray(item.file) ? item.file[0] : item.file
  return `${pbPublicUrl}/api/files/${item.collectionId}/${item.id}/${filename}`
}

const handleDelete = async (item: RecordModel) => {
  if (!window.confirm('Delete this image? Any content embedding it will show a broken image.')) return
  await pb.collection('media').delete(item.id)
  media.value = media.value.filter(m => m.id !== item.id)
}
</script>
