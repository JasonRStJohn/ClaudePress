import { describe, it, expect } from 'vitest'
import { sanitize } from '../utils/sanitize'

describe('sanitize — text alignment (allowed)', () => {
  it('keeps text-align:center on a paragraph', () => {
    const out = sanitize('<p style="text-align: center">hi</p>')
    expect(out).toContain('text-align:center')
  })
  it('keeps each of the four alignment keywords', () => {
    for (const v of ['left', 'right', 'center', 'justify']) {
      expect(sanitize(`<p style="text-align: ${v}">x</p>`)).toContain(`text-align:${v}`)
    }
  })
  it('keeps alignment on headings', () => {
    expect(sanitize('<h2 style="text-align: right">t</h2>')).toContain('text-align:right')
  })
})

describe('sanitize — the boundary holds (dangerous input stripped)', () => {
  it('strips a non-keyword text-align value', () => {
    const out = sanitize('<p style="text-align: url(javascript:alert(1))">x</p>')
    expect(out).not.toContain('javascript')
    expect(out).not.toMatch(/text-align:\s*url/)
  })
  it('strips other CSS properties even alongside a valid text-align', () => {
    const out = sanitize('<p style="text-align: center; position: fixed; background: url(//evil)">x</p>')
    expect(out).toContain('text-align:center')
    expect(out).not.toContain('position')
    expect(out).not.toContain('background')
    expect(out).not.toContain('evil')
  })
  it('strips event handlers', () => {
    expect(sanitize('<p onclick="alert(1)">x</p>')).not.toContain('onclick')
  })
  it('strips script tags', () => {
    expect(sanitize('<p>ok</p><script>alert(1)</script>')).not.toContain('<script')
  })
  it('strips javascript: hrefs', () => {
    expect(sanitize('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:')
  })
})

describe('sanitize — basics', () => {
  it('returns empty string for nullish input', () => {
    expect(sanitize(null)).toBe('')
    expect(sanitize(undefined)).toBe('')
  })
  it('preserves ordinary formatting', () => {
    const out = sanitize('<p><strong>a</strong> <em>b</em></p><ul><li>c</li></ul>')
    expect(out).toContain('<strong>')
    expect(out).toContain('<li>')
  })
})
