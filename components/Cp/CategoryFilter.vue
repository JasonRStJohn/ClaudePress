<template>
  <div class="flex flex-wrap gap-2">
    <button
      @click="$emit('update:modelValue', null)"
      :class="pillClass(modelValue === null)"
    >
      All
    </button>
    <button
      v-for="cat in categories"
      :key="cat.id"
      @click="$emit('update:modelValue', cat.slug || cat.name)"
      :class="pillClass(modelValue === (cat.slug || cat.name))"
    >
      {{ cat.name }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string | null
  categories: Array<{ id: string; name: string; slug?: string }>
}>()
defineEmits<{ 'update:modelValue': [value: string | null] }>()

const pillClass = (active: boolean) => [
  'px-4 py-2 rounded-full text-sm font-medium transition',
  active
    ? 'bg-brand-700 text-white shadow'
    : 'bg-white border border-slate-300 text-slate-600 hover:border-brand-400 hover:text-brand-700',
]
</script>
