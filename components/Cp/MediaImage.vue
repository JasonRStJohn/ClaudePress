<template>
  <img
    v-if="src"
    :src="src"
    :alt="alt || ''"
    :loading="eager ? 'eager' : 'lazy'"
    :class="imgClass"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  record: Record<string, any> | null | undefined
  field: string
  alt?: string
  thumb?: string
  eager?: boolean
  imgClass?: string
}>()

const src = computed(() => {
  if (!props.record) return null
  return useFile(props.record as any, props.field, { thumb: props.thumb })
})
</script>
