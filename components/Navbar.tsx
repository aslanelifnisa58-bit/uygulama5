import Link from 'next/link'
import { logoutAction } from '@/app/actions/auth'
import { getSession } from '@/lib/session'
import {
  BookOpen, Users, LayoutDashboard, Calendar,
  Star, LogOut, GraduationCap, Bell, Menu
} from 'lucide-react'

export default async function Navbar() {
  const session = await getSession()
  if (!session) return null

  const isTeacher = session.role === 'TEACHER'

  return (
    <header className="bg-academy-navy text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="bg-academy-gold p-1.5 rounded-lg">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-lg leading-none">DigiAkademi</span>
              <p className="text-xs text-gray-300 leading-none">Oyun &amp; Tasarım</p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/dashboard" icon={<LayoutDashboard size={16} />} label="Ana Sayfa" />
            <NavLink href="/courses" icon={<BookOpen size={16} />} label="Dersler" />
            {!isTeacher && (
              <>
                <NavLink href="/my-grades" icon={<Star size={16} />} label="Notlarım" />
                <NavLink href="/calendar" icon={<Calendar size={16} />} label="Ödev Takvimi" />
              </>
            )}
            {isTeacher && (
              <NavLink href="/members" icon={<Users size={16} />} label="Üyeler" />
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-academy-blue px-3 py-1.5 rounded-lg">
              <div className="w-7 h-7 bg-academy-gold rounded-full flex items-center justify-center text-white text-xs font-bold">
                {session.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <p className="font-medium leading-none">{session.name.split(' ')[0]}</p>
                <p className="text-gray-300 text-xs leading-none mt-0.5">
                  {isTeacher ? 'Öğretmen' : 'Öğrenci'}
                </p>
              </div>
            </div>
            <Link
              href="/profile"
              className="text-xs text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-academy-blue transition-colors"
            >
              Profil
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
              >
                <LogOut size={14} />
                <span>Çıkış</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-200 hover:text-white hover:bg-academy-blue transition-colors"
    >
      {icon}
      {label}
    </Link>
  )
}
