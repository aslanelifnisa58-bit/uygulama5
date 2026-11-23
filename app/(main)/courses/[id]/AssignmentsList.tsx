'use client'

import { useState, useTransition } from 'react'
import { createAssignmentAction, deleteAssignmentAction } from '@/app/actions/assignments'
import RichTextEditor from '@/components/RichTextEditor'
import { ClipboardList, PlusCircle, Trash2, ChevronRight, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Assignment {
  id: string
  title: string
  dueDate: Date
  maxScore: number
  submissions: { id: string }[]
  _count: { submissions: number }
}

interface Props {
  assignments: Assignment[]
  courseId: string
  isCourseOwner: boolean
  studentId: string
}

export default function AssignmentsList({ assignments, courseId, isCourseOwner, studentId }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [desc, setDesc] = useState('')

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('description', desc)

    startTransition(async () => {
      const result = await createAssignmentAction(courseId, formData)
      if (result?.error) setError(result.error)
      else { setShowForm(false); setDesc(''); router.refresh() }
    })
  }

  function handleDelete(assignmentId: string, title: string) {
    if (!confirm(`"${title}" ödevini silmek istediğinizden emin misiniz?`)) return
    startTransition(async () => {
      const result = await deleteAssignmentAction(assignmentId)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  const now = new Date()

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-academy-navy flex items-center gap-2">
          <ClipboardList size={18} className="text-primary-500" />
          Ödevler ({assignments.length})
        </h2>
        {isCourseOwner && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle size={15} />
            Ödev Ekle
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Add Assignment Form */}
      {showForm && isCourseOwner && (
        <form onSubmit={handleCreate} className="bg-academy-warm rounded-xl p-5 mb-5 space-y-4 border border-gray-200">
          <h3 className="font-semibold text-academy-navy text-sm">Yeni Ödev</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Başlık *</label>
            <input type="text" name="title" required placeholder="Ödev başlığı" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama *</label>
            <RichTextEditor onChange={setDesc} placeholder="Ödev açıklaması..." minHeight="150px" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Son Teslim Tarihi *</label>
              <input type="datetime-local" name="dueDate" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Maksimum Puan *</label>
              <input type="number" name="maxScore" min="1" required placeholder="100" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">İptal</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {isPending ? 'Oluşturuluyor...' : 'Ödev Ekle'}
            </button>
          </div>
        </form>
      )}

      {assignments.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">Henüz ödev eklenmemiş.</p>
      ) : (
        <div className="space-y-2">
          {assignments.map(a => {
            const isOpen = now < new Date(a.dueDate)
            const hasSubmission = a.submissions.length > 0

            return (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-academy-warm transition-colors group">
                <div className="shrink-0">
                  {hasSubmission ? (
                    <CheckCircle size={18} className="text-green-500" />
                  ) : isOpen ? (
                    <Clock size={18} className="text-primary-500" />
                  ) : (
                    <Clock size={18} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-academy-dark">{a.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isOpen ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {isOpen ? 'Açık' : 'Süresi Geçti'}
                    </span>
                    {isCourseOwner && (
                      <span className="text-xs text-gray-400">{a._count.submissions} teslim</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Son tarih: {new Date(a.dueDate).toLocaleString('tr-TR')} · Max {a.maxScore} puan
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/assignments/${a.id}`} className="text-xs text-primary-600 hover:text-primary-800 font-medium">
                    Detay
                  </Link>
                  {isCourseOwner && (
                    <button
                      onClick={() => handleDelete(a.id, a.title)}
                      disabled={isPending}
                      className="text-red-400 hover:text-red-600 p-1 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
