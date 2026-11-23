'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth, requireTeacher } from '@/lib/session'
import { validateRequired, validatePositiveInt, validateFutureDate } from '@/lib/validation'
import { revalidatePath } from 'next/cache'

export async function createAssignmentAction(courseId: string, formData: FormData) {
  const session = await requireTeacher()

  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return { error: 'Ders bulunamadı.' }
  if (course.teacherId !== session.userId) return { error: 'Bu ders üzerinde yetkiniz yok.' }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const dueDate = formData.get('dueDate') as string
  const maxScore = formData.get('maxScore') as string

  const titleError = validateRequired(title, 'Ödev Başlığı')
  if (titleError) return { error: titleError }

  const descError = validateRequired(description, 'Ödev Açıklaması')
  if (descError) return { error: descError }

  const dateError = validateFutureDate(dueDate, 'Son Teslim Tarihi')
  if (dateError) return { error: dateError }

  const scoreError = validatePositiveInt(maxScore, 'Maksimum Puan')
  if (scoreError) return { error: scoreError }

  try {
    const assignment = await prisma.assignment.create({
      data: {
        title: title.trim(),
        description,
        dueDate: new Date(dueDate),
        maxScore: parseInt(maxScore),
        courseId,
      },
    })

    revalidatePath(`/courses/${courseId}`)
    return { success: true, assignmentId: assignment.id }
  } catch {
    return { error: 'Ödev oluşturulurken bir hata oluştu.' }
  }
}

export async function updateAssignmentAction(assignmentId: string, formData: FormData) {
  const session = await requireTeacher()

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: true },
  })
  if (!assignment) return { error: 'Ödev bulunamadı.' }
  if (assignment.course.teacherId !== session.userId) return { error: 'Bu ödev üzerinde yetkiniz yok.' }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const dueDate = formData.get('dueDate') as string
  const maxScore = formData.get('maxScore') as string

  const titleError = validateRequired(title, 'Ödev Başlığı')
  if (titleError) return { error: titleError }

  const descError = validateRequired(description, 'Ödev Açıklaması')
  if (descError) return { error: descError }

  const date = new Date(dueDate)
  if (isNaN(date.getTime())) return { error: 'Son Teslim Tarihi geçerli bir tarih olmalıdır.' }

  const scoreError = validatePositiveInt(maxScore, 'Maksimum Puan')
  if (scoreError) return { error: scoreError }

  try {
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        title: title.trim(),
        description,
        dueDate: new Date(dueDate),
        maxScore: parseInt(maxScore),
      },
    })

    revalidatePath(`/courses/${assignment.courseId}`)
    revalidatePath(`/assignments/${assignmentId}`)
    return { success: true }
  } catch {
    return { error: 'Ödev güncellenirken bir hata oluştu.' }
  }
}

export async function deleteAssignmentAction(assignmentId: string) {
  const session = await requireTeacher()

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: true },
  })
  if (!assignment) return { error: 'Ödev bulunamadı.' }
  if (assignment.course.teacherId !== session.userId) return { error: 'Bu ödevi silme yetkiniz yok.' }

  try {
    await prisma.assignment.delete({ where: { id: assignmentId } })
    revalidatePath(`/courses/${assignment.courseId}`)
    return { success: true, courseId: assignment.courseId }
  } catch {
    return { error: 'Ödev silinirken bir hata oluştu.' }
  }
}

export async function submitAssignmentAction(assignmentId: string, formData: FormData) {
  const session = await requireAuth()

  if (session.role !== 'STUDENT') {
    return { error: 'Yalnızca öğrenciler ödev teslim edebilir.' }
  }

  const content = formData.get('content') as string
  const contentError = validateRequired(content, 'Teslim İçeriği')
  if (contentError) return { error: contentError }

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: true },
  })
  if (!assignment) return { error: 'Ödev bulunamadı.' }

  // Son teslim tarihi kontrolü
  if (new Date() > assignment.dueDate) {
    return { error: 'Ödevin son teslim tarihi geçmiş, teslim edilemez.' }
  }

  // Kayıt kontrolü
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId: session.userId, courseId: assignment.courseId },
    },
  })
  if (!enrollment || enrollment.status !== 'APPROVED') {
    return { error: 'Bu derse kayıtlı değilsiniz.' }
  }

  // Tekrar teslim kontrolü
  const existing = await prisma.submission.findUnique({
    where: { studentId_assignmentId: { studentId: session.userId, assignmentId } },
  })
  if (existing) {
    return { error: 'Bu ödeve zaten teslim yaptınız. Düzenlemek için teslim sayfanızı kullanın.' }
  }

  try {
    await prisma.submission.create({
      data: {
        content,
        studentId: session.userId,
        assignmentId,
      },
    })

    revalidatePath(`/assignments/${assignmentId}`)
    return { success: true }
  } catch {
    return { error: 'Teslim sırasında bir hata oluştu.' }
  }
}

export async function updateSubmissionAction(submissionId: string, formData: FormData) {
  const session = await requireAuth()

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { assignment: true },
  })

  if (!submission) return { error: 'Teslim bulunamadı.' }
  if (submission.studentId !== session.userId) return { error: 'Bu teslim size ait değil.' }

  // Not verildiyse düzenlenemez
  if (submission.score !== null) {
    return { error: 'Notlandırılmış bir teslimi düzenleyemezsiniz.' }
  }

  // Son tarih geçtiyse düzenlenemez
  if (new Date() > submission.assignment.dueDate) {
    return { error: 'Ödevin son teslim tarihi geçmiş, düzenleme yapılamaz.' }
  }

  const content = formData.get('content') as string
  const contentError = validateRequired(content, 'Teslim İçeriği')
  if (contentError) return { error: contentError }

  try {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { content },
    })

    revalidatePath(`/assignments/${submission.assignmentId}`)
    return { success: true }
  } catch {
    return { error: 'Teslim güncellenirken bir hata oluştu.' }
  }
}

export async function withdrawSubmissionAction(submissionId: string) {
  const session = await requireAuth()

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { assignment: true },
  })

  if (!submission) return { error: 'Teslim bulunamadı.' }
  if (submission.studentId !== session.userId) return { error: 'Bu teslim size ait değil.' }

  if (submission.score !== null) {
    return { error: 'Notlandırılmış bir teslimi geri çekemezsiniz.' }
  }

  if (new Date() > submission.assignment.dueDate) {
    return { error: 'Ödevin son teslim tarihi geçmiş, geri çekme yapılamaz.' }
  }

  try {
    await prisma.submission.delete({ where: { id: submissionId } })
    revalidatePath(`/assignments/${submission.assignmentId}`)
    return { success: true }
  } catch {
    return { error: 'Teslim geri çekilirken bir hata oluştu.' }
  }
}

export async function gradeSubmissionAction(submissionId: string, formData: FormData) {
  const session = await requireTeacher()

  const scoreStr = formData.get('score') as string
  const feedback = formData.get('feedback') as string

  const score = parseInt(scoreStr)
  if (isNaN(score) || score < 0) {
    return { error: 'Geçerli bir puan giriniz (0 veya daha büyük).' }
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { assignment: { include: { course: true } } },
  })

  if (!submission) return { error: 'Teslim bulunamadı.' }
  if (submission.assignment.course.teacherId !== session.userId) {
    return { error: 'Bu teslimi notlandırma yetkiniz yok.' }
  }

  if (score > submission.assignment.maxScore) {
    return { error: `Puan, maksimum değer olan ${submission.assignment.maxScore}'i aşamaz.` }
  }

  try {
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        score,
        feedback: feedback || null,
      },
    })

    revalidatePath(`/assignments/${submission.assignmentId}`)
    return { success: true }
  } catch {
    return { error: 'Notlandırma sırasında bir hata oluştu.' }
  }
}
