import { SESSION_COOKIE } from '@/lib/auth/constants'
import { UserRole } from '@/lib/types'

export interface SessionClaims {
  uid: string
  email?: string
  name?: string
  role: UserRole
  exp?: number
}

const decodeBase64 = (token: string) => {
  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(token)
  }

  const maybeBuffer = (
    globalThis as unknown as {
      Buffer?: {
        from(
          data: string,
          encoding: 'base64'
        ): { toString(encoding: 'utf-8'): string }
      }
    }
  ).Buffer

  if (maybeBuffer) {
    return maybeBuffer.from(token, 'base64').toString('utf-8')
  }

  throw new Error('Base64 decoding is not supported in this environment')
}

const parseToken = (token: string) => {
  try {
    const [header, payload] = token.split('.')
    if (!payload) {
      // plain base64 encoded JSON fallback
      return JSON.parse(decodeBase64(token))
    }
    return JSON.parse(decodeBase64(payload))
  } catch {
    return null
  }
}

export const readSessionClaims = (
  token?: string | null
): SessionClaims | null => {
  if (!token) return null
  const payload = parseToken(token)
  if (!payload) return null

  const role = (payload.role as UserRole) ?? 'user'
  const uid = String(payload.uid ?? payload.sub ?? '')
  if (!uid) return null

  if (payload.exp && Date.now() / 1000 > Number(payload.exp)) {
    return null
  }

  return {
    uid,
    email: payload.email ? String(payload.email) : undefined,
    name: payload.name ? String(payload.name) : undefined,
    role,
    exp: payload.exp ? Number(payload.exp) : undefined
  } satisfies SessionClaims
}

export const getSessionCookieName = () => SESSION_COOKIE
