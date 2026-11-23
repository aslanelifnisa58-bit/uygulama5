'use client'

import { useState, useTransition } from 'react'
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  updateAnnouncementAction,
} from '@/app/actions/announcements'
import RichTextEditor from '@/components/RichTextEditor'
import RichTextDisplay from '@/components/RichTextDisplay'
import { Bell, PlusCircle, Trash2, Edit, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Announcement {
  id: string
  title: string
  content: string
  createdAt: Date
  author: { name: string }
}

interface Props {
  announcements: Announcement[]
  courseId: string
  isCourseOwner: boolean
}

export default function AnnouncementsList({ announcements, courseId, isCourseOwner }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [content, setContent] = useState('')
  const [editContent, setEditContent] = useState('')

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('content', content)
    startTransition(async () => {
      const result = await createAnnouncementAction(courseId, formData)
      if (result?.error) setError(result.error)
      else { setShowForm(false); setContent(''); router.refresh() }
    })
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>, announcementId: string) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('content', editContent)
    startTransition(async () => {
      const result = await updateAnnouncementAction(announcementId, formData)
      if (result?.error) setError(result.error)
      else { setEditId(null); router.refresh() }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) return
    startTransition(async () => {
      const result = await deleteAnnouncementAction(id)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-academy-navy flex items-center gap-2">
          <Bell size={18} className="text-primary-500" />
          Duyurular ({announcements.length})
        </h2>
        {isCourseOwner && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle size={15} />
            Duyuru Ekle
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {showForm && isCourseOwner && (
        <form onSubmit={handleCreate} className="bg-academy-warm rounded-xl p-5 mb-5 space-y-4 border border-gray-200">
          <h3 className="font-semibold text-academy-navy text-sm">Yeni Duyuru</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Başlık *</label>
            <input type="text" name="title" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">İçerik *</label>
            <RichTextEditor onChange={setContent} placeholder="Duyuru içeriği..." minHeight="150px" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">İptal</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {isPending ? 'Yayınlanıyor...' : 'Duyuru Ekle'}
            </button>
          </div>
        </form>
      )}

      {announcements.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">Henüz duyuru yok.</p>
      ) : (
        <div className="space-y-4">
          {announcements.map(ann => (
            <div key={ann.id} className="border border-gray-100 rounded-xl p-4">
              {editId === ann.id ? (
                <form onSubmit={(e) => handleUpdate(e, ann.id)} className="space-y-3">
                  <input type="text" name="title" defaultValue={ann.title} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                  <RichTextEditor content={ann.content} onChange={setEditContent} minHeight="150px" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditId(null)} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm">İptal</button>
                    <button type="submit" disabled={isPending} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm disabled:opacity-60">Kaydet</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h4 className="font-semibold text-academy-navy">{ann.title}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {ann.author.name} · {new Date(ann.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    {isCourseOwner && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => { setEditId(ann.id); setEditContent(ann.content) }}
                          className="text-gray-400 hover:text-primary-600 p-1.5 rounded transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(ann.id)}
                          disabled={isPending}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <RichTextDisplay html={ann.content} />
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
