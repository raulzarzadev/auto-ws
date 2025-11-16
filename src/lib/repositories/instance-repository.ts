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
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      // Return a plain object, not Firestore document data
      return {
        id: data.id,
        ownerId: data.ownerId,
        label: data.label,
        status: data.status,
        qrCode: data.qrCode ?? null,
        phoneNumber: data.phoneNumber,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        apiKey: data.apiKey,
        metadata: data.metadata ?? {}
      } as WhatsAppInstance
    })
  },
  async findById(id: string) {
    const doc = await firebaseAdminDb.collection(COLLECTION).doc(id).get()
    if (!doc.exists) return null

    const data = doc.data()
    if (!data) return null

    // Return a plain object, not Firestore document data
    return {
      id: data.id,
      ownerId: data.ownerId,
      label: data.label,
      status: data.status,
      qrCode: data.qrCode ?? null,
      phoneNumber: data.phoneNumber,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      apiKey: data.apiKey,
      metadata: data.metadata ?? {}
    } as WhatsAppInstance
  },
  async listAll() {
    const snapshot = await firebaseAdminDb.collection(COLLECTION).get()
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      // Return a plain object, not Firestore document data
      return {
        id: data.id,
        ownerId: data.ownerId,
        label: data.label,
        status: data.status,
        qrCode: data.qrCode ?? null,
        phoneNumber: data.phoneNumber,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        apiKey: data.apiKey,
        metadata: data.metadata ?? {}
      } as WhatsAppInstance
    })
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

    const data = snapshot.data()
    if (!data) return null

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

    const data = snapshot.data()
    if (!data) {
      throw new Error('INSTANCE_NOT_FOUND')
    }

    return {
      id: data.id,
      ownerId: data.ownerId,
      label: data.label,
      status: data.status,
      qrCode: data.qrCode ?? null,
      phoneNumber: data.phoneNumber,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      apiKey: data.apiKey,
      metadata: data.metadata ?? {}
    } as WhatsAppInstance
  }
}
