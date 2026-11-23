'use client'

import { useState, useTransition } from 'react'
import { changeUserRoleAction, deleteUserAction } from '@/app/actions/auth'
import { Users, Shield, Trash2, AlertCircle, GraduationCap, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
}

interface Props {
  users: User[]
  currentUserId: string
}

export default function MembersClient({ users, currentUserId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  function handleRoleChange(userId: string, currentRole: string) {
    const newRole = currentRole === 'TEACHER' ? 'STUDENT' : 'TEACHER'
    if (!confirm(`Bu kullanıcının rolünü ${newRole === 'TEACHER' ? 'Öğretmen' : 'Öğrenci'} olarak değiştirmek istiyor musunuz?`)) return

    startTransition(async () => {
      const result = await changeUserRoleAction(userId, newRole as 'STUDENT' | 'TEACHER')
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  function handleDelete(userId: string, name: string) {
    const isDemoAccount = ['ogretmen@demo.com', 'ogrenci@demo.com'].some(_ => true) // Check by name
    if (!confirm(`"${name}" adlı kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) return

    startTransition(async () => {
      const result = await deleteUserAction(userId)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  const teachers = filtered.filter(u => u.role === 'TEACHER')
  const students = filtered.filter(u => u.role === 'STUDENT')

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="İsim veya e-posta ile ara..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 shadow-sm"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
          <div className="bg-academy-navy p-2.5 rounded-lg">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-xl font-bold text-academy-dark">{teachers.length}</p>
            <p className="text-xs text-gray-500">Öğretmen</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
          <div className="bg-primary-500 p-2.5 rounded-lg">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <p className="text-xl font-bold text-academy-dark">{students.length}</p>
            <p className="text-xs text-gray-500">Öğrenci</p>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Kullanıcı</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Rol</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Kayıt Tarihi</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-academy-gold to-primary-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-academy-dark">
                        {user.name}
                        {user.id === currentUserId && (
                          <span className="ml-1.5 text-xs text-gray-400">(Siz)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    user.role === 'TEACHER'
                      ? 'bg-academy-navy text-white'
                      : 'bg-primary-100 text-primary-800'
                  }`}>
                    {user.role === 'TEACHER' ? 'Öğretmen' : 'Öğrenci'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                </td>
                <td className="px-5 py-3.5">
                  {user.id !== currentUserId && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRoleChange(user.id, user.role)}
                        disabled={isPending}
                        className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                        title="Rol Değiştir"
                      >
                        <Shield size={12} />
                        {user.role === 'TEACHER' ? 'Öğrenci Yap' : 'Öğretmen Yap'}
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        disabled={isPending}
                        className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                      >
                        <Trash2 size={12} />
                        Sil
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">Aramanızla eşleşen üye bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  )
}
