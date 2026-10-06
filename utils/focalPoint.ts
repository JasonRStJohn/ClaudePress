// Image framing: a focal point plus zoom-in, stored as plain numbers beside
// the image field and applied in CSS. The uploaded file is never modified.
//
// For an image field `X` the record carries `X_focal_x`, `X_focal_y` (0–100,
// percent) and `X_zoom` (1 = cover, up to FRAMING_MAX_ZOOM). Anything absent
// or invalid collapses to 50/50/1, so an un-framed image centre-crops exactly
// like a plain `object-cover`.

// 3x rescues a small subject; past that even a decent phone photo goes soft.
export const FRAMING_MAX_ZOOM = 3

const toNumber = (v: unknown): number =>
  typeof v === 'number' ? v : v === '' || v == null ? NaN : Number(v)

export const clampAxis = (v: unknown): number => {
  const n = toNumber(v)
  if (!Number.isFinite(n)) return 50
  return Math.min(100, Math.max(0, n))
}

// PocketBase returns 0 for an empty number field, so 0 must mean "no zoom".
export const clampZoom = (v: unknown): number => {
  const n = toNumber(v)
  if (!Number.isFinite(n)) return 1
  return Math.min(FRAMING_MAX_ZOOM, Math.max(1, n))
}

export interface Framing {
  x: number
  y: number
  zoom: number
}

export interface FramingStyle {
  objectPosition: string
  transform?: string
  transformOrigin?: string
}

/**
 * CSS for an `object-cover` image that fills an `overflow-hidden` frame.
 * `object-position` puts the focal point at the same percentage of the frame,
 * so scaling from that origin zooms in on it rather than toward the centre.
 */
export const framingStyle = (x: unknown, y: unknown, zoom: unknown): FramingStyle => {
  const pos = `${clampAxis(x)}% ${clampAxis(y)}%`
  const z = clampZoom(zoom)
  if (z === 1) return { objectPosition: pos }
  return { objectPosition: pos, transform: `scale(${z})`, transformOrigin: pos }
}

export const framingFields = (field: string) => ({
  x: `${field}_focal_x`,
  y: `${field}_focal_y`,
  zoom: `${field}_zoom`,
})

export const readFraming = (
  record: Record<string, any> | null | undefined,
  field: string,
): Framing => {
  const f = framingFields(field)
  return {
    x: clampAxis(record?.[f.x]),
    y: clampAxis(record?.[f.y]),
    zoom: clampZoom(record?.[f.zoom]),
  }
}

/** Pointer position over the picker pad → focal point in whole percent. */
export const pointToFocal = (
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): { x: number; y: number } => {
  if (!rect.width || !rect.height) return { x: 50, y: 50 }
  return {
    x: Math.round(clampAxis(((clientX - rect.left) / rect.width) * 100)),
    y: Math.round(clampAxis(((clientY - rect.top) / rect.height) * 100)),
  }
}
