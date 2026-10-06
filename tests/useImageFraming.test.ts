import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useImageFraming } from '../composables/useImageFraming'

describe('useImageFraming', () => {
  it('builds the style from the sibling fields', () => {
    const rec = { photo: 'a.jpg', photo_focal_x: 30, photo_focal_y: 10, photo_zoom: 2 }
    expect(useImageFraming(rec, 'photo').style.value).toEqual({
      objectPosition: '30% 10%',
      transform: 'scale(2)',
      transformOrigin: '30% 10%',
    })
  })

  it('centre-crops a record with no framing, or no record at all', () => {
    expect(useImageFraming({ photo: 'a.jpg' }, 'photo').style.value).toEqual({ objectPosition: '50% 50%' })
    expect(useImageFraming(null, 'photo').style.value).toEqual({ objectPosition: '50% 50%' })
  })

  it('follows a record that changes', () => {
    const rec = ref<Record<string, any>>({ image: 'a.jpg' })
    const { style } = useImageFraming(rec, 'image')
    rec.value = { image: 'a.jpg', image_focal_x: 0, image_focal_y: 100, image_zoom: 1 }
    expect(style.value).toEqual({ objectPosition: '0% 100%' })
  })
})
