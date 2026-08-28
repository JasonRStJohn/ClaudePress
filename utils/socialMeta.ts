// Pure, framework-free helpers for social/SEO metadata. Shared by CpSeoHead
// (runtime tags) and CpMetaField (admin validation bands) so the two never
// disagree about composed-title length or which fallback wins.

export type Band = 'green' | 'amber' | 'red'

export type SettingsLike = {
  social_title?: string
  social_description?: string
  tagline?: string
} | null

const SEP = ' — ' // U+2014 em dash, spaces both sides — the ONE separator

export function composedTitle(title: string, siteName: string): string {
  return title ? `${title}${SEP}${siteName}` : siteName
}

export function resolveShareTitle(
  propTitle: string | null | undefined,
  settings: SettingsLike,
): string {
  return propTitle || settings?.social_title || ''
}

export function resolveShareDescription(
  propDescription: string | null | undefined,
  settings: SettingsLike,
): string {
  return propDescription || settings?.social_description || settings?.tagline || ''
}

export function titleBand(composedLength: number): Band {
  if (composedLength <= 60) return 'green'
  if (composedLength <= 70) return 'amber'
  return 'red'
}

export function descriptionBand(length: number): Band {
  if (length >= 120 && length <= 125) return 'green'
  if (length < 80 || length > 150) return 'red'
  return 'amber'
}

export function altBand(alt: string): Band {
  return alt.trim().length > 0 ? 'green' : 'amber'
}

// og:image:width/height may only be declared for the bundled site card
// (the only image whose dimensions we know: 1200x630). A per-page image or a
// client-uploaded settings.og_image has unknown size, and an unresolved image
// must emit no dimensions at all.
export function shouldEmitCardDimensions(
  hasPropImage: boolean,
  hasSettingsOgImage: boolean,
  hasResolvedImage: boolean,
): boolean {
  return !hasPropImage && !hasSettingsOgImage && hasResolvedImage
}
