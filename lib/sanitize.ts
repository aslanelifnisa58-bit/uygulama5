import DOMPurify from 'isomorphic-dompurify'

/**
 * HTML içeriğini XSS saldırılarına karşı sanitize eder.
 * Güvenli HTML etiketlerine izin verirken tehlikeli içerikleri temizler.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return ''
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'a', 'span', 'div',
      'hr',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
    ADD_ATTR: ['target'],
  })
}

/**
 * HTML içeriğinden düz metin elde eder (önizleme için).
 */
export function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}
