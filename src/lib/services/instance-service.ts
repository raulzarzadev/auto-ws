import 'server-only'

import { instanceRepository } from '@/lib/repositories/instance-repository'
import { createWhatsAppSession } from '@/lib/services/whatsapp-service'
import {
  CreateInstanceInput,
  createInstanceSchema
} from '@/lib/validators/instance'

export const instanceService = {
  listForOwner: (ownerId: string) => instanceRepository.listByOwner(ownerId),
  listAll: () => instanceRepository.listAll(),
  async create(ownerId: string, payload: CreateInstanceInput) {
    const data = createInstanceSchema.parse(payload)
    const instance = await instanceRepository.create({
      ownerId,
      label: data.label,
      phoneNumber: data.phoneNumber
    })

    const session = await createWhatsAppSession(instance.id)
    if (session.qrCode) {
      await instanceRepository.updateStatus(
        instance.id,
        'pending',
        session.qrCode
      )
      return { ...instance, qrCode: session.qrCode }
    }

    await instanceRepository.updateStatus(instance.id, 'connected')
    return { ...instance, status: 'connected' }
  }
}
