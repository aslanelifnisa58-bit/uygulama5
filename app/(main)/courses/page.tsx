import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Users, Clock, CheckCircle, XCircle, PlusCircle } from 'lucide-react'

export default async function CoursesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const isTeacher = session.role === 'TEACHER'

  const courses = await prisma.course.findMany({
    include: {
      teacher: { select: { name: true } },
      _count: { select: { enrollments: { where: { status: 'APPROVED' } } } },
      enrollments: session.role === 'STUDENT'
        ? { where: { studentId: session.userId }, select: { status: true } }
        : false,
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-academy-navy">Dersler</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isTeacher ? 'Sistemdeki tüm dersleri yönetin' : 'Tüm mevcut dersleri görüntüleyin ve kayıt olun'}
          </p>
        </div>
        {isTeacher && (
          <Link
            href="/courses/new"
            className="flex items-center gap-2 bg-academy-navy hover:bg-academy-blue text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle size={16} />
            Yeni Ders
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-100">
          <BookOpen size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">Henüz ders bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map(course => {
            const enrollment = isTeacher ? null : (course.enrollments as { status: string }[])[0]
            const enrollStatus = enrollment?.status

            return (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col overflow-hidden group"
              >
                {/* Header strip */}
                <div className="h-2 bg-gradient-to-r from-academy-gold to-primary-500" />

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-academy-navy text-base leading-tight">
                      {course.title}
                    </h3>
                    {!isTeacher && enrollStatus && (
                      <EnrollBadge status={enrollStatus} />
                    )}
                  </div>

                  <p className="text-gray-500 text-sm leading-relaxed flex-1 line-clamp-3">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {course._count.enrollments} öğrenci
                    </span>
                    <span className="flex items-center gap-1 ml-auto">
                      <BookOpen size={12} />
                      {course.teacher.name}
                    </span>
                  </div>

                  <Link
                    href={`/courses/${course.id}`}
                    className="mt-3 block text-center bg-academy-warm hover:bg-primary-100 text-academy-navy font-medium py-2 rounded-lg text-sm transition-colors"
                  >
                    Derse Git →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EnrollBadge({ status }: { status: string }) {
  if (status === 'APPROVED') {
    return (
      <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full shrink-0">
        <CheckCircle size={11} />
        Kayıtlı
      </span>
    )
  }
  if (status === 'PENDING') {
    return (
      <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full shrink-0">
        <Clock size={11} />
        Onay Bekliyor
      </span>
    )
  }
  if (status === 'REJECTED') {
    return (
      <span className="flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full shrink-0">
        <XCircle size={11} />
        Reddedildi
      </span>
    )
  }
  return null
}
