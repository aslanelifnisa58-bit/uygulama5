import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'

// Auth gerektirmeyen public rotalar
const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/api/seed']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public rotalar için kontrol gerekmez
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Static dosyalar ve Next.js internal için atla
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_next') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next()
  }

  // Oturum kontrolü
  const session = await getSessionFromRequest(request)
  
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/seed).*)',
  ],
}
