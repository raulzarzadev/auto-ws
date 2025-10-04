import 'server-only'

import { cookies } from 'next/headers'

import { firebaseAdminAuth } from '@/config/firebase-admin'
import { getEnv } from '@/config/env'
import { SESSION_COOKIE } from '@/lib/auth/constants'
import { userService } from '@/lib/services/user-service'
import { AppUser, UserRole } from '@/lib/types'

const env = getEnv()

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7 // 7 días

export const createSessionCookie = async (idToken: string) => {
  const sessionCookie = await firebaseAdminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS
  })

  const decoded = await firebaseAdminAuth.verifyIdToken(idToken, true)
  const existingUser = await userService.getById(decoded.uid)

  const authTimeMs = decoded.auth_time ? decoded.auth_time * 1000 : Date.now()

  const baseUser: AppUser = {
    id: decoded.uid,
    email: decoded.email ?? '',
    displayName: decoded.name ?? decoded.email ?? 'Usuario',
    role:
      (existingUser?.role as UserRole | undefined) ??
      (decoded.role as UserRole | undefined) ??
      'user',
    createdAt: existingUser?.createdAt ?? new Date(authTimeMs).toISOString(),
    lastLoginAt: new Date().toISOString()
  }

  await userService.ensureUserRecord(baseUser)

  const cookieStore = await cookies()
  cookieStore.set({
    name: SESSION_COOKIE,
    value: sessionCookie,
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000)
  })
}

export const clearSessionCookie = async () => {
  const cookieStore = await cookies()
  cookieStore.set({
    name: SESSION_COOKIE,
    value: '',
    maxAge: 0,
    path: '/'
  })
}
