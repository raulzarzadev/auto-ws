export type UserRole = 'admin' | 'user'

export interface AppUser {
  id: string
  email: string
  displayName: string
  role: UserRole
  createdAt: string
  lastLoginAt?: string
}

export interface WhatsAppInstance {
  id: string
  ownerId: string
  label: string
  status: 'pending' | 'connected' | 'disconnected'
  qrCode?: string | null
  phoneNumber?: string
  createdAt: string
  updatedAt: string
  apiKey: string
  metadata?: Record<string, unknown>
}

export interface Subscription {
  id: string
  userId: string
  status: 'active' | 'past_due' | 'canceled'
  priceId: string
  currentPeriodEnd: string
}
