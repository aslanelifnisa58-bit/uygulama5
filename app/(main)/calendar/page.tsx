import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Calendar, Clock, CheckCircle, XCircle, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default async function CalendarPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'STUDENT') redirect('/dashboard')

  const assignments = await prisma.assignment.findMany({
    where: {
      course: {
        enrollments: {
          some: { studentId: session.userId, status: 'APPROVED' },
        },
      },
    },
    include: {
      course: { select: { title: true, id: true } },
      submissions: { where: { studentId: session.userId }, select: { id: true, score: true } },
    },
    orderBy: { dueDate: 'asc' },
  })

  const now = new Date()

  const upcoming = assignments.filter(a => new Date(a.dueDate) >= now)
  const overdue = assignments.filter(a => new Date(a.dueDate) < now)

  function getDaysLeft(dueDate: Date) {
    const diff = new Date(dueDate).getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (days > 0) return `${days} gün kaldı`
    if (hours > 0) return `${hours} saat kaldı`
    return 'Bugün son gün!'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-academy-navy flex items-center gap-2">
          <Calendar size={24} className="text-primary-500" />
          Ödev Takvimi
        </h1>
        <p className="text-gray-500 text-sm mt-1">Tüm ödevlerinizin son teslim tarihlerini ve durumlarını görüntüleyin</p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard label="Toplam Ödev" value={assignments.length} color="bg-academy-navy" />
        <SummaryCard label="Yaklaşan" value={upcoming.length} color="bg-primary-500" />
        <SummaryCard
          label="Teslim Edildi"
          value={assignments.filter(a => a.submissions.length > 0).length}
          color="bg-green-600"
        />
        <SummaryCard
          label="Kaçırıldı"
          value={overdue.filter(a => a.submissions.length === 0).length}
          color="bg-red-500"
        />
      </div>

      {/* Upcoming Assignments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-academy-navy mb-4 flex items-center gap-2">
          <Clock size={18} className="text-primary-500" />
          Yaklaşan Ödevler ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">Yaklaşan ödev bulunmuyor. 🎉</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map(a => {
              const submitted = a.submissions.length > 0
              const daysLeft = Math.ceil((new Date(a.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              const urgency = daysLeft <= 1 ? 'border-red-200 bg-red-50' : daysLeft <= 3 ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50'

              return (
                <Link
                  key={a.id}
                  href={`/assignments/${a.id}`}
                  className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${urgency} hover:shadow-sm transition-all group`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                      submitted ? 'bg-green-500' : daysLeft <= 1 ? 'bg-red-500' : daysLeft <= 3 ? 'bg-amber-500' : 'bg-primary-500'
                    }`}>
                      {submitted ? '✓' : daysLeft <= 1 ? '!' : daysLeft}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-academy-dark group-hover:text-primary-700">{a.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <BookOpen size={10} /> {a.course.title}
                        </span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-500">
                          {new Date(a.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {submitted ? (
                      <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                        <CheckCircle size={12} /> Teslim edildi
                      </span>
                    ) : (
                      <span className={`text-xs font-medium ${daysLeft <= 1 ? 'text-red-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-primary-600'}`}>
                        {getDaysLeft(a.dueDate)}
                      </span>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">Max {a.maxScore} puan</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Past/Overdue Assignments */}
      {overdue.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-academy-navy mb-4 flex items-center gap-2">
            <XCircle size={18} className="text-red-400" />
            Geçmiş Ödevler ({overdue.length})
          </h2>
          <div className="space-y-2">
            {overdue.map(a => {
              const submitted = a.submissions.length > 0
              const grade = a.submissions[0]?.score

              return (
                <Link
                  key={a.id}
                  href={`/assignments/${a.id}`}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {submitted ? (
                      <CheckCircle size={18} className="text-green-500 shrink-0" />
                    ) : (
                      <XCircle size={18} className="text-red-400 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-700 group-hover:text-primary-700">{a.title}</p>
                      <p className="text-xs text-gray-400">{a.course.title} · {new Date(a.dueDate).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {submitted ? (
                      grade !== null && grade !== undefined ? (
                        <span className="text-sm font-bold text-academy-gold">{grade}/{a.maxScore}</span>
                      ) : (
                        <span className="text-xs text-green-600">Notlama bekleniyor</span>
                      )
                    ) : (
                      <span className="text-xs text-red-500">Teslim edilmedi</span>
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

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <p className="text-2xl font-bold text-academy-dark">{value}</p>
      <div className="flex items-center gap-2 mt-1">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}
