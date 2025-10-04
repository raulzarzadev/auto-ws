import { NextRequest, NextResponse } from 'next/server'

import { instanceRepository } from '@/lib/repositories/instance-repository'
import { sendWhatsAppMessage } from '@/lib/services/whatsapp-service'
import {
  normalizeMessageInput,
  sendMessageSchema
} from '@/lib/validators/message'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!params?.id) {
    return NextResponse.json({ error: 'INSTANCE_ID_REQUIRED' }, { status: 400 })
  }

  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) {
    return NextResponse.json({ error: 'API_KEY_REQUIRED' }, { status: 401 })
  }

  const instance = await instanceRepository.findById(params.id)
  if (!instance || instance.apiKey !== apiKey) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  if (instance.status !== 'connected') {
    return NextResponse.json(
      {
        error: 'INSTANCE_NOT_READY',
        message: 'La instancia no está conectada actualmente.'
      },
      { status: 409 }
    )
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INVALID_JSON',
        message: 'No pudimos parsear el cuerpo de la petición.'
      },
      { status: 400 }
    )
  }

  const parseResult = sendMessageSchema.safeParse(payload)
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'INVALID_PAYLOAD', details: parseResult.error.flatten() },
      { status: 422 }
    )
  }

  const { jid, content, options } = normalizeMessageInput(parseResult.data)

  try {
    const response = await sendWhatsAppMessage(
      instance.id,
      jid,
      content as any,
      options as any
    )

    return NextResponse.json({
      ok: true,
      data: response
    })
  } catch (error) {
    console.error('[send-message]', error)
    return NextResponse.json(
      {
        error: 'DELIVERY_FAILED',
        message:
          error instanceof Error
            ? error.message
            : 'No pudimos enviar el mensaje mediante Baileys.'
      },
      { status: 500 }
    )
  }
}
