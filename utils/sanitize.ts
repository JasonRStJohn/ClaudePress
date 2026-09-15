import sanitizeHtml from 'sanitize-html'

// Allow-list for CMS-authored HTML rendered into the page.
// The point is to keep formatting while removing anything executable.
export const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr', 'div', 'span',
    'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'small',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel', 'class'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'class'],
    // 'style' is permitted only on block elements that can carry text
    // alignment; allowedStyles (below) filters it down to text-align keywords,
    // so no other CSS property survives.
    div: ['class', 'style'],
    span: ['class'],
    p: ['class', 'style'],
    h1: ['class', 'style'],
    h2: ['class', 'style'],
    h3: ['class', 'style'],
    h4: ['class', 'style'],
    h5: ['class', 'style'],
    h6: ['class', 'style'],
    ul: ['class'],
    ol: ['class'],
    li: ['class', 'style'],
    blockquote: ['class', 'style'],
    pre: ['class'],
    code: ['class'],
    table: ['class'],
    tr: ['class'],
    th: ['class'],
    td: ['class'],
  },
  // Only text alignment is allowed through the style attribute, and only the
  // four keyword values TipTap's TextAlign emits. Everything else (position,
  // background, expression(), url(), etc.) is stripped — a text-align keyword
  // carries no injection vector, so this stays a hard boundary, not a hole.
  allowedStyles: {
    '*': {
      'text-align': [/^(left|right|center|justify)$/],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: attribs.target
        ? { ...attribs, rel: 'noopener noreferrer' }
        : attribs,
    }),
  },
}

export const sanitize = (html?: string | null): string =>
  html ? sanitizeHtml(html, SANITIZE_OPTIONS) : ''
