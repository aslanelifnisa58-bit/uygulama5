'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCourseAction } from '@/app/actions/courses'
import RichTextEditor from '@/components/RichTextEditor'
import { BookOpen, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function NewCoursePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [content, setContent] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('content', content)

    startTransition(async () => {
      const result = await createCourseAction(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.courseId) {
        router.push(`/courses/${result.courseId}`)
      }
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-academy-navy p-2.5 rounded-xl">
          <BookOpen size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-academy-navy">Yeni Ders Oluştur</h1>
          <p className="text-gray-500 text-sm">Öğrencileriniz için yeni bir ders içeriği hazırlayın</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Ders Başlığı <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            placeholder="Örn: Unity ile 2D Oyun Geliştirme"
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Kısa Açıklama <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="description"
            placeholder="Dersin amacı ve kapsamını kısaca açıklayın"
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Ders İçeriği <span className="text-red-500">*</span>
          </label>
          <RichTextEditor
            onChange={setContent}
            placeholder="Ders içeriğini buraya yazın. Başlıklar, listeler ve kalın metin kullanabilirsiniz..."
            minHeight="300px"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/courses"
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 bg-academy-navy hover:bg-academy-blue text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            {isPending ? 'Oluşturuluyor...' : 'Dersi Oluştur'}
          </button>
        </div>
      </form>
    </div>
  )
}
