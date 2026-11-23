import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen, Bell, Calendar, TrendingUp,
  Clock, CheckCircle, AlertCircle, ChevronRight
} from 'lucide-react'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const isTeacher = session.role === 'TEACHER'

  if (isTeacher) {
    // Teacher dashboard
    const [myCourses, totalStudents, recentAnnouncements] = await Promise.all([
      prisma.course.findMany({
        where: { teacherId: session.userId },
        include: {
          _count: { select: { enrollments: true, assignments: true } },
          enrollments: { where: { status: 'PENDING' }, select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.enrollment.count({
        where: {
          course: { teacherId: session.userId },
          status: 'APPROVED',
        },
      }),
      prisma.announcement.findMany({
        where: { course: { teacherId: session.userId } },
        include: { course: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    const totalPending = myCourses.reduce((acc, c) => acc + c.enrollments.length, 0)

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-academy-navy">
            Hoş geldiniz, {session.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Derslerinizin genel durumuna bakın</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Aktif Derslerim"
            value={myCourses.length}
            icon={<BookOpen size={20} />}
            color="bg-academy-navy"
            href="/courses"
          />
          <StatCard
            label="Kayıtlı Öğrenci"
            value={totalStudents}
            icon={<TrendingUp size={20} />}
            color="bg-green-600"
          />
          <StatCard
            label="Bekleyen İstek"
            value={totalPending}
            icon={<AlertCircle size={20} />}
            color={totalPending > 0 ? 'bg-amber-500' : 'bg-gray-400'}
            href="/courses"
          />
        </div>

        {/* My Courses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-academy-navy">Derslerim</h2>
            <Link href="/courses/new" className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1">
              + Yeni Ders
            </Link>
          </div>
          {myCourses.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz ders oluşturmadınız.</p>
          ) : (
            <div className="space-y-3">
              {myCourses.map(course => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-academy-warm transition-colors group"
                >
                  <div>
                    <p className="font-medium text-academy-dark group-hover:text-primary-700">{course.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {course._count.enrollments} öğrenci · {course._count.assignments} ödev
                      {course.enrollments.length > 0 && (
                        <span className="ml-2 text-amber-600 font-medium">
                          {course.enrollments.length} bekleyen istek
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-primary-600" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-academy-navy mb-4">Son Duyurularım</h2>
          {recentAnnouncements.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz duyuru yayınlamadınız.</p>
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map(ann => (
                <div key={ann.id} className="flex items-start gap-3 p-3 rounded-lg bg-academy-warm">
                  <Bell size={15} className="text-primary-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-academy-dark">{ann.title}</p>
                    <p className="text-xs text-gray-500">
                      {ann.course.title} · {new Date(ann.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Student dashboard
  const [myEnrollments, announcements, upcomingAssignments] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId: session.userId, status: 'APPROVED' },
      include: {
        course: {
          include: {
            teacher: { select: { name: true } },
            assignments: {
              include: {
                submissions: { where: { studentId: session.userId }, select: { id: true } },
              },
            },
            _count: { select: { assignments: true } },
          },
        },
      },
    }),
    prisma.announcement.findMany({
      where: {
        course: {
          enrollments: {
            some: { studentId: session.userId, status: 'APPROVED' },
          },
        },
      },
      include: { course: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.assignment.findMany({
      where: {
        dueDate: { gte: new Date() },
        course: {
          enrollments: {
            some: { studentId: session.userId, status: 'APPROVED' },
          },
        },
      },
      include: {
        course: { select: { title: true } },
        submissions: { where: { studentId: session.userId }, select: { id: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-academy-navy">
          Hoş geldiniz, {session.name.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Öğrenim yolculuğunuza devam edin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Kayıtlı Dersler"
          value={myEnrollments.length}
          icon={<BookOpen size={20} />}
          color="bg-academy-navy"
          href="/courses"
        />
        <StatCard
          label="Yaklaşan Ödevler"
          value={upcomingAssignments.length}
          icon={<Calendar size={20} />}
          color="bg-primary-600"
          href="/calendar"
        />
        <StatCard
          label="Yeni Duyuru"
          value={announcements.length}
          icon={<Bell size={20} />}
          color="bg-green-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrolled Courses with Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-academy-navy">Derslerim</h2>
            <Link href="/courses" className="text-sm text-primary-600 hover:text-primary-800">
              Tümü →
            </Link>
          </div>
          {myEnrollments.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Henüz bir derse kayıt olmadınız.</p>
              <Link href="/courses" className="text-primary-600 text-sm hover:underline mt-1 inline-block">
                Derslere göz at →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myEnrollments.map(enr => {
                const total = enr.course.assignments.length
                const submitted = enr.course.assignments.filter(a => a.submissions.length > 0).length
                const pct = total === 0 ? 0 : Math.round((submitted / total) * 100)

                return (
                  <Link
                    key={enr.id}
                    href={`/courses/${enr.course.id}`}
                    className="block group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-academy-dark group-hover:text-primary-700">
                        {enr.course.title}
                      </span>
                      <span className="text-xs text-gray-500">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {submitted}/{total} ödev teslim edildi · {enr.course.teacher.name}
                    </p>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-academy-navy mb-4">Son Duyurular</h2>
          {announcements.length === 0 ? (
            <p className="text-gray-500 text-sm">Yeni duyuru yok.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map(ann => (
                <div key={ann.id} className="flex items-start gap-3 p-3 rounded-lg bg-academy-warm">
                  <Bell size={15} className="text-primary-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-academy-dark">{ann.title}</p>
                    <p className="text-xs text-gray-500">
                      {ann.course.title} · {new Date(ann.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Assignments */}
      {upcomingAssignments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-academy-navy">Yaklaşan Ödevler</h2>
            <Link href="/calendar" className="text-sm text-primary-600 hover:text-primary-800">
              Takvimi Gör →
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingAssignments.map(assignment => {
              const daysLeft = Math.ceil(
                (new Date(assignment.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              )
              const submitted = assignment.submissions.length > 0

              return (
                <Link
                  key={assignment.id}
                  href={`/assignments/${assignment.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-academy-warm transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {submitted ? (
                      <CheckCircle size={18} className="text-green-500 shrink-0" />
                    ) : (
                      <Clock size={18} className="text-amber-500 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-academy-dark group-hover:text-primary-700">
                        {assignment.title}
                      </p>
                      <p className="text-xs text-gray-500">{assignment.course.title}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {submitted ? (
                      <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                        Teslim edildi
                      </span>
                    ) : (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        daysLeft <= 2 ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'
                      }`}>
                        {daysLeft} gün kaldı
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label, value, icon, color, href
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  href?: string
}) {
  const content = (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`${color} text-white p-3 rounded-xl`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-academy-dark">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}
