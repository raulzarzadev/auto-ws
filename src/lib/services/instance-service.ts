import 'server-only'

import { instanceRepository } from '@/lib/repositories/instance-repository'
import { WhatsAppInstance } from '@/lib/types'
import {
  CreateInstanceInput,
  createInstanceSchema
} from '@/lib/validators/instance'

export const instanceService = {
  listForOwner: (ownerId: string) => instanceRepository.listByOwner(ownerId),
  listAll: () => instanceRepository.listAll(),
  getById: (id: string) => instanceRepository.findById(id),
  async getOwnedInstance(ownerId: string, id: string) {
    const instance = await instanceRepository.findById(id)
    if (!instance || instance.ownerId !== ownerId) {
      throw new Error('INSTANCE_NOT_FOUND')
    }
    if (!instance.apiKey) {
      const apiKey = await instanceRepository.ensureApiKey(instance.id)
      if (!apiKey) {
        throw new Error('INSTANCE_NOT_FOUND')
      }
      return { ...instance, apiKey }
    }
    return instance
  },
  async create(ownerId: string, payload: CreateInstanceInput) {
    const data = createInstanceSchema.parse(payload)
    const instance = await instanceRepository.create({
      ownerId,
      label: data.label,
      phoneNumber: data.phoneNumber
    })

    const { createWhatsAppSession } = await import(
      '@/lib/services/whatsapp-service'
    )
    const session = await createWhatsAppSession(instance.id)
    if (session.qrCode) {
      return instanceRepository.updateStatus(
        instance.id,
        'pending',
        session.qrCode
      )
    }

    return instanceRepository.updateStatus(instance.id, 'connected', null)
  },
  async updateStatus(
    ownerId: string,
    instanceId: string,
    status: WhatsAppInstance['status']
  ) {
    const instance = await instanceRepository.findById(instanceId)
    if (!instance || instance.ownerId !== ownerId) {
      throw new Error('INSTANCE_NOT_FOUND')
    }

    const qrCode = status === 'pending' ? instance.qrCode ?? null : null
    const updated = await instanceRepository.updateStatus(
      instanceId,
      status,
      qrCode
    )

    if (!updated.apiKey) {
      const apiKey = await instanceRepository.ensureApiKey(updated.id)
      if (apiKey) {
        return { ...updated, apiKey }
      }
    }

    return updated
  },
  async regenerateQr(ownerId: string, instanceId: string) {
    const instance = await instanceRepository.findById(instanceId)
    if (!instance || instance.ownerId !== ownerId) {
      throw new Error('INSTANCE_NOT_FOUND')
    }

    const { createWhatsAppSession } = await import(
      '@/lib/services/whatsapp-service'
    )
    const session = await createWhatsAppSession(instanceId)
    if (session.qrCode) {
      return instanceRepository.updateStatus(
        instanceId,
        'pending',
        session.qrCode
      )
    }

    const updated = await instanceRepository.updateStatus(
      instanceId,
      'connected',
      null
    )

    if (!updated.apiKey) {
      const apiKey = await instanceRepository.ensureApiKey(updated.id)
      if (apiKey) {
        return { ...updated, apiKey }
      }
    }

    return updated
  }
}
