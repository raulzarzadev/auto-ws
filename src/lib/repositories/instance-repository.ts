import 'server-only'

import { randomBytes } from 'node:crypto'

import { firebaseAdminDb } from '@/config/firebase-admin'
import { WhatsAppInstance } from '@/lib/types'

const COLLECTION = 'instances'

const generateApiKey = () => randomBytes(32).toString('hex')

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
  async findById(id: string) {
    const doc = await firebaseAdminDb.collection(COLLECTION).doc(id).get()
    return doc.exists ? (doc.data() as WhatsAppInstance) ?? null : null
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
      status: payload.status ?? 'disconnected',
      qrCode: payload.qrCode ?? null,
      phoneNumber: payload.phoneNumber,
      createdAt: now,
      updatedAt: now,
      apiKey: generateApiKey(),
      metadata: payload?.metadata || {}
    }
    await firebaseAdminDb.collection(COLLECTION).doc(id).set(data)
    return data
  },
  async delete(id: string) {
    await firebaseAdminDb.collection(COLLECTION).doc(id).delete()
  },
  async ensureApiKey(id: string) {
    const docRef = firebaseAdminDb.collection(COLLECTION).doc(id)
    const snapshot = await docRef.get()
    if (!snapshot.exists) {
      return null
    }

    const data = snapshot.data() as WhatsAppInstance
    if (data.apiKey) {
      return data.apiKey
    }

    const apiKey = generateApiKey()
    await docRef.update({
      apiKey,
      updatedAt: new Date().toISOString()
    })

    return apiKey
  },
  async updateStatus(
    id: string,
    status: WhatsAppInstance['status'],
    qrCode?: string | null
  ) {
    const docRef = firebaseAdminDb.collection(COLLECTION).doc(id)
    const updatePayload: Partial<WhatsAppInstance> & { updatedAt: string } = {
      status,
      updatedAt: new Date().toISOString()
    }

    if (qrCode !== undefined) {
      updatePayload.qrCode = qrCode
    }

    await docRef.update(updatePayload)
    const snapshot = await docRef.get()
    if (!snapshot.exists) {
      throw new Error('INSTANCE_NOT_FOUND')
    }
    return snapshot.data() as WhatsAppInstance
  }
}
