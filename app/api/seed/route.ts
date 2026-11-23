import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('🌱 Seed API başlatılıyor...')
    const hashedPassword = await bcrypt.hash('Demo1234', 12)

    const teacher = await prisma.user.upsert({
      where: { email: 'ogretmen@demo.com' },
      update: {},
      create: {
        name: 'Dr. Ahmet Yılmaz',
        email: 'ogretmen@demo.com',
        password: hashedPassword,
        role: 'TEACHER',
        bio: '<p>Dijital tasarım ve oyun geliştirme alanında <strong>15 yıllık</strong> deneyime sahip akademisyen.</p>',
      },
    })

    const student = await prisma.user.upsert({
      where: { email: 'ogrenci@demo.com' },
      update: {},
      create: {
        name: 'Zeynep Kaya',
        email: 'ogrenci@demo.com',
        password: hashedPassword,
        role: 'STUDENT',
        bio: '<p>Oyun geliştirme tutkusu olan bilgisayar mühendisliği öğrencisi.</p>',
      },
    })

    const course1 = await prisma.course.upsert({
      where: { id: 'seed-course-001' },
      update: {},
      create: {
        id: 'seed-course-001',
        title: 'Unity ile 2D Oyun Geliştirme',
        description: 'Sıfırdan Unity 2D oyun motoru ile profesyonel oyun geliştirmeyi öğrenin.',
        content: '<h2>Derse Hoş Geldiniz!</h2><p>Bu kapsamlı kurs boyunca <strong>Unity oyun motoru</strong> ile 2D oyun geliştirmenin tüm inceliklerini öğreneceksiniz.</p><h3>Kurs İçeriği</h3><ul><li>Unity Editor\'e Giriş</li><li>C# Programlama</li><li>Fizik Sistemi</li><li>Animasyon</li><li>Yayınlama</li></ul>',
        teacherId: teacher.id,
      },
    })

    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: student.id, courseId: course1.id } },
      update: {},
      create: { studentId: student.id, courseId: course1.id, status: 'APPROVED' },
    })

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)

    await prisma.assignment.upsert({
      where: { id: 'seed-assignment-001' },
      update: {},
      create: {
        id: 'seed-assignment-001',
        title: 'Platform Oyunu Prototipi',
        description: '<h3>Ödev Açıklaması</h3><p>Unity kullanarak basit bir <strong>platform oyunu prototipi</strong> geliştirin.</p><ul><li>En az 3 platform</li><li>Oynanabilir karakter</li><li>Temel fizik sistemi</li></ul>',
        dueDate,
        maxScore: 100,
        courseId: course1.id,
      },
    })

    await prisma.announcement.upsert({
      where: { id: 'seed-announcement-001' },
      update: {},
      create: {
        id: 'seed-announcement-001',
        title: 'Hafta 3 Ders Materyalleri Güncellendi',
        content: '<p>Sevgili öğrenciler, <strong>yeni materyaller</strong> yüklendi. Proje son tarihi uzatıldı!</p>',
        courseId: course1.id,
        authorId: teacher.id,
      },
    })

    const course2 = await prisma.course.upsert({
      where: { id: 'seed-course-002' },
      update: {},
      create: {
        id: 'seed-course-002',
        title: 'UI/UX Tasarım Temelleri',
        description: 'Figma ve modern tasarım araçları kullanarak profesyonel kullanıcı arayüzleri tasarlamayı öğrenin.',
        content: '<h2>UI/UX Dünyasına Giriş</h2><p>Kullanıcı odaklı tasarım prensiplerini öğrenin.</p>',
        teacherId: teacher.id,
      },
    })

    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: student.id, courseId: course2.id } },
      update: {},
      create: { studentId: student.id, courseId: course2.id, status: 'PENDING' },
    })

    return NextResponse.json({
      success: true,
      message: 'Seed tamamlandı',
      data: { teacherEmail: teacher.email, studentEmail: student.email, coursesCreated: 2 }
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seed başarısız', detail: String(error) }, { status: 500 })
  }
}
