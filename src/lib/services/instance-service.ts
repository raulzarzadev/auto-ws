import 'server-only'

import { instanceRepository } from '@/lib/repositories/instance-repository'
import { WhatsAppInstance } from '@/lib/types'
import {
  CreateInstanceInput,
  SendTestMessageInput,
  createInstanceSchema
} from '@/lib/validators/instance'
import { formatPhoneNumberForWhatsApp } from '@/lib/phone/whatsapp'

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
    try {
      const { createWhatsAppSession } = await import(
        '@/lib/services/whatsapp-service'
      )

      const session = await createWhatsAppSession(instance.id, {
        onQr: async (qrCode) => {
          await instanceRepository.updateStatus(instance.id, 'pending', qrCode)
        },
        onConnected: async () => {
          const updated = await instanceRepository.updateStatus(
            instance.id,
            'connected',
            null
          )

          if (!updated.apiKey) {
            await instanceRepository.ensureApiKey(updated.id)
          }
        },
        onClose: async ({ reason }) => {
          if (reason === 'closed') {
            await instanceRepository.updateStatus(
              instance.id,
              'disconnected',
              null
            )
          }
        }
      })

      session.completion.catch((error) => {
        console.error('[instanceService.create][session]', error)
      })

      await session.firstQr

      const latest = await instanceRepository.findById(instance.id)
      if (!latest) {
        throw new Error('INSTANCE_NOT_FOUND')
      }

      if (latest.status === 'connected' && !latest.apiKey) {
        const apiKey = await instanceRepository.ensureApiKey(latest.id)
        if (apiKey) {
          return { ...latest, apiKey }
        }
      }

      return latest
    } catch (error) {
      console.error('[instanceService.create]', error)
      await instanceRepository.delete(instance.id)
      throw new Error(mapWhatsAppCreationError(error))
    }
  },
  async deletePendingInstance(ownerId: string, instanceId: string) {
    const instance = await instanceRepository.findById(instanceId)
    if (!instance || instance.ownerId !== ownerId) {
      throw new Error('INSTANCE_NOT_FOUND')
    }
    if (instance.status !== 'pending' && instance.status !== 'disconnected') {
      throw new Error('SOLO_PUEDES_ELIMINAR_INSTANCIAS_PENDIENTES')
    }

    const { disconnectWhatsAppSession } = await import(
      '@/lib/services/whatsapp-service'
    )
    await disconnectWhatsAppSession(instanceId)
    await instanceRepository.delete(instanceId)
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

    if (status === 'disconnected') {
      const { disconnectWhatsAppSession } = await import(
        '@/lib/services/whatsapp-service'
      )
      await disconnectWhatsAppSession(instanceId)
    }

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

    const session = await createWhatsAppSession(instanceId, {
      onQr: async (qrCode) => {
        await instanceRepository.updateStatus(instanceId, 'pending', qrCode)
      },
      onConnected: async () => {
        const updated = await instanceRepository.updateStatus(
          instanceId,
          'connected',
          null
        )

        if (!updated.apiKey) {
          await instanceRepository.ensureApiKey(updated.id)
        }
      },
      onClose: async ({ reason }) => {
        if (reason === 'closed') {
          await instanceRepository.updateStatus(
            instanceId,
            'disconnected',
            null
          )
        }
      }
    })

    session.completion.catch((error) => {
      console.error('[instanceService.regenerateQr][session]', error)
    })

    await session.firstQr

    const latest = await instanceRepository.findById(instanceId)
    if (!latest) {
      throw new Error('INSTANCE_NOT_FOUND')
    }

    if (latest.status === 'connected' && !latest.apiKey) {
      const apiKey = await instanceRepository.ensureApiKey(latest.id)
      if (apiKey) {
        return { ...latest, apiKey }
      }
    }

    return latest
  },
  async sendTestMessage(ownerId: string, input: SendTestMessageInput) {
    const instance = await instanceRepository.findById(input.id)
    if (!instance || instance.ownerId !== ownerId) {
      throw new Error('INSTANCE_NOT_FOUND')
    }
    if (instance.status !== 'connected') {
      throw new Error('INSTANCE_NOT_CONNECTED')
    }

    const rawMetadataRecipient = instance.metadata?.testRecipient
    const metadataRecipient =
      typeof rawMetadataRecipient === 'string' &&
      rawMetadataRecipient.trim().length > 0
        ? rawMetadataRecipient.trim()
        : undefined

    const recipient = input.phone ?? metadataRecipient ?? instance.phoneNumber

    if (!recipient) {
      throw new Error(
        'Configura un número de prueba en metadata.testRecipient o asigna un teléfono a la instancia.'
      )
    }

    const { jid } = formatPhoneNumberForWhatsApp(recipient, {
      defaultCountry: 'MX'
    })

    const { sendWhatsAppMessage } = await import(
      '@/lib/services/whatsapp-service'
    )

    const messageContent =
      input.content && input.content.trim().length > 0
        ? input.content
        : `Mensaje de prueba desde ${instance.label}.`

    return sendWhatsAppMessage(instance.id, jid, {
      text: messageContent
    })
  }
}

const mapWhatsAppCreationError = (error: unknown) => {
  if (error && typeof error === 'object') {
    const code = (error as { code?: unknown }).code

    if (code === 'WA_QR_TIMEOUT') {
      return 'No pudimos generar el código QR a tiempo. Intenta nuevamente.'
    }

    if (code === 'WA_QR_RENDER_FAILED') {
      return 'Ocurrió un problema al renderizar el QR. Vuelve a intentarlo en unos segundos.'
    }

    if (code === 515) {
      return 'WhatsApp rechazó el intento de conexión. Abre la aplicación en tu teléfono, verifica que las sesiones vinculadas estén activas y vuelve a intentarlo.'
    }

    if (code === 'WA_CONNECTION_CLOSED') {
      return 'La conexión con WhatsApp se cerró antes de generar el QR. Intenta de nuevo en unos minutos.'
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Por ahora no pudimos conectar con WhatsApp. Vuelve a intentarlo dentro de un momento.'
}
