import { describe, it, expect } from 'vitest'
import {
  FRAMING_MAX_ZOOM,
  clampAxis,
  clampZoom,
  buildFramingMap,
  framingFields,
  framingMapField,
  framingStyle,
  isDefaultFraming,
  panFocal,
  readFileFraming,
  readFraming,
} from '../utils/focalPoint'

describe('clampAxis', () => {
  it('keeps in-range values and clamps the rest to 0..100', () => {
    expect(clampAxis(0)).toBe(0)
    expect(clampAxis(37.5)).toBe(37.5)
    expect(clampAxis(-10)).toBe(0)
    expect(clampAxis(140)).toBe(100)
  })

  it('centres on anything absent or non-numeric', () => {
    expect(clampAxis(undefined)).toBe(50)
    expect(clampAxis(null)).toBe(50)
    expect(clampAxis('')).toBe(50)
    expect(clampAxis('nope')).toBe(50)
    expect(clampAxis('25')).toBe(25)
  })
})

describe('clampZoom', () => {
  it('never zooms out past cover or in past the ceiling', () => {
    expect(clampZoom(1)).toBe(1)
    expect(clampZoom(2.2)).toBe(2.2)
    expect(clampZoom(0.5)).toBe(1)
    expect(clampZoom(99)).toBe(FRAMING_MAX_ZOOM)
  })

  it('treats absent, non-numeric and PocketBase empty-number 0 as no zoom', () => {
    expect(clampZoom(undefined)).toBe(1)
    expect(clampZoom(null)).toBe(1)
    expect(clampZoom('abc')).toBe(1)
    expect(clampZoom(0)).toBe(1)
  })
})

describe('framingStyle', () => {
  it('pans only when there is no zoom', () => {
    expect(framingStyle(20, 80, 1)).toEqual({ objectPosition: '20% 80%' })
  })

  it('zooms around the focal point', () => {
    expect(framingStyle(20, 80, 2)).toEqual({
      objectPosition: '20% 80%',
      transform: 'scale(2)',
      transformOrigin: '20% 80%',
    })
  })

  it('falls back to a plain centre crop for an un-framed image', () => {
    expect(framingStyle(undefined, undefined, undefined)).toEqual({ objectPosition: '50% 50%' })
  })
})

describe('fit (show the whole photo)', () => {
  it('switches the image to contain and ignores pan and zoom', () => {
    expect(framingStyle(10, 90, 2.5, true)).toEqual({ objectFit: 'contain', objectPosition: '50% 50%' })
  })

  it('is read from the `_fit` sibling of a single-file field', () => {
    const rec = { photo: 'a.jpg', photo_focal_x: 50, photo_focal_y: 50, photo_zoom: 1, photo_fit: true }
    expect(readFraming(rec, 'photo')).toEqual({ x: 50, y: 50, zoom: 1, fit: true })
  })

  it('is read per file, and makes a framing non-default', () => {
    const rec = { photo: ['a.jpg'], photo_framing: { 'a.jpg': { x: 50, y: 50, zoom: 1, fit: true } } }
    const f = readFileFraming(rec, 'photo', 'a.jpg')
    expect(f).toEqual({ x: 50, y: 50, zoom: 1, fit: true })
    expect(isDefaultFraming(f)).toBe(false)
  })

  it('is kept by buildFramingMap, and dropped when switched back off', () => {
    const map = buildFramingMap({
      before: ['a.jpg', 'b.jpg'],
      after: ['a.jpg', 'b.jpg'],
      existing: {
        'a.jpg': { x: 50, y: 50, zoom: 1, fit: true },
        'b.jpg': { x: 50, y: 50, zoom: 1, fit: false },
      },
      added: [],
    })
    expect(map).toEqual({ 'a.jpg': { x: 50, y: 50, zoom: 1, fit: true } })
  })
})

describe('framingFields', () => {
  it('derives the sibling field names from the image field', () => {
    expect(framingFields('sire_photo')).toEqual({
      x: 'sire_photo_focal_x',
      y: 'sire_photo_focal_y',
      zoom: 'sire_photo_zoom',
      fit: 'sire_photo_fit',
    })
  })
})

describe('readFraming', () => {
  it('reads framing by convention', () => {
    const rec = { photo: 'a.jpg', photo_focal_x: 10, photo_focal_y: 90, photo_zoom: 1.5 }
    expect(readFraming(rec, 'photo')).toEqual({ x: 10, y: 90, zoom: 1.5 })
  })

  it('defaults for a missing record or un-migrated fields', () => {
    expect(readFraming(null, 'photo')).toEqual({ x: 50, y: 50, zoom: 1 })
    expect(readFraming({ photo: 'a.jpg' }, 'photo')).toEqual({ x: 50, y: 50, zoom: 1 })
  })

  it('centres a record PocketBase has just migrated, where empty numbers read as 0', () => {
    const rec = { photo: 'a.jpg', photo_focal_x: 0, photo_focal_y: 0, photo_zoom: 0 }
    expect(readFraming(rec, 'photo')).toEqual({ x: 50, y: 50, zoom: 1 })
  })

  it('keeps a deliberate top-left focal point once framing has been saved', () => {
    const rec = { photo: 'a.jpg', photo_focal_x: 0, photo_focal_y: 0, photo_zoom: 1 }
    expect(readFraming(rec, 'photo')).toEqual({ x: 0, y: 0, zoom: 1 })
  })
})

describe('panFocal', () => {
  const frame = { width: 400, height: 300 }
  // 800x300 photo in a 4:3 frame: covers at 1x, 400px of sideways overflow.
  const wide = { width: 800, height: 300 }

  it('dragging the whole overflow moves the focal point end to end', () => {
    expect(panFocal({ x: 50, y: 50 }, 200, 0, frame, wide, 1)).toEqual({ x: 0, y: 50 })
    expect(panFocal({ x: 50, y: 50 }, -200, 0, frame, wide, 1)).toEqual({ x: 100, y: 50 })
  })

  it('dragging right lowers x, and the photo follows the pointer 1:1', () => {
    expect(panFocal({ x: 50, y: 50 }, 40, 0, frame, wide, 1).x).toBe(40)
  })

  it('leaves an axis with no overflow alone', () => {
    expect(panFocal({ x: 50, y: 50 }, 0, 80, frame, wide, 1).y).toBe(50)
  })

  it('zooming in opens up the other axis and lengthens the drag', () => {
    // At 2x: 1600x600 in 400x300 → 1200px sideways, 300px vertical overflow.
    expect(panFocal({ x: 50, y: 50 }, 120, 30, frame, wide, 2)).toEqual({ x: 40, y: 40 })
  })

  it('clamps at the edges and rounds to a tenth', () => {
    expect(panFocal({ x: 10, y: 50 }, 9999, 0, frame, wide, 1).x).toBe(0)
    expect(panFocal({ x: 50, y: 50 }, 1, 0, frame, wide, 1).x).toBe(49.8)
  })

  it('returns the start point until the photo and frame have a size', () => {
    const start = { x: 30, y: 70 }
    expect(panFocal(start, 50, 50, { width: 0, height: 0 }, wide, 1)).toEqual(start)
    expect(panFocal(start, 50, 50, frame, { width: 0, height: 0 }, 1)).toEqual(start)
  })
})

describe('multi-file framing', () => {
  const rec = {
    photo: ['a.jpg', 'b.jpg'],
    photo_framing: { 'a.jpg': { x: 10, y: 20, zoom: 2 }, 'gone.jpg': { x: 1, y: 1, zoom: 3 } },
  }

  it('names the JSON sibling field', () => {
    expect(framingMapField('photo')).toBe('photo_framing')
  })

  it('reads one file\'s framing, defaulting for files with none', () => {
    expect(readFileFraming(rec, 'photo', 'a.jpg')).toEqual({ x: 10, y: 20, zoom: 2 })
    expect(readFileFraming(rec, 'photo', 'b.jpg')).toEqual({ x: 50, y: 50, zoom: 1 })
  })

  it('tolerates a missing, null or malformed map', () => {
    expect(readFileFraming({ photo: ['a.jpg'] }, 'photo', 'a.jpg')).toEqual({ x: 50, y: 50, zoom: 1 })
    expect(readFileFraming({ photo_framing: null }, 'photo', 'a.jpg')).toEqual({ x: 50, y: 50, zoom: 1 })
    expect(readFileFraming({ photo_framing: 'oops' }, 'photo', 'a.jpg')).toEqual({ x: 50, y: 50, zoom: 1 })
    expect(readFileFraming({ photo_framing: { 'a.jpg': 7 } }, 'photo', 'a.jpg')).toEqual({ x: 50, y: 50, zoom: 1 })
  })

  it('knows an untouched framing from a set one', () => {
    expect(isDefaultFraming({ x: 50, y: 50, zoom: 1 })).toBe(true)
    expect(isDefaultFraming({ x: 50, y: 40, zoom: 1 })).toBe(false)
    expect(isDefaultFraming({ x: 50, y: 50, zoom: 1.2 })).toBe(false)
  })
})

describe('buildFramingMap', () => {
  const f = (x: number, y: number, zoom: number) => ({ x, y, zoom })

  it('keeps framing for kept files and drops removed ones', () => {
    const map = buildFramingMap({
      before: ['a.jpg', 'b.jpg'],
      after: ['a.jpg'],
      existing: { 'a.jpg': f(10, 20, 2), 'b.jpg': f(5, 5, 1) },
      added: [],
    })
    expect(map).toEqual({ 'a.jpg': f(10, 20, 2) })
  })

  it('assigns new uploads their framing in upload order, under the names PocketBase gave them', () => {
    const map = buildFramingMap({
      before: ['a.jpg'],
      after: ['a.jpg', 'new1_x9.jpg', 'new2_k2.jpg'],
      existing: {},
      added: [f(30, 30, 1), f(70, 10, 1.5)],
    })
    expect(map).toEqual({ 'new1_x9.jpg': f(30, 30, 1), 'new2_k2.jpg': f(70, 10, 1.5) })
  })

  it('stores nothing for files left at the default', () => {
    const map = buildFramingMap({
      before: [],
      after: ['n_1.jpg'],
      existing: {},
      added: [f(50, 50, 1)],
    })
    expect(map).toEqual({})
  })
})
