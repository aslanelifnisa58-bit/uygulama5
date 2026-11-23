import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const Role = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
}

const EnrollmentStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
}

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seed işlemi başlıyor...')

  // Demo öğretmen oluştur
  const hashedPassword = await bcrypt.hash('Demo1234', 12)

  const teacher = await prisma.user.upsert({
    where: { email: 'ogretmen@demo.com' },
    update: {},
    create: {
      name: 'Dr. Ahmet Yılmaz',
      email: 'ogretmen@demo.com',
      password: hashedPassword,
      role: Role.TEACHER,
      bio: '<p>Dijital tasarım ve oyun geliştirme alanında <strong>15 yıllık</strong> deneyime sahip akademisyen. Unity, Unreal Engine ve web tabanlı oyun teknolojileri konusunda uzmanlaşmıştır.</p>',
    },
  })
  console.log('✅ Demo öğretmen oluşturuldu:', teacher.email)

  // Demo öğrenci oluştur
  const student = await prisma.user.upsert({
    where: { email: 'ogrenci@demo.com' },
    update: {},
    create: {
      name: 'Zeynep Kaya',
      email: 'ogrenci@demo.com',
      password: hashedPassword,
      role: Role.STUDENT,
      bio: '<p>Oyun geliştirme tutkusu olan <em>3. sınıf</em> bilgisayar mühendisliği öğrencisi. Indie oyun geliştirme projelerinde aktif olarak çalışmaktadır.</p>',
    },
  })
  console.log('✅ Demo öğrenci oluşturuldu:', student.email)

  // Birinci ders: Demo öğrenci APPROVED olarak kayıtlı
  const course1 = await prisma.course.upsert({
    where: { id: 'seed-course-001' },
    update: {},
    create: {
      id: 'seed-course-001',
      title: 'Unity ile 2D Oyun Geliştirme',
      description: 'Sıfırdan Unity 2D oyun motoru ile profesyonel oyun geliştirmeyi öğrenin. C# programlama, fizik sistemi, animasyon ve yayınlama süreçleri.',
      content: `<h2>Derse Hoş Geldiniz!</h2>
<p>Bu kapsamlı kurs boyunca <strong>Unity oyun motoru</strong> ile 2D oyun geliştirmenin tüm inceliklerini öğreneceksiniz.</p>
<h3>Kurs İçeriği</h3>
<ul>
  <li>Unity Editor'e Giriş ve Temel Kavramlar</li>
  <li>C# ile Oyun Programlamaya Başlangıç</li>
  <li>Sprite ve Animasyon Sistemleri</li>
  <li>Fizik Motoru (Rigidbody, Collider)</li>
  <li>Kullanıcı Arayüzü (UI) Tasarımı</li>
  <li>Ses ve Efekt Sistemleri</li>
  <li>Oyun Yayınlama (Build & Deploy)</li>
</ul>
<h3>Ön Koşullar</h3>
<p>Bu kursa başlamadan önce temel <em>programlama mantığı</em> bilgisine sahip olmanız önerilir. Nesne yönelimli programlama (OOP) kavramlarına aşinalık kursu daha verimli takip etmenizi sağlayacaktır.</p>
<blockquote><strong>Not:</strong> Kurs materyalleri her hafta güncellenmektedir. Duyuruları takip etmeyi unutmayın!</blockquote>`,
      teacherId: teacher.id,
      isActive: true,
    },
  })
  console.log('✅ Birinci ders oluşturuldu:', course1.title)

  // Kayıt: Zeynep → Ders 1 (APPROVED)
  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: student.id, courseId: course1.id } },
    update: {},
    create: {
      studentId: student.id,
      courseId: course1.id,
      status: EnrollmentStatus.APPROVED,
    },
  })
  console.log('✅ Öğrenci ders 1\'e APPROVED olarak kaydedildi')

  // Ödev: Ders 1'de son teslim tarihi geçmemiş ödev
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 14) // 2 hafta sonra

  const assignment = await prisma.assignment.upsert({
    where: { id: 'seed-assignment-001' },
    update: {},
    create: {
      id: 'seed-assignment-001',
      title: 'Platform Oyunu Prototipi',
      description: `<h3>Ödev Açıklaması</h3>
<p>Bu ödevde Unity kullanarak basit bir <strong>platform oyunu prototipi</strong> geliştirmeniz beklenmektedir.</p>
<h4>Gereksinimler</h4>
<ul>
  <li>En az <strong>3 platform</strong> ve <strong>1 oynanabilir karakter</strong> içermelidir</li>
  <li>Temel fizik sistemi (yerçekimi, zıplama) uygulanmalıdır</li>
  <li>Basit bir <em>skor sistemi</em> veya <em>toplanabilir nesne</em> eklenmelidir</li>
  <li>Oyun başlangıç ve bitiş ekranları tasarlanmalıdır</li>
</ul>
<h4>Teslim Formatı</h4>
<p>Projenizi <strong>GitHub</strong> reposuna yükleyerek bağlantıyı bu alana yapıştırın. Ek olarak, oynanış videosu veya ekran görüntüleri de ekleyebilirsiniz.</p>
<blockquote>⚠️ <strong>Dikkat:</strong> Son teslim tarihinden sonra gönderilen ödevler değerlendirmeye alınmayacaktır.</blockquote>`,
      dueDate: dueDate,
      maxScore: 100,
      courseId: course1.id,
    },
  })
  console.log('✅ Örnek ödev oluşturuldu:', assignment.title)

  // Duyuru: Ders 1'de bir duyuru
  await prisma.announcement.upsert({
    where: { id: 'seed-announcement-001' },
    update: {},
    create: {
      id: 'seed-announcement-001',
      title: 'Hafta 3 Ders Materyalleri Güncellendi',
      content: `<p>Sevgili öğrenciler,</p>
<p>Bu haftanın ders materyalleri <strong>güncellendi</strong>. Lütfen aşağıdaki değişikliklere dikkat edin:</p>
<ul>
  <li>Animasyon sistemi ile ilgili bölüm genişletildi</li>
  <li>Yeni pratik alıştırmalar eklendi</li>
  <li><strong>Proje ödevi son teslim tarihi</strong> 2 hafta uzatıldı</li>
</ul>
<p>Sorularınız için ders içindeki yorum bölümünü kullanabilirsiniz. <em>Başarılar dilerim!</em></p>
<p>— Dr. Ahmet Yılmaz</p>`,
      courseId: course1.id,
      authorId: teacher.id,
    },
  })
  console.log('✅ Örnek duyuru oluşturuldu')

  // İkinci ders: Demo öğrenci PENDING olarak kayıtlı
  const course2 = await prisma.course.upsert({
    where: { id: 'seed-course-002' },
    update: {},
    create: {
      id: 'seed-course-002',
      title: 'UI/UX Tasarım Temelleri',
      description: 'Figma ve modern tasarım araçları kullanarak profesyonel kullanıcı arayüzleri ve deneyimleri tasarlamayı öğrenin.',
      content: `<h2>UI/UX Tasarım Dünyasına Giriş</h2>
<p>Bu kursta <strong>kullanıcı odaklı tasarım</strong> prensiplerini ve modern araçları kullanmayı öğreneceksiniz.</p>
<h3>Kapsanan Konular</h3>
<ul>
  <li>Tasarım Temel İlkeleri (Renk, Tipografi, Hizalama)</li>
  <li>Figma ile Wireframe ve Prototip Oluşturma</li>
  <li>Kullanıcı Araştırması ve Persona Oluşturma</li>
  <li>Erişilebilirlik (Accessibility) Standartları</li>
  <li>Responsive Tasarım Yaklaşımları</li>
</ul>`,
      teacherId: teacher.id,
      isActive: true,
    },
  })
  console.log('✅ İkinci ders oluşturuldu:', course2.title)

  // Kayıt: Zeynep → Ders 2 (PENDING)
  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: student.id, courseId: course2.id } },
    update: {},
    create: {
      studentId: student.id,
      courseId: course2.id,
      status: EnrollmentStatus.PENDING,
    },
  })
  console.log('✅ Öğrenci ders 2\'ye PENDING olarak kaydedildi')

  // Üçüncü ders: Kayıtsız
  await prisma.course.upsert({
    where: { id: 'seed-course-003' },
    update: {},
    create: {
      id: 'seed-course-003',
      title: 'Blender ile 3D Modelleme',
      description: 'Açık kaynaklı 3D yazılımı Blender kullanarak oyun ve animasyon için profesyonel 3D modeller oluşturun.',
      content: `<h2>3D Modelleme Temelleri</h2>
<p>Blender, dünyanın en popüler <strong>açık kaynaklı 3D yazılımlarından</strong> biridir.</p>
<h3>Bu Kursta Ne Öğreneceksiniz?</h3>
<ul>
  <li>Blender Arayüzüne Giriş</li>
  <li>Temel 3D Modelleme Teknikleri</li>
  <li>Materyal ve Doku Uygulaması</li>
  <li>Işıklandırma ve Render</li>
  <li>Animasyon Temelleri</li>
</ul>`,
      teacherId: teacher.id,
      isActive: true,
    },
  })
  console.log('✅ Üçüncü ders oluşturuldu')

  console.log('✨ Seed işlemi başarıyla tamamlandı!')
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
