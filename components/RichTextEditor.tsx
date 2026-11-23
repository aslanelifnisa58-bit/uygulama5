'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { useCallback } from 'react'
import {
  Bold, Italic, List, ListOrdered, Heading2, Heading3,
  Link as LinkIcon, Quote, Code, Undo, Redo, Minus
} from 'lucide-react'

interface RichTextEditorProps {
  content?: string
  onChange?: (html: string) => void
  placeholder?: string
  name?: string
  readOnly?: boolean
  minHeight?: string
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  title: string
  children: React.ReactNode
  disabled?: boolean
}

function ToolbarButton({ onClick, isActive, title, children, disabled }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded text-sm transition-colors ${
        isActive
          ? 'bg-primary-600 text-white'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
}

export default function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'İçerik giriniz...',
  name,
  readOnly = false,
  minHeight = '200px',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
    },
    editorProps: {
      attributes: {
        class: 'outline-none',
        'data-placeholder': placeholder,
      },
    },
  })

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL giriniz:', previousUrl)

    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  const html = editor.getHTML()

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary-400 focus-within:border-primary-400 transition-all">
      {!readOnly && (
        <div className="flex flex-wrap gap-0.5 p-2 bg-gray-50 border-b border-gray-200">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Kalın (Ctrl+B)"
          >
            <Bold size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="İtalik (Ctrl+I)"
          >
            <Italic size={15} />
          </ToolbarButton>
          
          <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Başlık 2"
          >
            <Heading2 size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Başlık 3"
          >
            <Heading3 size={15} />
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Madde İşaretli Liste"
          >
            <List size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numaralı Liste"
          >
            <ListOrdered size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Alıntı"
          >
            <Quote size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Kod"
          >
            <Code size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive('link')}
            title="Bağlantı Ekle"
          >
            <LinkIcon size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Yatay Çizgi"
          >
            <Minus size={15} />
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Geri Al (Ctrl+Z)"
          >
            <Undo size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Yeniden Yap (Ctrl+Y)"
          >
            <Redo size={15} />
          </ToolbarButton>
        </div>
      )}

      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>

      {/* Hidden input for form submission */}
      {name && (
        <input type="hidden" name={name} value={html} />
      )}
    </div>
  )
}
