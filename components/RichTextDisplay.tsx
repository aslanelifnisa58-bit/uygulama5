'use client'

import { sanitizeHtml } from '@/lib/sanitize'

interface RichTextDisplayProps {
  html: string
  className?: string
}

export default function RichTextDisplay({ html, className = '' }: RichTextDisplayProps) {
  const sanitized = sanitizeHtml(html)
  
  return (
    <div
      className={`tiptap-content ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
