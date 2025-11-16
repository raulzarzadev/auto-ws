import 'server-only'

import { firebaseAdminDb } from '@/config/firebase-admin'
import { AppUser } from '@/lib/types'

const COLLECTION = 'users'

export const userRepository = {
  async listAll() {
    const snapshot = await firebaseAdminDb.collection(COLLECTION).get()
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: data.id,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        createdAt: data.createdAt,
        lastLoginAt: data.lastLoginAt
      } as AppUser
    })
  },
  async findById(id: string) {
    const doc = await firebaseAdminDb.collection(COLLECTION).doc(id).get()
    if (!doc.exists) return null

    const data = doc.data()
    if (!data) return null

    return {
      id: data.id,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      createdAt: data.createdAt,
      lastLoginAt: data.lastLoginAt
    } as AppUser
  },
  async upsert(user: AppUser) {
    await firebaseAdminDb.collection(COLLECTION).doc(user.id).set(user, {
      merge: true
    })
  }
}
