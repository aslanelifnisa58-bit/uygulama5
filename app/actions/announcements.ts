'use server'

import { prisma } from '@/lib/prisma'
import { requireTeacher } from '@/lib/session'
import { validateRequired } from '@/lib/validation'
import { revalidatePath } from 'next/cache'

export async function createAnnouncementAction(courseId: string, formData: FormData) {
  const session = await requireTeacher()

  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return { error: 'Ders bulunamadı.' }
  if (course.teacherId !== session.userId) return { error: 'Bu ders üzerinde yetkiniz yok.' }

  const title = formData.get('title') as string
  const content = formData.get('content') as string

  const titleError = validateRequired(title, 'Duyuru Başlığı')
  if (titleError) return { error: titleError }

  const contentError = validateRequired(content, 'Duyuru İçeriği')
  if (contentError) return { error: contentError }

  try {
    await prisma.announcement.create({
      data: {
        title: title.trim(),
        content,
        courseId,
        authorId: session.userId,
      },
    })

    revalidatePath(`/courses/${courseId}`)
    revalidatePath('/dashboard')
    return { success: true }
  } catch {
    return { error: 'Duyuru oluşturulurken bir hata oluştu.' }
  }
}

export async function updateAnnouncementAction(announcementId: string, formData: FormData) {
  const session = await requireTeacher()

  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
    include: { course: true },
  })

  if (!announcement) return { error: 'Duyuru bulunamadı.' }
  if (announcement.authorId !== session.userId) return { error: 'Bu duyuruyu düzenleme yetkiniz yok.' }

  const title = formData.get('title') as string
  const content = formData.get('content') as string

  const titleError = validateRequired(title, 'Duyuru Başlığı')
  if (titleError) return { error: titleError }

  const contentError = validateRequired(content, 'Duyuru İçeriği')
  if (contentError) return { error: contentError }

  try {
    await prisma.announcement.update({
      where: { id: announcementId },
      data: { title: title.trim(), content },
    })

    revalidatePath(`/courses/${announcement.courseId}`)
    revalidatePath('/dashboard')
    return { success: true }
  } catch {
    return { error: 'Duyuru güncellenirken bir hata oluştu.' }
  }
}

export async function deleteAnnouncementAction(announcementId: string) {
  const session = await requireTeacher()

  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
  })

  if (!announcement) return { error: 'Duyuru bulunamadı.' }
  if (announcement.authorId !== session.userId) return { error: 'Bu duyuruyu silme yetkiniz yok.' }

  try {
    await prisma.announcement.delete({ where: { id: announcementId } })
    revalidatePath(`/courses/${announcement.courseId}`)
    revalidatePath('/dashboard')
    return { success: true }
  } catch {
    return { error: 'Duyuru silinirken bir hata oluştu.' }
  }
}
