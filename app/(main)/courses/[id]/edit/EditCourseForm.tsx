'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateCourseAction } from '@/app/actions/courses'
import RichTextEditor from '@/components/RichTextEditor'
import { AlertCircle, BookOpen } from 'lucide-react'
import Link from 'next/link'

interface Props {
  course: {
    id: string
    title: string
    description: string
    content: string
  }
}

export default function EditCourseForm({ course }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [content, setContent] = useState(course.content)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('content', content)

    startTransition(async () => {
      const result = await updateCourseAction(course.id, formData)
      if (result?.error) setError(result.error)
      else router.push(`/courses/${course.id}`)
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary-600 p-2.5 rounded-xl">
          <BookOpen size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-academy-navy">Dersi Düzenle</h1>
          <p className="text-gray-500 text-sm">Ders bilgilerini güncelleyin</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ders Başlığı *</label>
          <input type="text" name="title" defaultValue={course.title} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Kısa Açıklama *</label>
          <input type="text" name="description" defaultValue={course.description} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ders İçeriği *</label>
          <RichTextEditor content={course.content} onChange={setContent} minHeight="300px" />
        </div>
        <div className="flex gap-3 pt-2">
          <Link href={`/courses/${course.id}`} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">İptal</Link>
          <button type="submit" disabled={isPending} className="px-5 py-2.5 bg-academy-navy hover:bg-academy-blue text-white rounded-lg text-sm font-medium disabled:opacity-60">
            {isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      </form>
    </div>
  )
}
