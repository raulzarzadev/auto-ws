import { z } from 'zod'

import {
  ensureWhatsAppJid,
  formatPhoneNumberForWhatsApp
} from '@/lib/phone/whatsapp'
import type {
  AnyMessageContent,
  MiscMessageGenerationOptions
} from '@whiskeysockets/baileys'

export const sendMessageSchema = z
  .object({
    to: z.string().trim().optional(),
    jid: z.string().trim().optional(),
    content: z.union([z.string(), z.record(z.unknown())]),
    options: z.record(z.unknown()).optional()
  })
  .refine((data) => data.to || data.jid, {
    message: 'Debes especificar "to" (número) o "jid" (identificador completo).'
  })

type SendMessageInput = z.infer<typeof sendMessageSchema>

export interface NormalizedMessageInput {
  jid: string
  content: AnyMessageContent
  options?: MiscMessageGenerationOptions
}

export const normalizeMessageInput = (
  input: SendMessageInput
): NormalizedMessageInput => {
  const jid = input.jid
    ? ensureWhatsAppJid(input.jid)
    : formatPhoneNumberForWhatsApp(input.to as string).jid
  const messageContent =
    typeof input.content === 'string'
      ? ({ text: input.content } satisfies AnyMessageContent)
      : (input.content as AnyMessageContent)

  const normalizedOptions = input.options as
    | MiscMessageGenerationOptions
    | undefined

  return {
    jid,
    content: messageContent,
    options: normalizedOptions
  }
}
