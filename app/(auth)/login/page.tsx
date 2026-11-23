'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { loginAction } from '@/app/actions/auth'
import { GraduationCap, Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function fillDemo(type: 'teacher' | 'student') {
    setEmail(type === 'teacher' ? 'ogretmen@demo.com' : 'ogrenci@demo.com')
    setPassword('Demo1234')
  }

  async function handleSubmit(formData: FormData) {
    setError('')
    startTransition(async () => {
      const result = await loginAction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    })
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-academy-gold rounded-2xl mb-4 shadow-xl">
          <GraduationCap size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">DigiAkademi</h1>
        <p className="text-gray-300 text-sm mt-1">Dijital Tasarım ve Oyun Geliştirme</p>
      </div>

      {/* Demo Accounts */}
      <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 mb-6">
        <p className="text-white text-xs font-medium mb-3 flex items-center gap-1.5">
          <span className="bg-academy-gold px-1.5 py-0.5 rounded text-white text-xs">DEMO</span>
          Hızlı giriş için bir hesap seçin:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillDemo('teacher')}
            className="bg-white/15 hover:bg-white/25 text-white text-xs py-2 px-3 rounded-lg transition-colors text-left"
          >
            <p className="font-semibold">🎓 Demo Öğretmen</p>
            <p className="text-gray-300 mt-0.5">ogretmen@demo.com</p>
          </button>
          <button
            type="button"
            onClick={() => fillDemo('student')}
            className="bg-white/15 hover:bg-white/25 text-white text-xs py-2 px-3 rounded-lg transition-colors text-left"
          >
            <p className="font-semibold">📚 Demo Öğrenci</p>
            <p className="text-gray-300 mt-0.5">ogrenci@demo.com</p>
          </button>
        </div>
        <p className="text-gray-400 text-xs mt-2 text-center">Şifre: <code className="bg-white/10 px-1 rounded">Demo1234</code></p>
      </div>

      {/* Login Form */}
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-xl font-bold text-academy-navy mb-6">Giriş Yap</h2>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-posta</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                required
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Şifre</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-academy-navy hover:bg-academy-blue text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Hesabınız yok mu?{' '}
          <Link href="/register" className="text-primary-600 font-medium hover:text-primary-800">
            Üye Ol
          </Link>
        </p>
      </div>
    </div>
  )
}
