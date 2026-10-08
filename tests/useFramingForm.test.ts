import { describe, it, expect } from 'vitest'
import { useFramingForm } from '../composables/useFramingForm'

describe('useFramingForm', () => {
  it('starts centred and loads a saved framing', () => {
    const f = useFramingForm('photo')
    expect(f.framing).toEqual({ x: 50, y: 50, zoom: 1, fit: false })
    f.load({ photo_focal_x: 20, photo_focal_y: 80, photo_zoom: 2, photo_fit: true })
    expect(f.framing).toEqual({ x: 20, y: 80, zoom: 2, fit: true })
  })

  it('loads a never-framed record (all zeros) as centred', () => {
    const f = useFramingForm('photo')
    f.load({ photo_focal_x: 20, photo_focal_y: 80, photo_zoom: 2 })
    f.load({ photo_focal_x: 0, photo_focal_y: 0, photo_zoom: 0 })
    expect(f.framing).toEqual({ x: 50, y: 50, zoom: 1, fit: false })
  })

  it('appends every sibling together, and resets', () => {
    const f = useFramingForm('image')
    Object.assign(f.framing, { x: 12.5, y: 0, zoom: 1.5, fit: true })
    const data = new FormData()
    f.appendTo(data)
    expect(Object.fromEntries(data.entries())).toEqual({
      image_focal_x: '12.5', image_focal_y: '0', image_zoom: '1.5', image_fit: 'true',
    })
    f.reset()
    expect(f.framing).toEqual({ x: 50, y: 50, zoom: 1, fit: false })
  })

  it('leaves the fit sibling out for a field that has none', () => {
    const data = new FormData()
    useFramingForm('image', { fit: false }).appendTo(data)
    expect([...data.keys()]).toEqual(['image_focal_x', 'image_focal_y', 'image_zoom'])
  })
})
