import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production-please'
)

export interface SessionPayload {
  userId: string
  email: string
  name: string
  role: 'STUDENT' | 'TEACHER'
  iat?: number
  exp?: number
}

export async function createSession(payload: Omit<SessionPayload, 'iat' | 'exp'>) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)

  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return token
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  try {
    const token = request.cookies.get('session')?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) {
    throw new Error('UNAUTHORIZED')
  }
  return session
}

export async function requireTeacher(): Promise<SessionPayload> {
  const session = await requireAuth()
  if (session.role !== 'TEACHER') {
    throw new Error('FORBIDDEN')
  }
  return session
}
