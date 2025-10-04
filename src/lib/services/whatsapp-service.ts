import 'server-only'

import qrcode from 'qrcode'

import { getSessionFilePath } from '@/config/baileys'

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
