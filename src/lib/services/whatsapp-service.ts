import 'server-only'

import qrcode from 'qrcode'

import { getSessionFilePath } from '@/config/baileys'

type AnyMessageContent = import('@whiskeysockets/baileys').AnyMessageContent
type MiscMessageGenerationOptions =
  import('@whiskeysockets/baileys').MiscMessageGenerationOptions

type BaileysModule = typeof import('@whiskeysockets/baileys')

const importBaileys = async (): Promise<BaileysModule> => {
  const mod = (await import('@whiskeysockets/baileys')) as BaileysModule
  return mod
}

export const createWhatsAppSession = async (sessionId: string) => {
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
  } = await importBaileys()

  const sessionFile = await getSessionFilePath(sessionId)
  const { state, saveCreds } = await useMultiFileAuthState(sessionFile)
  const { version } = await fetchLatestBaileysVersion()

  const socket = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false
  })

  socket.ev.on('creds.update', saveCreds)

  const qrCode = await new Promise<string | undefined>((resolve) => {
    const timeout = setTimeout(() => resolve(undefined), 15_000)
    socket.ev.on('connection.update', async (update) => {
      if (update.qr) {
        const qrImage = await qrcode.toDataURL(update.qr)
        clearTimeout(timeout)
        resolve(qrImage)
      }
      if (update.connection === 'open') {
        clearTimeout(timeout)
        resolve(undefined)
      }
    })
  })

  return {
    qrCode,
    end: () => socket.end(undefined)
  }
}

const waitForConnectionOpen = (socket: any, timeoutMs = 15_000) =>
  new Promise<void>((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('WA_CONNECTION_TIMEOUT'))
    }, timeoutMs)

    const cleanup = () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (typeof socket.ev.off === 'function') {
        socket.ev.off('connection.update', onUpdate)
      } else if (typeof socket.ev.removeListener === 'function') {
        socket.ev.removeListener('connection.update', onUpdate)
      }
    }

    const onUpdate = (update: {
      connection?: string
      lastDisconnect?: Error
    }) => {
      if (update.connection === 'open') {
        cleanup()
        resolve()
      }
      if (update.connection === 'close') {
        cleanup()
        reject(update.lastDisconnect ?? new Error('WA_CONNECTION_CLOSED'))
      }
    }

    socket.ev.on('connection.update', onUpdate)

    if (socket.ws?.readyState === 1) {
      cleanup()
      resolve()
    }
  })

export const sendWhatsAppMessage = async (
  sessionId: string,
  jid: string,
  content: AnyMessageContent,
  options?: MiscMessageGenerationOptions
) => {
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
  } = await importBaileys()

  const sessionFile = await getSessionFilePath(sessionId)
  const { state, saveCreds } = await useMultiFileAuthState(sessionFile)
  const { version } = await fetchLatestBaileysVersion()

  const socket = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false
  })

  socket.ev.on('creds.update', saveCreds)

  try {
    await waitForConnectionOpen(socket)
    const response = await socket.sendMessage(jid, content, options)
    return response
  } finally {
    socket.end(undefined)
  }
}
