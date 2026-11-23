'use client'

import { useState, useTransition } from 'react'
import {
  enrollCourseAction,
  withdrawEnrollmentAction,
} from '@/app/actions/courses'
import { CheckCircle, Clock, XCircle, LogOut, Send } from 'lucide-react'

interface Props {
  courseId: string
  enrollment: { id: string; status: string } | null
  session: { userId: string; role: string }
}

export default function EnrollmentSection({ courseId, enrollment, session }: Props) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function handleEnroll() {
    setMessage('')
    setError('')
    startTransition(async () => {
      const result = await enrollCourseAction(courseId)
      if (result?.error) setError(result.error)
      else setMessage(result?.message || 'İstek gönderildi.')
    })
  }

  function handleWithdraw() {
    setMessage('')
    setError('')
    startTransition(async () => {
      const result = await withdrawEnrollmentAction(courseId)
      if (result?.error) setError(result.error)
      else setMessage('Derse kayıt iptal edildi.')
    })
  }

  const status = enrollment?.status

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {status === 'APPROVED' && (
            <span className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
              <CheckCircle size={14} />
              Bu derse kayıtlısınız
            </span>
          )}
          {status === 'PENDING' && (
            <span className="flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full">
              <Clock size={14} />
              Kayıt isteğiniz onay bekliyor
            </span>
          )}
          {status === 'REJECTED' && (
            <span className="flex items-center gap-1.5 text-sm text-red-700 bg-red-50 px-3 py-1.5 rounded-full">
              <XCircle size={14} />
              Kayıt isteğiniz reddedildi
            </span>
          )}
          {!status && (
            <span className="text-sm text-gray-500">Bu derse kayıtlı değilsiniz</span>
          )}
        </div>

        <div className="flex gap-2">
          {(!status || status === 'REJECTED') && (
            <button
              onClick={handleEnroll}
              disabled={isPending}
              className="flex items-center gap-1.5 bg-academy-navy hover:bg-academy-blue text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            >
              <Send size={14} />
              Katılma İsteği Gönder
            </button>
          )}
          {(status === 'PENDING' || status === 'APPROVED') && (
            <button
              onClick={handleWithdraw}
              disabled={isPending}
              className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            >
              <LogOut size={14} />
              {status === 'APPROVED' ? 'Dersten Ayrıl' : 'İsteği Geri Çek'}
            </button>
          )}
        </div>
      </div>

      {message && <p className="text-green-700 text-sm mt-2">{message}</p>}
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  )
}
