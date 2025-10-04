import 'server-only'

import { firebaseAdminDb } from '@/config/firebase-admin'
import { AppUser } from '@/lib/types'

const COLLECTION = 'users'

export const userRepository = {
  async listAll() {
    const snapshot = await firebaseAdminDb.collection(COLLECTION).get()
    return snapshot.docs.map((doc) => doc.data() as AppUser)
  },
  async findById(id: string) {
    const doc = await firebaseAdminDb.collection(COLLECTION).doc(id).get()
    return doc.exists ? (doc.data() as AppUser) : null
  },
  async upsert(user: AppUser) {
    await firebaseAdminDb.collection(COLLECTION).doc(user.id).set(user, {
      merge: true
    })
  }
}
