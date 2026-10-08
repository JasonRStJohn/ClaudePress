<template>
  <div>
    <p class="text-xs text-slate-500 mb-2">
      <template v-if="fit">The whole photo is shown, so there is nothing to position.</template>
      <template v-else-if="canPan">Drag the photo to position it. Zoom in if the subject sits too small.</template>
      <template v-else>This photo already fits the frame. Zoom in to reposition it.</template>
    </p>

    <!-- The frame as the site shows it; dragging the photo pans it in place. -->
    <div
      ref="frame"
      class="w-72 max-w-full border border-slate-300 bg-slate-100 select-none touch-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      :class="[
        disabled ? 'opacity-50 pointer-events-none' : '',
        !canPan ? 'cursor-default' : dragging ? 'cursor-grabbing' : 'cursor-grab',
      ]"
      :style="{ aspectRatio: aspect }"
      tabindex="0"
      role="group"
      aria-label="Photo position. Drag the photo, or use the arrow keys."
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @dragstart.prevent
      @keydown="onKey"
    >
      <CpFramedImage :src="src" :framing="{ x, y, zoom, fit }" eager class="w-full h-full pointer-events-none" />
    </div>

    <div class="flex items-center gap-3 mt-3 max-w-md">
      <label class="text-sm font-medium text-slate-700 shrink-0" :for="zoomId">Zoom</label>
      <input
        :id="zoomId"
        type="range"
        min="1"
        :max="FRAMING_MAX_ZOOM"
        step="0.05"
        :value="zoom"
        :disabled="disabled || fit"
        class="flex-1 disabled:opacity-40"
        @input="onZoom"
      />
      <span class="text-xs font-medium text-slate-600 w-10 text-right">{{ zoom.toFixed(2) }}×</span>
      <button
        type="button"
        class="text-xs font-medium text-blue-700 hover:text-blue-900 disabled:opacity-40"
        :disabled="disabled || isDefault"
        @click="reset"
      >
        Reset
      </button>
    </div>

    <label class="flex items-start gap-2 mt-3 text-sm text-slate-700 max-w-md">
      <input
        type="checkbox"
        class="mt-0.5"
        :checked="fit"
        :disabled="disabled"
        @change="emit('update:fit', ($event.target as HTMLInputElement).checked)"
      />
      <span>
        <span class="font-medium">Show whole photo</span>
        <span class="block text-xs text-slate-500">
          For a photo the wrong shape for this frame. Nothing is cropped; the space around it is filled with a soft blur of the same photo.
        </span>
      </span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { FRAMING_MAX_ZOOM, clampAxis, clampZoom, panFocal } from '../../utils/focalPoint'

const props = withDefaults(defineProps<{
  /** The original, uncropped image — not a thumb, which PocketBase has already cropped. */
  src: string
  focalX?: number | null
  focalY?: number | null
  zoom?: number | null
  /** Show the whole photo instead of filling the frame; pan and zoom are then off. */
  fit?: boolean
  /** CSS aspect-ratio of the frame the image displays in, e.g. '4/3', '1/1'. */
  aspect?: string
  disabled?: boolean
}>(), { aspect: '4/3' })

const emit = defineEmits<{
  'update:focalX': [n: number]
  'update:focalY': [n: number]
  'update:zoom': [n: number]
  'update:fit': [on: boolean]
}>()

const frame = ref<HTMLElement | null>(null)
const zoomId = useId()

const x = computed(() => clampAxis(props.focalX))
const y = computed(() => clampAxis(props.focalY))
const zoom = computed(() => clampZoom(props.zoom))
const fit = computed(() => props.fit === true)
const isDefault = computed(() => x.value === 50 && y.value === 50 && zoom.value === 1 && !fit.value)

// The photo's real size decides how far it can travel in the frame. The file
// is the one CpFramedImage shows, so this is served from cache.
const natural = ref({ width: 0, height: 0 })
watch(() => props.src, (src) => {
  natural.value = { width: 0, height: 0 }
  if (!import.meta.client || !src) return
  const img = new Image()
  img.onload = () => {
    if (props.src === src) natural.value = { width: img.naturalWidth, height: img.naturalHeight }
  }
  img.src = src
}, { immediate: true })

const frameSize = () => ({ width: frame.value?.clientWidth ?? 0, height: frame.value?.clientHeight ?? 0 })

// A photo the same shape as the frame has nowhere to go until it is zoomed.
const canPan = computed(() => {
  if (fit.value || props.disabled) return false
  if (zoom.value > 1 || !natural.value.width) return true
  const [w, h] = props.aspect.split('/').map(Number)
  if (!w || !h) return true
  return Math.abs(natural.value.width / natural.value.height - w / h) > 0.01
})

const setFocal = (fx: number, fy: number) => {
  emit('update:focalX', clampAxis(fx))
  emit('update:focalY', clampAxis(fy))
}

const dragging = ref(false)
let origin = { px: 0, py: 0, x: 50, y: 50 }
const onDown = (e: PointerEvent) => {
  if (!canPan.value) return
  dragging.value = true
  origin = { px: e.clientX, py: e.clientY, x: x.value, y: y.value }
  // Capture keeps the drag alive when the pointer leaves the frame.
  frame.value?.setPointerCapture(e.pointerId)
}
const onMove = (e: PointerEvent) => {
  if (!dragging.value) return
  const p = panFocal(origin, e.clientX - origin.px, e.clientY - origin.py, frameSize(), natural.value, zoom.value)
  setFocal(p.x, p.y)
}
const onUp = () => { dragging.value = false }

// Arrows move the view across the photo: right shows more of its right side.
const onKey = (e: KeyboardEvent) => {
  const step = e.shiftKey ? 10 : 1
  const moves: Record<string, [number, number]> = {
    ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
  }
  const d = moves[e.key]
  if (!d || fit.value) return
  e.preventDefault()
  setFocal(x.value + d[0], y.value + d[1])
}

const onZoom = (e: Event) => emit('update:zoom', clampZoom((e.target as HTMLInputElement).value))

const reset = () => {
  setFocal(50, 50)
  emit('update:zoom', 1)
  emit('update:fit', false)
}
</script>
