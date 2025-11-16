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
      return {
        id: instance.id,
        ownerId: instance.ownerId,
        label: instance.label,
        status: instance.status,
        qrCode: instance.qrCode,
        phoneNumber: instance.phoneNumber,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt,
        apiKey,
        metadata: instance.metadata
      }
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
    return instance
  },
  async start(ownerId: string, instanceId: string) {
    const instance = await instanceRepository.findById(instanceId)
    if (!instance || instance.ownerId !== ownerId) {
      throw new Error('INSTANCE_NOT_FOUND')
    }

    if (instance.status === 'connected') {
      throw new Error('INSTANCE_ALREADY_CONNECTED')
    }

    try {
      const { instance: latest } = await startWhatsAppSession(instance.id)
      return latest
    } catch (error) {
      console.error('[instanceService.start]', error)
      throw new Error(mapWhatsAppCreationError(error))
    }
  },
  async startInteractive(ownerId: string, instanceId: string) {
    const instance = await instanceRepository.findById(instanceId)
    if (!instance || instance.ownerId !== ownerId) {
      throw new Error('INSTANCE_NOT_FOUND')
    }

    if (instance.status === 'connected') {
      throw new Error('INSTANCE_ALREADY_CONNECTED')
    }

    try {
      return await startWhatsAppSession(instance.id)
    } catch (error) {
      console.error('[instanceService.startInteractive]', error)
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

    if (status !== 'disconnected') {
      throw new Error('STATUS_UPDATE_NOT_SUPPORTED')
    }

    const updated = await instanceRepository.updateStatus(
      instanceId,
      status,
      null
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
        return {
          id: updated.id,
          ownerId: updated.ownerId,
          label: updated.label,
          status: updated.status,
          qrCode: updated.qrCode,
          phoneNumber: updated.phoneNumber,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          apiKey,
          metadata: updated.metadata
        }
      }
    }

    return updated
  },
  async regenerateQr(ownerId: string, instanceId: string) {
    const instance = await instanceRepository.findById(instanceId)
    if (!instance || instance.ownerId !== ownerId) {
      throw new Error('INSTANCE_NOT_FOUND')
    }
    if (instance.status === 'connected') {
      throw new Error('INSTANCE_ALREADY_CONNECTED')
    }

    try {
      const { instance: latest } = await startWhatsAppSession(instance.id)
      return latest
    } catch (error) {
      console.error('[instanceService.regenerateQr]', error)
      throw new Error(mapWhatsAppCreationError(error))
    }
  },
  async requestPairingCode(ownerId: string, instanceId: string) {
    const instance = await instanceRepository.findById(instanceId)
    if (!instance || instance.ownerId !== ownerId) {
      throw new Error('INSTANCE_NOT_FOUND')
    }

    if (instance.status !== 'pending') {
      throw Object.assign(
        new Error('La instancia debe estar encendida para generar el código.'),
        { code: 'WA_PAIRING_NOT_PENDING' }
      )
    }

    if (!instance.phoneNumber) {
      throw Object.assign(
        new Error(
          'Configura un número de teléfono antes de generar el código.'
        ),
        { code: 'WA_PAIRING_PHONE_MISSING' }
      )
    }

    const { digits } = formatPhoneNumberForWhatsApp(instance.phoneNumber, {
      defaultCountry: 'MX'
    })

    try {
      const { requestWhatsAppPairingCode } = await import(
        '@/lib/services/whatsapp-service'
      )

      const code = await requestWhatsAppPairingCode(instance.id, digits)

      return { code }
    } catch (error) {
      console.error('[instanceService.requestPairingCode]', error)
      throw new Error(mapPairingCodeError(error))
    }
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
  },
  formatStartError: (error: unknown) => mapWhatsAppCreationError(error)
}

import type { WhatsAppSession as ActiveWhatsAppSession } from '@/lib/services/whatsapp-service'

const startWhatsAppSession = async (
  instanceId: string
): Promise<{ instance: WhatsAppInstance; session: ActiveWhatsAppSession }> => {
  await instanceRepository.updateStatus(instanceId, 'pending', null)

  let session: ActiveWhatsAppSession | null = null

  try {
    const { createWhatsAppSession } = await import(
      '@/lib/services/whatsapp-service'
    )

    session = await createWhatsAppSession(instanceId, {
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
        if (reason === 'closed' || reason === 'ended') {
          await instanceRepository.updateStatus(
            instanceId,
            'disconnected',
            null
          )
        }
      }
    })

    session.completion.catch((error: unknown) => {
      console.error(`[instanceService.session:${instanceId}]`, error)
    })

    await session.firstQr

    const latest = await instanceRepository.findById(instanceId)
    if (!latest) {
      throw new Error('INSTANCE_NOT_FOUND')
    }

    let normalized = latest

    if (latest.status === 'connected' && !latest.apiKey) {
      const apiKey = await instanceRepository.ensureApiKey(latest.id)
      if (apiKey) {
        normalized = {
          id: latest.id,
          ownerId: latest.ownerId,
          label: latest.label,
          status: latest.status,
          qrCode: latest.qrCode,
          phoneNumber: latest.phoneNumber,
          createdAt: latest.createdAt,
          updatedAt: latest.updatedAt,
          apiKey,
          metadata: latest.metadata
        }
      }
    }

    return { instance: normalized, session }
  } catch (error) {
    try {
      await instanceRepository.updateStatus(instanceId, 'disconnected', null)
    } catch (resetError) {
      console.error('[instanceService.start.reset]', resetError)
    }

    if (session) {
      try {
        session.end()
      } catch (endError) {
        console.error('[instanceService.start.end]', endError)
      }
    }

    throw error
  }
}

const mapPairingCodeError = (error: unknown) => {
  if (error && typeof error === 'object') {
    const code = (error as { code?: unknown }).code

    if (code === 'WA_PAIRING_SESSION_INACTIVE') {
      return 'Primero enciende la instancia para generar el código.'
    }

    if (code === 'WA_PAIRING_UNSUPPORTED') {
      return 'Este método de vinculación no está disponible por ahora.'
    }

    if (code === 'WA_PAIRING_INVALID_PHONE') {
      return 'El número configurado no es válido para generar el código.'
    }

    if (code === 'WA_PAIRING_NOT_PENDING') {
      return 'Enciende la instancia para obtener un nuevo código.'
    }

    if (code === 'WA_PAIRING_PHONE_MISSING') {
      return 'Configura un número de teléfono en la instancia antes de solicitar el código.'
    }

    if (code === 'WA_PAIRING_REQUEST_FAILED') {
      return 'No pudimos obtener el código de vinculación. Intenta nuevamente en unos segundos.'
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'No pudimos generar el código de vinculación. Intenta nuevamente.'
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
