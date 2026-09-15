import { describe, it, expect } from 'vitest'
import {
  resolveToolbar,
  starterKitDisabledConfig,
  FULL_FEATURES,
} from '../utils/richEditorToolbar'

describe('resolveToolbar', () => {
  it('base only: bold, italic, link', () => {
    const { controls } = resolveToolbar({})
    expect(controls).toEqual(['bold', 'italic', 'link'])
  })

  it('adds decoration layer (underline, strike) in order', () => {
    const { controls } = resolveToolbar({ features: ['decoration'] })
    expect(controls).toEqual(['bold', 'italic', 'underline', 'strike', 'link'])
  })

  it('adds blocks and layout layers', () => {
    const { controls } = resolveToolbar({ features: ['blocks', 'layout'] })
    expect(controls).toEqual([
      'bold', 'italic', 'link',
      'h1', 'h2', 'h3', 'bulletList', 'orderedList', 'blockquote', 'horizontalRule',
      'alignLeft', 'alignCenter', 'alignRight',
    ])
  })

  it('remove subtracts a control', () => {
    const { controls } = resolveToolbar({ features: ['blocks'], remove: ['blockquote', 'horizontalRule'] })
    expect(controls).not.toContain('blockquote')
    expect(controls).not.toContain('horizontalRule')
    expect(controls).toContain('h1')
  })

  it('remove of an absent control is a no-op', () => {
    const base = resolveToolbar({})
    const removed = resolveToolbar({ remove: ['image'] })
    expect(removed.controls).toEqual(base.controls)
  })

  it('remove can drop a base control', () => {
    const { controls } = resolveToolbar({ remove: ['link'] })
    expect(controls).toEqual(['bold', 'italic'])
  })

  it("'full' expands to FULL_FEATURES", () => {
    expect(resolveToolbar({ features: 'full' }).controls)
      .toEqual(resolveToolbar({ features: FULL_FEATURES }).controls)
  })

  describe('footgun invariant: extensions follow surviving controls', () => {
    it('image off ⇒ no image extension', () => {
      expect(resolveToolbar({ features: ['blocks'] }).extensions.has('image')).toBe(false)
    })
    it('image on ⇒ image extension present', () => {
      expect(resolveToolbar({ features: ['image'] }).extensions.has('image')).toBe(true)
    })
    it('removing one heading keeps heading extension (siblings remain)', () => {
      expect(resolveToolbar({ features: ['blocks'], remove: ['h3'] }).extensions.has('heading')).toBe(true)
    })
    it('removing all headings drops heading extension', () => {
      const r = resolveToolbar({ features: ['blocks'], remove: ['h1', 'h2', 'h3'] })
      expect(r.extensions.has('heading')).toBe(false)
    })
    it('base always has bold/italic/link extensions', () => {
      const { extensions } = resolveToolbar({})
      expect([...extensions].sort()).toEqual(['bold', 'italic', 'link'])
    })
  })
})

describe('starterKitDisabledConfig', () => {
  it('disables StarterKit members not in the extension set, plus link', () => {
    const { extensions } = resolveToolbar({}) // base only
    const cfg = starterKitDisabledConfig(extensions)
    expect(cfg.link).toBe(false)
    expect(cfg.heading).toBe(false)
    expect(cfg.strike).toBe(false)
    expect(cfg.codeBlock).toBe(false)
    expect(cfg.bold).toBeUndefined() // bold is enabled, so not disabled
  })
  it('keeps a member enabled when its control survives', () => {
    const { extensions } = resolveToolbar({ features: ['blocks'] })
    const cfg = starterKitDisabledConfig(extensions)
    expect(cfg.heading).toBeUndefined()
    expect(cfg.blockquote).toBeUndefined()
  })
})
