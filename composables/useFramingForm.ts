import { reactive } from 'vue'
import { framingFields, readFraming, type Framing } from '../utils/focalPoint'

const centred = (): Required<Framing> => ({ x: 50, y: 50, zoom: 1, fit: false })

/**
 * Editor-side state for one single-file image field's framing: bind `framing`
 * to <CpFocalPicker>, `load` it from the record, `reset` it when the photo is
 * replaced or removed, and `appendTo` the save so every number goes together
 * (a lone zoom of 0 would read back as "never framed").
 *
 *   const photoFraming = useFramingForm('photo')
 *   <CpFocalPicker :src v-model:focal-x="photoFraming.framing.x" … />
 *
 * Pass `{ fit: false }` for a field with no `<field>_fit` sibling.
 */
export const useFramingForm = (field: string, opts: { fit?: boolean } = {}) => {
  const framing = reactive(centred())
  const reset = () => { Object.assign(framing, centred()) }
  const load = (record: Record<string, any> | null | undefined) => {
    Object.assign(framing, centred(), readFraming(record, field))
  }
  const appendTo = (data: FormData) => {
    const names = framingFields(field)
    data.append(names.x, String(framing.x))
    data.append(names.y, String(framing.y))
    data.append(names.zoom, String(framing.zoom))
    if (opts.fit !== false) data.append(names.fit, framing.fit ? 'true' : 'false')
  }
  return { framing, reset, load, appendTo }
}
