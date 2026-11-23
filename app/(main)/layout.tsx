import Navbar from '@/components/Navbar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-academy-dark text-gray-400 text-center py-4 text-sm mt-auto">
        <p>© 2024 DigiAkademi — Dijital Tasarım ve Oyun Geliştirme Akademisi</p>
      </footer>
    </div>
  )
}
