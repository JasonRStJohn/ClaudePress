import { describe, it, expect } from 'vitest'
import {
  composedTitle,
  resolveShareTitle,
  resolveShareDescription,
  titleBand,
  descriptionBand,
  altBand,
} from '../utils/socialMeta'

describe('composedTitle', () => {
  it('joins title and site name with an em dash', () => {
    expect(composedTitle('Preservation breeder sites', 'PawPress at Infinity Graphics'))
      .toBe('Preservation breeder sites — PawPress at Infinity Graphics')
  })
  it('is just the site name when the title is empty', () => {
    expect(composedTitle('', 'Infinity Graphics')).toBe('Infinity Graphics')
  })
})

describe('resolveShareTitle / resolveShareDescription precedence', () => {
  it('title prefers the prop, then settings.social_title, then empty', () => {
    expect(resolveShareTitle('Prop', { social_title: 'S' })).toBe('Prop')
    expect(resolveShareTitle('', { social_title: 'S' })).toBe('S')
    expect(resolveShareTitle(null, null)).toBe('')
  })
  it('description prefers prop, then social_description, then tagline', () => {
    expect(resolveShareDescription('P', { social_description: 'S', tagline: 'T' })).toBe('P')
    expect(resolveShareDescription('', { social_description: 'S', tagline: 'T' })).toBe('S')
    expect(resolveShareDescription('', { tagline: 'T' })).toBe('T')
    expect(resolveShareDescription('', null)).toBe('')
  })
})

describe('titleBand (composed length)', () => {
  it('green at <=60, amber 61-70, red >70', () => {
    expect(titleBand(58)).toBe('green')
    expect(titleBand(60)).toBe('green')
    expect(titleBand(61)).toBe('amber')
    expect(titleBand(70)).toBe('amber')
    expect(titleBand(71)).toBe('red')
  })
})

describe('descriptionBand', () => {
  it('green only in the 120-125 overlap', () => {
    expect(descriptionBand(120)).toBe('green')
    expect(descriptionBand(125)).toBe('green')
  })
  it('amber for 80-119 and 126-150', () => {
    expect(descriptionBand(80)).toBe('amber')
    expect(descriptionBand(119)).toBe('amber')
    expect(descriptionBand(126)).toBe('amber')
    expect(descriptionBand(150)).toBe('amber')
  })
  it('red below 80 or above 150', () => {
    expect(descriptionBand(0)).toBe('red')
    expect(descriptionBand(79)).toBe('red')
    expect(descriptionBand(151)).toBe('red')
  })
})

describe('altBand', () => {
  it('green when present, amber when blank', () => {
    expect(altBand('A dog at a show')).toBe('green')
    expect(altBand('   ')).toBe('amber')
    expect(altBand('')).toBe('amber')
  })
})
