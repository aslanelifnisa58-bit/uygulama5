'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  submitAssignmentAction,
  updateSubmissionAction,
  withdrawSubmissionAction,
  gradeSubmissionAction,
} from '@/app/actions/assignments'
import RichTextEditor from '@/components/RichTextEditor'
import RichTextDisplay from '@/components/RichTextDisplay'
import { Send, Edit, Trash2, Star, AlertCircle, CheckCircle, Users, XCircle } from 'lucide-react'

interface Submission {
  id: string
  content: string
  score: number | null
  feedback: string | null
  student?: { id: string; name: string; email: string }
  createdAt?: Date
}

interface Props {
  assignmentId: string
  isOpen: boolean
  maxScore: number
  isCourseOwner: boolean
  isTeacher: boolean
  mySubmission: Omit<Submission, 'student' | 'createdAt'> | null
  allSubmissions: Submission[]
  notSubmittedStudents: { id: string; name: string; email: string }[]
}

export default function AssignmentDetailClient({
  assignmentId,
  isOpen,
  maxScore,
  isCourseOwner,
  isTeacher,
  mySubmission,
  allSubmissions,
  notSubmittedStudents,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitContent, setSubmitContent] = useState('')
  const [editContent, setEditContent] = useState(mySubmission?.content || '')
  const [isEditing, setIsEditing] = useState(false)
  const [gradingId, setGradingId] = useState<string | null>(null)
  const [gradeContent, setGradeContent] = useState('')

  function handleSubmit() {
    setError(''); setSuccess('')
    const formData = new FormData()
    formData.set('content', submitContent)
    startTransition(async () => {
      const result = await submitAssignmentAction(assignmentId, formData)
      if (result?.error) setError(result.error)
      else { setSuccess('Ödeviniz başarıyla teslim edildi!'); router.refresh() }
    })
  }

  function handleUpdate() {
    setError(''); setSuccess('')
    if (!mySubmission) return
    const formData = new FormData()
    formData.set('content', editContent)
    startTransition(async () => {
      const result = await updateSubmissionAction(mySubmission.id, formData)
      if (result?.error) setError(result.error)
      else { setIsEditing(false); setSuccess('Tesliminiz güncellendi.'); router.refresh() }
    })
  }

  function handleWithdraw() {
    if (!mySubmission || !confirm('Tesliminizi geri çekmek istediğinizden emin misiniz?')) return
    startTransition(async () => {
      const result = await withdrawSubmissionAction(mySubmission.id)
      if (result?.error) setError(result.error)
      else { setSuccess('Tesliminiz geri çekildi.'); router.refresh() }
    })
  }

  function handleGrade(submissionId: string, scoreStr: string) {
    setError('')
    const formData = new FormData()
    formData.set('score', scoreStr)
    formData.set('feedback', gradeContent)
    startTransition(async () => {
      const result = await gradeSubmissionAction(submissionId, formData)
      if (result?.error) setError(result.error)
      else { setGradingId(null); setGradeContent(''); setSuccess('Not verildi!'); router.refresh() }
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {/* Student: submit/view section */}
      {!isTeacher && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-academy-navy mb-4">Tesliminiz</h2>

          {!mySubmission ? (
            isOpen ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Henüz teslim yapmadınız. Yanıtınızı yazın ve gönderin.</p>
                <RichTextEditor onChange={setSubmitContent} placeholder="Ödev yanıtınızı buraya yazın..." minHeight="200px" />
                <button onClick={handleSubmit} disabled={isPending} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60">
                  <Send size={15} /> {isPending ? 'Gönderiliyor...' : 'Teslim Et'}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <XCircle size={32} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Ödevin süresi doldu ve teslim yapmadınız.</p>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {mySubmission.score !== null && (
                <div className="bg-academy-warm border border-primary-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={18} className="text-academy-gold" />
                    <span className="font-bold text-academy-navy text-lg">{mySubmission.score} / {maxScore}</span>
                    <span className="text-sm text-gray-500">puan aldınız</span>
                  </div>
                  {mySubmission.feedback && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Öğretmen Geri Bildirimi:</p>
                      <RichTextDisplay html={mySubmission.feedback} />
                    </div>
                  )}
                </div>
              )}

              {isEditing ? (
                <div className="space-y-3">
                  <RichTextEditor content={editContent} onChange={setEditContent} minHeight="200px" />
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">İptal</button>
                    <button onClick={handleUpdate} disabled={isPending} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-60">
                      {isPending ? 'Kaydediliyor...' : 'Güncelle'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <RichTextDisplay html={mySubmission.content} className="bg-gray-50 rounded-lg p-4 border border-gray-100" />
                  {mySubmission.score === null && isOpen && (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm">
                        <Edit size={14} /> Düzenle
                      </button>
                      <button onClick={handleWithdraw} disabled={isPending} className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm">
                        <Trash2 size={14} /> Geri Çek
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Teacher: all submissions */}
      {isCourseOwner && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-academy-navy mb-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-green-500" />
              Teslim Edenler ({allSubmissions.length})
            </h2>
            {allSubmissions.length === 0 ? (
              <p className="text-gray-400 text-sm">Henüz teslim yapan öğrenci yok.</p>
            ) : (
              <div className="space-y-4">
                {allSubmissions.map(sub => (
                  <div key={sub.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-sm">{sub.student?.name}</p>
                        <p className="text-xs text-gray-400">{sub.student?.email}</p>
                      </div>
                      {sub.score !== null && (
                        <span className="bg-academy-gold/20 text-academy-gold font-bold px-3 py-1 rounded-full text-sm">
                          {sub.score}/{maxScore}
                        </span>
                      )}
                    </div>
                    <RichTextDisplay html={sub.content} className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-3 text-sm" />

                    {gradingId === sub.id ? (
                      <div className="space-y-3 mt-3 border-t border-gray-100 pt-3">
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium text-gray-700">Puan (0-{maxScore}):</label>
                          <input
                            id={`score-${sub.id}`}
                            type="number"
                            min="0"
                            max={maxScore}
                            defaultValue={sub.score ?? ''}
                            className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Geri Bildirim:</p>
                          <RichTextEditor onChange={setGradeContent} content={sub.feedback || ''} minHeight="120px" placeholder="Öğrenciye geri bildirim yazın..." />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setGradingId(null)} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm">İptal</button>
                          <button
                            onClick={() => {
                              const scoreInput = document.getElementById(`score-${sub.id}`) as HTMLInputElement
                              handleGrade(sub.id, scoreInput.value)
                            }}
                            disabled={isPending}
                            className="px-3 py-1.5 bg-academy-gold hover:bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-60"
                          >
                            {isPending ? 'Kaydediliyor...' : 'Not Ver'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setGradingId(sub.id); setGradeContent(sub.feedback || '') }}
                        className="flex items-center gap-1.5 bg-academy-gold/20 hover:bg-academy-gold/30 text-amber-800 px-3 py-1.5 rounded-lg text-sm font-medium"
                      >
                        <Star size={13} />
                        {sub.score !== null ? 'Notu Güncelle' : 'Not Ver'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {notSubmittedStudents.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
              <h2 className="text-lg font-semibold text-academy-navy mb-4 flex items-center gap-2">
                <Users size={18} className="text-orange-500" />
                Teslim Etmeyenler ({notSubmittedStudents.length})
              </h2>
              <div className="space-y-2">
                {notSubmittedStudents.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-2.5 bg-orange-50 rounded-lg">
                    <div className="w-7 h-7 bg-orange-200 rounded-full flex items-center justify-center text-orange-800 text-xs font-bold">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
