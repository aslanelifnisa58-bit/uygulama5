import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-academy-cream flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl font-black text-academy-gold mb-4">404</div>
        <h1 className="text-2xl font-bold text-academy-navy mb-2">Sayfa Bulunamadı</h1>
        <p className="text-gray-500 mb-6">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-academy-navy hover:bg-academy-blue text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Home size={16} />
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  )
}
