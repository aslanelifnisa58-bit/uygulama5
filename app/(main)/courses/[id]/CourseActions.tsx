'use client'

import { useState, useTransition } from 'react'
import {
  updateEnrollmentStatusAction,
  addStudentToCourseAction,
  removeStudentFromCourseAction,
  deleteCourseAction,
} from '@/app/actions/courses'
import { CheckCircle, XCircle, UserPlus, UserMinus, Trash2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Enrollment {
  id: string
  status: string
  student: { id: string; name: string; email: string }
}

interface Course {
  id: string
  title: string
  enrollments: Enrollment[]
}

interface Props {
  course: Course
  allStudents: { id: string; name: string; email: string }[]
  session: { userId: string; role: string }
}

export default function CourseActions({ course, allStudents, session }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')

  const pendingEnrollments = course.enrollments.filter(e => e.status === 'PENDING')
  const approvedEnrollments = course.enrollments.filter(e => e.status === 'APPROVED')
  const enrolledStudentIds = new Set(course.enrollments.map(e => e.student.id))
  const availableStudents = allStudents.filter(s => !enrolledStudentIds.has(s.id))

  function handleStatus(enrollmentId: string, status: 'APPROVED' | 'REJECTED') {
    startTransition(async () => {
      const result = await updateEnrollmentStatusAction(enrollmentId, status)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  function handleAddStudent() {
    if (!selectedStudentId) return
    startTransition(async () => {
      const result = await addStudentToCourseAction(course.id, selectedStudentId)
      if (result?.error) setError(result.error)
      else { setSelectedStudentId(''); router.refresh() }
    })
  }

  function handleRemoveStudent(studentId: string) {
    startTransition(async () => {
      const result = await removeStudentFromCourseAction(course.id, studentId)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  function handleDeleteCourse() {
    if (!confirm(`"${course.title}" dersini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) return
    startTransition(async () => {
      const result = await deleteCourseAction(course.id)
      if (result?.error) setError(result.error)
      else router.push('/courses')
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Pending Requests */}
      {pendingEnrollments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6">
          <h3 className="font-semibold text-academy-navy mb-4 flex items-center gap-2">
            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingEnrollments.length}</span>
            Bekleyen Kayıt İstekleri
          </h3>
          <div className="space-y-2">
            {pendingEnrollments.map(enr => (
              <div key={enr.id} className="flex items-center justify-between gap-3 p-3 bg-amber-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{enr.student.name}</p>
                  <p className="text-xs text-gray-500">{enr.student.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatus(enr.id, 'APPROVED')}
                    disabled={isPending}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
                  >
                    <CheckCircle size={13} /> Onayla
                  </button>
                  <button
                    onClick={() => handleStatus(enr.id, 'REJECTED')}
                    disabled={isPending}
                    className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
                  >
                    <XCircle size={13} /> Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrolled Students */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-academy-navy">
            Kayıtlı Öğrenciler ({approvedEnrollments.length})
          </h3>

          {/* Add student */}
          {availableStudents.length > 0 && (
            <div className="flex gap-2">
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-400"
              >
                <option value="">Öğrenci seç...</option>
                {availableStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                onClick={handleAddStudent}
                disabled={!selectedStudentId || isPending}
                className="flex items-center gap-1 bg-academy-navy hover:bg-academy-blue text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
              >
                <UserPlus size={13} /> Ekle
              </button>
            </div>
          )}
        </div>

        {approvedEnrollments.length === 0 ? (
          <p className="text-gray-400 text-sm">Henüz onaylı öğrenci yok.</p>
        ) : (
          <div className="space-y-2">
            {approvedEnrollments.map(enr => (
              <div key={enr.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-academy-gold rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {enr.student.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{enr.student.name}</p>
                    <p className="text-xs text-gray-500">{enr.student.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveStudent(enr.student.id)}
                  disabled={isPending}
                  className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"
                  title="Dersten çıkar"
                >
                  <UserMinus size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5">
        <h3 className="font-semibold text-red-700 mb-3 text-sm">Tehlikeli Bölge</h3>
        <button
          onClick={handleDeleteCourse}
          disabled={isPending}
          className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
        >
          <Trash2 size={15} />
          Dersi Sil
        </button>
        <p className="text-xs text-gray-400 mt-2">Bu işlem geri alınamaz. Derse bağlı tüm ödevler ve duyurular silinir.</p>
      </div>
    </div>
  )
}
