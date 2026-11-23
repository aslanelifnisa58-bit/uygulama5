'use server'

import { prisma } from '@/lib/prisma'
import { createSession, destroySession, requireAuth } from '@/lib/session'
import { validateEmail, validateRequired } from '@/lib/validation'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'E-posta ve şifre alanları zorunludur.' }
  }

  if (!validateEmail(email)) {
    return { error: 'Geçerli bir e-posta adresi giriniz.' }
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return { error: 'E-posta veya şifre hatalı.' }
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return { error: 'E-posta veya şifre hatalı.' }
    }

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'STUDENT' | 'TEACHER',
    })

    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    return { error: 'Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.' }
  }
}

export async function registerAction(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  const nameError = validateRequired(name, 'Ad Soyad')
  if (nameError) return { error: nameError }

  if (!validateEmail(email)) {
    return { error: 'Geçerli bir e-posta adresi giriniz.' }
  }

  if (!password || password.length < 6) {
    return { error: 'Şifre en az 6 karakter olmalıdır.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Şifreler eşleşmiyor.' }
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return { error: 'Bu e-posta adresi zaten kayıtlı.' }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'STUDENT',
      },
    })

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'STUDENT' | 'TEACHER',
    })

    return { success: true }
  } catch (error) {
    console.error('Register error:', error)
    return { error: 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.' }
  }
}

export async function logoutAction() {
  await destroySession()
  redirect('/login')
}

export async function updateProfileAction(formData: FormData) {
  const session = await requireAuth()
  
  const name = formData.get('name') as string
  const bio = formData.get('bio') as string

  const nameError = validateRequired(name, 'Ad Soyad')
  if (nameError) return { error: nameError }

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: name.trim(),
        bio: bio || null,
      },
    })

    return { success: true }
  } catch {
    return { error: 'Profil güncellenirken bir hata oluştu.' }
  }
}

export async function changeUserRoleAction(targetUserId: string, newRole: 'STUDENT' | 'TEACHER') {
  const session = await requireAuth()

  if (session.role !== 'TEACHER') {
    return { error: 'Bu işlem için yetkiniz yok.' }
  }

  if (targetUserId === session.userId) {
    return { error: 'Kendi rolünüzü değiştiremezsiniz.' }
  }

  try {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
    })

    return { success: true }
  } catch {
    return { error: 'Rol değiştirme sırasında bir hata oluştu.' }
  }
}

export async function deleteUserAction(targetUserId: string) {
  const session = await requireAuth()

  // Sadece kendi hesabını veya öğretmen başkasının hesabını silebilir
  if (session.userId !== targetUserId && session.role !== 'TEACHER') {
    return { error: 'Bu işlem için yetkiniz yok.' }
  }

  try {
    await prisma.user.delete({ where: { id: targetUserId } })
    return { success: true }
  } catch {
    return { error: 'Kullanıcı silinirken bir hata oluştu.' }
  }
}
