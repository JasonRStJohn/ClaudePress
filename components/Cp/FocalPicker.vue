<template>
  <div>
    <p class="text-xs text-slate-500 mb-2">
      Drag the dot onto the subject, then zoom in if it sits too small in the frame.
    </p>
    <div class="flex flex-wrap items-start gap-6">
      <!-- The full, uncropped image with a draggable focal dot -->
      <div
        ref="pad"
        class="relative w-64 max-w-full border border-slate-300 cursor-crosshair select-none touch-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="{ 'opacity-50 pointer-events-none': disabled || fit }"
        tabindex="0"
        role="group"
        aria-label="Focal point. Drag, or use the arrow keys."
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
        @keydown="onKey"
      >
        <img :src="src" alt="" class="w-full block pointer-events-none" draggable="false" />
        <div
          v-if="!fit"
          class="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white shadow ring-1 ring-black/40 bg-blue-600"
          :style="{ left: x + '%', top: y + '%' }"
        />
      </div>

      <!-- Live preview of the true crop, at the aspect the site displays it -->
      <div class="w-48 shrink-0">
        <CpFramedImage
          :src="src"
          :framing="{ x, y, zoom, fit }"
          eager
          class="border border-slate-300 bg-slate-100"
          :style="{ aspectRatio: aspect }"
        />
        <p class="text-xs text-slate-500 mt-1">How it will appear</p>
      </div>
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
import { FRAMING_MAX_ZOOM, clampAxis, clampZoom, pointToFocal } from '../../utils/focalPoint'

const props = withDefaults(defineProps<{
  /** The original, uncropped image — not a thumb, so the dot maps to the real photo. */
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

const pad = ref<HTMLElement | null>(null)
const zoomId = useId()

const x = computed(() => clampAxis(props.focalX))
const y = computed(() => clampAxis(props.focalY))
const zoom = computed(() => clampZoom(props.zoom))
const fit = computed(() => props.fit === true)
const isDefault = computed(() => x.value === 50 && y.value === 50 && zoom.value === 1 && !fit.value)

const setFocal = (fx: number, fy: number) => {
  emit('update:focalX', clampAxis(fx))
  emit('update:focalY', clampAxis(fy))
}

let dragging = false
const moveTo = (e: PointerEvent) => {
  if (!pad.value || fit.value) return
  const p = pointToFocal(e.clientX, e.clientY, pad.value.getBoundingClientRect())
  setFocal(p.x, p.y)
}
const onDown = (e: PointerEvent) => {
  dragging = true
  // Capture keeps the drag alive when the pointer leaves the pad.
  pad.value?.setPointerCapture(e.pointerId)
  moveTo(e)
}
const onMove = (e: PointerEvent) => { if (dragging) moveTo(e) }
const onUp = () => { dragging = false }

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
