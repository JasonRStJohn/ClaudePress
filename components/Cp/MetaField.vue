<template>
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1" :for="fieldId">{{ label }}</label>
    <textarea
      v-if="kind === 'description'"
      :id="fieldId"
      :value="modelValue"
      rows="3"
      :disabled="disabled"
      class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
      @input="onInput"
    ></textarea>
    <input
      v-else
      :id="fieldId"
      :value="modelValue"
      type="text"
      :disabled="disabled"
      class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      @input="onInput"
    />
    <div class="flex items-center justify-between mt-1">
      <p class="text-xs text-slate-500">{{ hint }}</p>
      <span class="text-xs font-medium" :class="bandClass">{{ counterText }}</span>
    </div>
    <p v-if="kind === 'title'" class="text-xs text-slate-400 mt-1 truncate">
      Preview: {{ preview }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Band } from '../../utils/socialMeta'

const props = withDefaults(defineProps<{
  modelValue: string
  kind: 'title' | 'description' | 'alt'
  label: string
  siteName?: string
  disabled?: boolean
}>(), { siteName: '', disabled: false })

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
const onInput = (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value)

const fieldId = computed(() => `meta-${props.kind}`)
const preview = computed(() => composedTitle(props.modelValue, props.siteName))

const length = computed(() =>
  props.kind === 'title' ? preview.value.length : props.modelValue.length,
)

const band = computed<Band>(() => {
  if (props.kind === 'title') return titleBand(length.value)
  if (props.kind === 'description') return descriptionBand(length.value)
  return altBand(props.modelValue)
})

const bandClass = computed(() => ({
  green: 'text-green-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
}[band.value]))

const counterText = computed(() =>
  props.kind === 'alt'
    ? (band.value === 'green' ? 'set' : 'missing')
    : `${length.value} chars`,
)

const hint = computed(() => ({
  title: 'Aim for ≤60 characters including your site name.',
  description: 'Aim for 120–125 characters (works for both social and Google).',
  alt: 'Describe the share image for screen readers.',
}[props.kind]))
</script>
