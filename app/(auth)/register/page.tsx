'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { registerAction } from '@/app/actions/auth'
import { GraduationCap, Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError('')
    startTransition(async () => {
      const result = await registerAction(formData)
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
        <p className="text-gray-300 text-sm mt-1">Hemen üye olun ve öğrenmeye başlayın</p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-xl font-bold text-academy-navy mb-6">Üye Ol</h2>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad Soyad</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="name"
                placeholder="Adınız Soyadınız"
                required
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-posta</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
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
                placeholder="En az 6 karakter"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Şifre Tekrar</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Şifrenizi tekrar girin"
                required
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-academy-navy hover:bg-academy-blue text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? 'Kayıt yapılıyor...' : 'Üye Ol'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Zaten üye misiniz?{' '}
          <Link href="/login" className="text-primary-600 font-medium hover:text-primary-800">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  )
}
