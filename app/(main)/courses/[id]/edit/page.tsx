import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import EditCourseForm from './EditCourseForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditCoursePage({ params }: Props) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'TEACHER') redirect(`/courses/${id}`)

  const course = await prisma.course.findUnique({ where: { id } })
  if (!course) notFound()
  if (course.teacherId !== session.userId) redirect(`/courses/${id}`)

  return <EditCourseForm course={course} />
}
