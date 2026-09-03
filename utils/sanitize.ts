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
    div: ['class'],
    span: ['class'],
    p: ['class'],
    h1: ['class'],
    h2: ['class'],
    h3: ['class'],
    h4: ['class'],
    h5: ['class'],
    h6: ['class'],
    ul: ['class'],
    ol: ['class'],
    li: ['class'],
    blockquote: ['class'],
    pre: ['class'],
    code: ['class'],
    table: ['class'],
    tr: ['class'],
    th: ['class'],
    td: ['class'],
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
