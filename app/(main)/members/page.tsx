import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import MembersClient from './MembersClient'

export default async function MembersPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'TEACHER') redirect('/dashboard')

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-academy-navy">Üye Yönetimi</h1>
        <p className="text-gray-500 text-sm mt-1">Sistemdeki tüm üyeleri görüntüleyin ve yönetin</p>
      </div>
      <MembersClient users={users} currentUserId={session.userId} />
    </div>
  )
}
