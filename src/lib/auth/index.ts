import { AppUser } from '@/lib/types'

export const isAdmin = (user?: AppUser | null) => user?.role === 'admin'
export const isStandardUser = (user?: AppUser | null) => user?.role === 'user'

export const canAccessAdmin = (user?: AppUser | null) => isAdmin(user)
export const canAccessUserArea = (user?: AppUser | null) =>
  isAdmin(user) || isStandardUser(user)

export const getDashboardPath = (user?: AppUser | null) =>
  (isAdmin(user) ? '/admin' : '/app') satisfies `/admin` | `/app`
