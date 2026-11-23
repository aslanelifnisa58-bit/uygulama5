import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import RichTextDisplay from '@/components/RichTextDisplay'
import AssignmentDetailClient from './AssignmentDetailClient'
import { ClipboardList, Calendar, Trophy, Clock } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AssignmentDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      course: {
        include: {
          teacher: { select: { id: true, name: true } },
          enrollments: {
            where: { status: 'APPROVED' },
            include: { student: { select: { id: true, name: true, email: true } } },
          },
        },
      },
      submissions: {
        include: { student: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!assignment) notFound()

  const isTeacher = session.role === 'TEACHER'
  const isCourseOwner = isTeacher && assignment.course.teacherId === session.userId

  // Check student access
  if (!isTeacher) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: session.userId, courseId: assignment.courseId } },
    })
    if (!enrollment || enrollment.status !== 'APPROVED') {
      redirect(`/courses/${assignment.courseId}`)
    }
  }

  const now = new Date()
  const isOpen = now < new Date(assignment.dueDate)
  const daysLeft = Math.ceil((new Date(assignment.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Student's own submission
  const mySubmission = !isTeacher
    ? assignment.submissions.find(s => s.student.id === session.userId) || null
    : null

  // Teacher: students who haven't submitted
  const submittedStudentIds = new Set(assignment.submissions.map(s => s.student.id))
  const notSubmittedStudents = isCourseOwner
    ? assignment.course.enrollments
        .map(e => e.student)
        .filter(s => !submittedStudentIds.has(s.id))
    : []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-academy-navy to-academy-blue rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList size={18} className="text-academy-gold" />
              <Link href={`/courses/${assignment.courseId}`} className="text-sm text-gray-300 hover:text-white">
                {assignment.course.title}
              </Link>
            </div>
            <h1 className="text-2xl font-bold mb-3">{assignment.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-200">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                Son: {new Date(assignment.dueDate).toLocaleString('tr-TR')}
              </span>
              <span className="flex items-center gap-1.5">
                <Trophy size={14} />
                Maks. {assignment.maxScore} puan
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${
              isOpen ? 'bg-green-500/30 text-green-100' : 'bg-red-500/30 text-red-100'
            }`}>
              <Clock size={13} />
              {isOpen ? `${daysLeft} gün kaldı` : 'Süresi Doldu'}
            </span>
          </div>
        </div>
      </div>

      {/* Assignment Description */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-academy-navy mb-4">Ödev Açıklaması</h2>
        <RichTextDisplay html={assignment.description} />
      </div>

      {/* Client-side submission/grading section */}
      <AssignmentDetailClient
        assignmentId={assignment.id}
        isOpen={isOpen}
        maxScore={assignment.maxScore}
        isCourseOwner={isCourseOwner}
        isTeacher={isTeacher}
        mySubmission={mySubmission ? {
          id: mySubmission.id,
          content: mySubmission.content,
          score: mySubmission.score,
          feedback: mySubmission.feedback,
        } : null}
        allSubmissions={isCourseOwner ? assignment.submissions.map(s => ({
          id: s.id,
          content: s.content,
          score: s.score,
          feedback: s.feedback,
          student: s.student,
          createdAt: s.createdAt,
        })) : []}
        notSubmittedStudents={notSubmittedStudents}
      />
    </div>
  )
}
