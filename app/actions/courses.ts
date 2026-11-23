'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth, requireTeacher } from '@/lib/session'
import { validateRequired } from '@/lib/validation'
import { revalidatePath } from 'next/cache'

export async function createCourseAction(formData: FormData) {
  const session = await requireTeacher()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const content = formData.get('content') as string

  const titleError = validateRequired(title, 'Ders Başlığı')
  if (titleError) return { error: titleError }

  const descError = validateRequired(description, 'Kısa Açıklama')
  if (descError) return { error: descError }

  const contentError = validateRequired(content, 'Ders İçeriği')
  if (contentError) return { error: contentError }

  try {
    const course = await prisma.course.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        content,
        teacherId: session.userId,
      },
    })

    revalidatePath('/courses')
    return { success: true, courseId: course.id }
  } catch {
    return { error: 'Ders oluşturulurken bir hata oluştu.' }
  }
}

export async function updateCourseAction(courseId: string, formData: FormData) {
  const session = await requireTeacher()

  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return { error: 'Ders bulunamadı.' }
  if (course.teacherId !== session.userId) return { error: 'Bu dersi düzenleme yetkiniz yok.' }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const content = formData.get('content') as string

  const titleError = validateRequired(title, 'Ders Başlığı')
  if (titleError) return { error: titleError }

  const descError = validateRequired(description, 'Kısa Açıklama')
  if (descError) return { error: descError }

  const contentError = validateRequired(content, 'Ders İçeriği')
  if (contentError) return { error: contentError }

  try {
    await prisma.course.update({
      where: { id: courseId },
      data: {
        title: title.trim(),
        description: description.trim(),
        content,
      },
    })

    revalidatePath(`/courses/${courseId}`)
    revalidatePath('/courses')
    return { success: true }
  } catch {
    return { error: 'Ders güncellenirken bir hata oluştu.' }
  }
}

export async function deleteCourseAction(courseId: string) {
  const session = await requireTeacher()

  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return { error: 'Ders bulunamadı.' }
  if (course.teacherId !== session.userId) return { error: 'Bu dersi silme yetkiniz yok.' }

  try {
    await prisma.course.delete({ where: { id: courseId } })
    revalidatePath('/courses')
    return { success: true }
  } catch {
    return { error: 'Ders silinirken bir hata oluştu.' }
  }
}

export async function enrollCourseAction(courseId: string) {
  const session = await requireAuth()

  if (session.role !== 'STUDENT') {
    return { error: 'Yalnızca öğrenciler derse kayıt olabilir.' }
  }

  const existing = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: session.userId, courseId } },
  })

  if (existing) {
    if (existing.status === 'PENDING') return { error: 'Zaten kayıt isteği gönderdiniz, onay bekleniyor.' }
    if (existing.status === 'APPROVED') return { error: 'Bu derse zaten kayıtlısınız.' }
    if (existing.status === 'REJECTED') {
      // Reddedilmiş isteği tekrar gönder
      await prisma.enrollment.update({
        where: { id: existing.id },
        data: { status: 'PENDING' },
      })
      revalidatePath('/courses')
      return { success: true, message: 'Kayıt isteğiniz yeniden gönderildi.' }
    }
  }

  try {
    await prisma.enrollment.create({
      data: {
        studentId: session.userId,
        courseId,
        status: 'PENDING',
      },
    })

    revalidatePath('/courses')
    revalidatePath(`/courses/${courseId}`)
    return { success: true, message: 'Kayıt isteğiniz gönderildi.' }
  } catch {
    return { error: 'Kayıt isteği gönderilirken bir hata oluştu.' }
  }
}

export async function withdrawEnrollmentAction(courseId: string) {
  const session = await requireAuth()

  try {
    await prisma.enrollment.deleteMany({
      where: {
        studentId: session.userId,
        courseId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    })

    revalidatePath('/courses')
    revalidatePath(`/courses/${courseId}`)
    return { success: true }
  } catch {
    return { error: 'İşlem sırasında bir hata oluştu.' }
  }
}

export async function updateEnrollmentStatusAction(
  enrollmentId: string,
  status: 'APPROVED' | 'REJECTED'
) {
  const session = await requireTeacher()

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true },
  })

  if (!enrollment) return { error: 'Kayıt bulunamadı.' }
  if (enrollment.course.teacherId !== session.userId) {
    return { error: 'Bu kayıt üzerinde yetkiniz yok.' }
  }

  try {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status },
    })

    revalidatePath(`/courses/${enrollment.courseId}`)
    return { success: true }
  } catch {
    return { error: 'Kayıt durumu güncellenirken bir hata oluştu.' }
  }
}

export async function addStudentToCourseAction(courseId: string, studentId: string) {
  const session = await requireTeacher()

  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return { error: 'Ders bulunamadı.' }
  if (course.teacherId !== session.userId) return { error: 'Bu ders üzerinde yetkiniz yok.' }

  const student = await prisma.user.findUnique({ where: { id: studentId } })
  if (!student || student.role !== 'STUDENT') return { error: 'Geçerli bir öğrenci bulunamadı.' }

  try {
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId, courseId } },
      update: { status: 'APPROVED' },
      create: { studentId, courseId, status: 'APPROVED' },
    })

    revalidatePath(`/courses/${courseId}`)
    return { success: true }
  } catch {
    return { error: 'Öğrenci eklenirken bir hata oluştu.' }
  }
}

export async function removeStudentFromCourseAction(courseId: string, studentId: string) {
  const session = await requireTeacher()

  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return { error: 'Ders bulunamadı.' }
  if (course.teacherId !== session.userId) return { error: 'Bu ders üzerinde yetkiniz yok.' }

  try {
    await prisma.enrollment.deleteMany({
      where: { studentId, courseId },
    })

    revalidatePath(`/courses/${courseId}`)
    return { success: true }
  } catch {
    return { error: 'Öğrenci çıkarılırken bir hata oluştu.' }
  }
}
