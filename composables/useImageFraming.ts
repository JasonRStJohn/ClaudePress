import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { framingStyle, readFraming } from '../utils/focalPoint'

/**
 * Framing style for a record's image field, read by convention from its
 * `<field>_focal_x` / `_focal_y` / `_zoom` siblings.
 *
 * Usage (the <img> must be `object-cover`, filling an `overflow-hidden` frame):
 *   const framing = useImageFraming(() => props.litter, 'sire_photo')
 *   <img class="w-full h-full object-cover" :style="framing.style.value" />
 */
export const useImageFraming = (
  record: MaybeRefOrGetter<Record<string, any> | null | undefined>,
  field: MaybeRefOrGetter<string>,
) => {
  const framing = computed(() => readFraming(toValue(record), toValue(field)))
  const style = computed(() => framingStyle(framing.value.x, framing.value.y, framing.value.zoom, framing.value.fit))
  return { framing, style }
}
