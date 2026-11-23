import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import RichTextDisplay from '@/components/RichTextDisplay'
import CourseActions from './CourseActions'
import EnrollmentSection from './EnrollmentSection'
import AssignmentsList from './AssignmentsList'
import AnnouncementsList from './AnnouncementsList'
import { BookOpen, User, Calendar, Users } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      enrollments: {
        include: {
          student: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      assignments: {
        include: {
          submissions: { where: { studentId: session.userId }, select: { id: true } },
          _count: { select: { submissions: true } },
        },
        orderBy: { dueDate: 'asc' },
      },
      announcements: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!course) notFound()

  const isTeacher = session.role === 'TEACHER'
  const isCourseOwner = isTeacher && course.teacherId === session.userId

  // Check student enrollment
  const studentEnrollment = !isTeacher
    ? course.enrollments.find(e => e.student.id === session.userId)
    : null
  const isApprovedStudent = studentEnrollment?.status === 'APPROVED'

  // Access control: only teacher-owner or approved students can see content
  const canSeeContent = isCourseOwner || isApprovedStudent

  // Students not enrolled
  const allStudents = isTeacher
    ? await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      })
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-academy-navy to-academy-blue rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={18} className="text-academy-gold" />
              <span className="text-sm text-gray-300">Ders</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
            <p className="text-gray-200 text-sm">{course.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-300">
              <span className="flex items-center gap-1.5">
                <User size={14} />
                {course.teacher.name}
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={14} />
                {course.enrollments.filter(e => e.status === 'APPROVED').length} kayıtlı öğrenci
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {new Date(course.createdAt).toLocaleDateString('tr-TR')}
              </span>
            </div>
          </div>
          
          {isCourseOwner && (
            <div className="flex gap-2">
              <Link
                href={`/courses/${course.id}/edit`}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Düzenle
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Enrollment action for students */}
      {!isTeacher && (
        <EnrollmentSection
          courseId={course.id}
          enrollment={studentEnrollment ? { id: studentEnrollment.id, status: studentEnrollment.status } : null}
          session={{ userId: session.userId, role: session.role }}
        />
      )}

      {/* Access restricted message */}
      {!canSeeContent && !isTeacher && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <BookOpen size={32} className="text-amber-400 mx-auto mb-3" />
          <h3 className="font-semibold text-amber-900 mb-1">İçerik Kilitli</h3>
          <p className="text-amber-700 text-sm">
            Ders içeriğini görmek için derse kayıt olmanız ve onaylanmanız gerekmektedir.
          </p>
        </div>
      )}

      {/* Course content */}
      {canSeeContent && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-academy-navy mb-4">Ders İçeriği</h2>
          <RichTextDisplay html={course.content} />
        </div>
      )}

      {/* Teacher: Enrollment Management */}
      {isCourseOwner && (
        <CourseActions
          course={course}
          allStudents={allStudents}
          session={{ userId: session.userId, role: session.role }}
        />
      )}

      {/* Assignments */}
      {canSeeContent && (
        <AssignmentsList
          assignments={course.assignments}
          courseId={course.id}
          isCourseOwner={isCourseOwner}
          studentId={session.userId}
        />
      )}

      {/* Announcements */}
      {canSeeContent && (
        <AnnouncementsList
          announcements={course.announcements}
          courseId={course.id}
          isCourseOwner={isCourseOwner}
        />
      )}
    </div>
  )
}
