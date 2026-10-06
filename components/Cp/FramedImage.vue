<template>
  <!-- Size and aspect come from the caller's class on this frame. -->
  <div class="overflow-hidden">
    <img
      v-if="src"
      :src="src"
      :alt="alt || ''"
      :loading="eager ? 'eager' : 'lazy'"
      class="w-full h-full object-cover"
      :style="style"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  record: Record<string, any> | null | undefined
  field: string
  alt?: string
  thumb?: string
  eager?: boolean
}>()

const src = computed(() => {
  if (!props.record) return null
  return useFile(props.record as any, props.field, { thumb: props.thumb })
})

const { style } = useImageFraming(() => props.record, () => props.field)
</script>
