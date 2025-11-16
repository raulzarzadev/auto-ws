import 'server-only'

import { cookies } from 'next/headers'
import { firebaseAdminAuth, firebaseAdminDb } from '@/config/firebase-admin'
import { SESSION_COOKIE } from '@/lib/auth/constants'
import { AppUser, UserRole } from '@/lib/types'

const mapClaimsToUser = (claims: Record<string, unknown>): AppUser => ({
  id: String(claims.uid ?? 'unknown'),
  email: String(claims.email ?? 'unknown@example.com'),
  displayName: String(claims.name ?? claims.email ?? 'Usuario'),
  role: (claims.role as UserRole) ?? 'user',
  createdAt: new Date(
    Number(claims.auth_time ?? Date.now()) * 1000
  ).toISOString(),
  lastLoginAt: new Date().toISOString()
})

export const getSessionToken = async () => {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value ?? null
}

export const verifySession = async (token?: string) => {
  if (!token) return null
  try {
    const decoded = await firebaseAdminAuth.verifySessionCookie(token, true)
    const snapshot = await firebaseAdminDb
      .collection('users')
      .doc(decoded.uid)
      .get()

    const rawData = snapshot.exists ? snapshot.data() : null

    // Create a plain object to avoid Firestore prototype issues
    const user: AppUser = {
      id: rawData?.id ?? String(decoded.uid),
      email: rawData?.email ?? String(decoded.email ?? 'unknown@example.com'),
      displayName:
        rawData?.displayName ??
        String(decoded.name ?? decoded.email ?? 'Usuario'),
      role: (rawData?.role as UserRole) ?? 'user',
      createdAt:
        rawData?.createdAt ??
        new Date(Number(decoded.auth_time ?? Date.now()) * 1000).toISOString(),
      lastLoginAt: rawData?.lastLoginAt ?? new Date().toISOString()
    }

    return user
  } catch (error) {
    console.error('Failed to verify session', error)
    return null
  }
}

export const requireRole = async (role: UserRole) => {
  const token = await getSessionToken()
  const user = await verifySession(token ?? undefined)
  if (!user || user.role !== role) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}

export const getCurrentUser = async () => {
  const token = await getSessionToken()
  return verifySession(token ?? undefined)
}

export const requireSession = async () => {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}
