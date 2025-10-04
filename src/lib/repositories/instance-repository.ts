import 'server-only'

import { firebaseAdminDb } from '@/config/firebase-admin'
import { WhatsAppInstance } from '@/lib/types'

const COLLECTION = 'instances'

export interface CreateInstanceRecord {
  ownerId: string
  label: string
  status?: WhatsAppInstance['status']
  qrCode?: string
  phoneNumber?: string
  metadata?: Record<string, unknown>
}

export const instanceRepository = {
  async listByOwner(ownerId: string) {
    const snapshot = await firebaseAdminDb
      .collection(COLLECTION)
      .where('ownerId', '==', ownerId)
      .get()
    return snapshot.docs.map((doc) => doc.data() as WhatsAppInstance)
  },
  async listAll() {
    const snapshot = await firebaseAdminDb.collection(COLLECTION).get()
    return snapshot.docs.map((doc) => doc.data() as WhatsAppInstance)
  },
  async create(payload: CreateInstanceRecord) {
    const id = firebaseAdminDb.collection(COLLECTION).doc().id
    const now = new Date().toISOString()
    const data: WhatsAppInstance = {
      id,
      ownerId: payload.ownerId,
      label: payload.label,
      status: payload.status ?? 'pending',
      qrCode: payload.qrCode,
      phoneNumber: payload.phoneNumber,
      createdAt: now,
      updatedAt: now,
      metadata: payload.metadata
    }
    await firebaseAdminDb.collection(COLLECTION).doc(id).set(data)
    return data
  },
  async updateStatus(
    id: string,
    status: WhatsAppInstance['status'],
    qrCode?: string
  ) {
    await firebaseAdminDb.collection(COLLECTION).doc(id).update({
      status,
      qrCode,
      updatedAt: new Date().toISOString()
    })
  }
}
