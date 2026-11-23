'use client'

import { useState, useTransition } from 'react'
import { updateProfileAction } from '@/app/actions/auth'
import RichTextEditor from '@/components/RichTextEditor'
import { Save, AlertCircle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  user: { name: string; bio: string }
}

export default function ProfileForm({ user }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [bio, setBio] = useState(user.bio)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setSuccess('')
    const formData = new FormData(e.currentTarget)
    formData.set('bio', bio)

    startTransition(async () => {
      const result = await updateProfileAction(formData)
      if (result?.error) setError(result.error)
      else { setSuccess('Profiliniz başarıyla güncellendi!'); router.refresh() }
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-academy-navy mb-4">Profili Düzenle</h2>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
          <CheckCircle size={16} /> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad Soyad *</label>
          <input
            type="text"
            name="name"
            defaultValue={user.name}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Hakkında</label>
          <RichTextEditor
            content={user.bio}
            onChange={setBio}
            placeholder="Kendinizden biraz bahsedin..."
            minHeight="150px"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-academy-navy hover:bg-academy-blue text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
        >
          <Save size={15} />
          {isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </form>
    </div>
  )
}
