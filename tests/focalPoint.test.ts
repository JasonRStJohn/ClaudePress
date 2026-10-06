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
  pointToFocal,
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

describe('framingFields', () => {
  it('derives the sibling field names from the image field', () => {
    expect(framingFields('sire_photo')).toEqual({
      x: 'sire_photo_focal_x',
      y: 'sire_photo_focal_y',
      zoom: 'sire_photo_zoom',
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
})

describe('pointToFocal', () => {
  const rect = { left: 100, top: 50, width: 200, height: 400 }

  it('maps a pointer position to whole percentages of the pad', () => {
    expect(pointToFocal(150, 350, rect)).toEqual({ x: 25, y: 75 })
  })

  it('clamps a drag that leaves the pad', () => {
    expect(pointToFocal(0, 9999, rect)).toEqual({ x: 0, y: 100 })
  })

  it('centres when the pad has no size yet', () => {
    expect(pointToFocal(10, 10, { left: 0, top: 0, width: 0, height: 0 })).toEqual({ x: 50, y: 50 })
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
