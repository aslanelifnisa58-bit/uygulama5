import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ProfileForm from './ProfileForm'
import RichTextDisplay from '@/components/RichTextDisplay'
import { User, Mail, Shield, Calendar } from 'lucide-react'

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, bio: true, createdAt: true },
  })
  if (!user) redirect('/login')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-academy-navy">Profilim</h1>
        <p className="text-gray-500 text-sm mt-1">Profil bilgilerinizi görüntüleyin ve güncelleyin</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-academy-gold to-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-academy-navy">{user.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                user.role === 'TEACHER'
                  ? 'bg-academy-navy text-white'
                  : 'bg-primary-100 text-primary-800'
              }`}>
                {user.role === 'TEACHER' ? '🎓 Öğretmen' : '📚 Öğrenci'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Mail size={16} className="text-gray-400" />
            {user.email}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Shield size={16} className="text-gray-400" />
            {user.role === 'TEACHER' ? 'Öğretmen' : 'Öğrenci'} hesabı
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Calendar size={16} className="text-gray-400" />
            Üyelik: {new Date(user.createdAt).toLocaleDateString('tr-TR')}
          </div>
        </div>

        {user.bio && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Hakkında</h3>
            <RichTextDisplay html={user.bio} className="text-sm text-gray-600" />
          </div>
        )}
      </div>

      {/* Edit Form */}
      <ProfileForm user={{ name: user.name, bio: user.bio || '' }} />
    </div>
  )
}
