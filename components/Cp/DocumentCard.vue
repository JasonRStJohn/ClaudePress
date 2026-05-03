<template>
  <a
    :href="fileUrl || '#'"
    target="_blank"
    rel="noopener"
    class="flex items-start gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md hover:border-red-400 hover:text-red-700 transition"
  >
    <svg class="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7.414A2 2 0 0017.414 6L14 2.586A2 2 0 0012.586 2H4zm5 6a1 1 0 10-2 0v4a1 1 0 102 0V8zm4 0a1 1 0 10-2 0v4a1 1 0 102 0V8z" clip-rule="evenodd"/>
    </svg>
    <div class="min-w-0">
      <div class="font-medium text-sm text-slate-800 truncate">{{ doc.title }}</div>
      <div v-if="doc.year" class="text-xs text-slate-400 mt-0.5">{{ doc.year }}</div>
    </div>
  </a>
</template>

<script setup lang="ts">
const props = defineProps<{
  doc: Record<string, any>
}>()

const fileUrl = computed(() => useFile(props.doc as any, 'file'))
</script>
