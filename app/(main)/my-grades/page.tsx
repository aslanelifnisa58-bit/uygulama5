import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import RichTextDisplay from '@/components/RichTextDisplay'
import { Star, BookOpen, Trophy, AlertCircle, CheckCircle } from 'lucide-react'

export default async function MyGradesPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'STUDENT') redirect('/dashboard')

  const submissions = await prisma.submission.findMany({
    where: {
      studentId: session.userId,
      score: { not: null },
    },
    include: {
      assignment: {
        include: {
          course: { select: { title: true, id: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const totalSubmissions = await prisma.submission.count({ where: { studentId: session.userId } })
  const gradedCount = submissions.length
  const avgScore = gradedCount === 0
    ? 0
    : Math.round(submissions.reduce((acc, s) => acc + (s.score! / s.assignment.maxScore) * 100, 0) / gradedCount)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-academy-navy">Notlarım</h1>
        <p className="text-gray-500 text-sm mt-1">Tüm ödevlere aldığınız notlar ve geri bildirimler</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="bg-academy-gold p-3 rounded-xl">
            <Trophy size={20} className="text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-academy-dark">{avgScore}%</p>
            <p className="text-sm text-gray-500">Ortalama Başarı</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="bg-green-600 p-3 rounded-xl">
            <CheckCircle size={20} className="text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-academy-dark">{gradedCount}</p>
            <p className="text-sm text-gray-500">Notlanan Ödev</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="bg-primary-600 p-3 rounded-xl">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-academy-dark">{totalSubmissions}</p>
            <p className="text-sm text-gray-500">Toplam Teslim</p>
          </div>
        </div>
      </div>

      {/* Grades List */}
      {submissions.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-100">
          <Star size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">Henüz notlanan ödeviniz yok.</p>
          <p className="text-gray-400 text-sm mt-1">Ödev teslim ettikten sonra öğretmeniniz notu girdiğinde burada görünecek.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map(sub => {
            const pct = Math.round((sub.score! / sub.assignment.maxScore) * 100)
            const scoreColor = pct >= 80 ? 'text-green-700 bg-green-50' : pct >= 60 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50'

            return (
              <div key={sub.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-academy-navy">{sub.assignment.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{sub.assignment.course.title}</p>
                  </div>
                  <div className={`text-right shrink-0 px-4 py-2 rounded-xl ${scoreColor}`}>
                    <p className="text-2xl font-bold leading-none">{sub.score}</p>
                    <p className="text-xs mt-0.5">/ {sub.assignment.maxScore}</p>
                    <p className="text-xs font-medium mt-0.5">{pct}%</p>
                  </div>
                </div>

                {/* Score bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {sub.feedback && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-primary-500" />
                      Öğretmen Geri Bildirimi
                    </p>
                    <RichTextDisplay html={sub.feedback} className="bg-academy-warm rounded-lg p-4 text-sm" />
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-3">
                  Notlandırma tarihi: {new Date(sub.updatedAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
