<template>
  <!-- Size and aspect come from the caller's class on this frame. -->
  <div class="relative overflow-hidden">
    <!--
      "Show whole photo": the photo no longer fills the frame, so the leftover
      space is filled with a blurred, enlarged copy of the same file (already
      downloaded — no second request) instead of flat bars.
    -->
    <img
      v-if="resolvedSrc && resolvedFraming.fit"
      :src="resolvedSrc"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 w-full h-full object-cover scale-125 blur-xl opacity-80 pointer-events-none"
    />
    <img
      v-if="resolvedSrc"
      :src="resolvedSrc"
      :alt="alt || ''"
      :loading="eager ? 'eager' : 'lazy'"
      class="relative w-full h-full object-cover"
      :style="style"
    />
  </div>
</template>

<script setup lang="ts">
import { framingStyle, readFraming, type Framing } from '../../utils/focalPoint'

// Two ways in: `record` + `field` (framing read by convention from the
// sibling fields), or an explicit `src` + `framing` for callers that resolve
// those themselves (multi-file fields, fallback images, admin previews).
const props = defineProps<{
  record?: Record<string, any> | null
  field?: string
  src?: string | null
  framing?: Framing | null
  alt?: string
  thumb?: string
  eager?: boolean
}>()

const resolvedSrc = computed(() => {
  if (props.src) return props.src
  if (!props.record || !props.field) return null
  return useFile(props.record as any, props.field, { thumb: props.thumb })
})

const resolvedFraming = computed<Framing>(() =>
  props.framing ?? readFraming(props.record, props.field || ''),
)

const style = computed(() => {
  const f = resolvedFraming.value
  return framingStyle(f.x, f.y, f.zoom, f.fit)
})
</script>
