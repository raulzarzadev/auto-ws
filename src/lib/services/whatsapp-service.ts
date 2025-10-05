import 'server-only'

import qrcode from 'qrcode'

import {
  removeFirestoreAuthState,
  useFirestoreAuthState
} from '@/lib/services/firestore-auth-state'

type BaileysModule = typeof import('@whiskeysockets/baileys')
type WASocket = import('@whiskeysockets/baileys').WASocket
type ConnectionState = import('@whiskeysockets/baileys').ConnectionState
type ConnectionUpdate = Partial<ConnectionState>
type AnyMessageContent = import('@whiskeysockets/baileys').AnyMessageContent
type MiscMessageGenerationOptions =
  import('@whiskeysockets/baileys').MiscMessageGenerationOptions

const QR_TIMEOUT_MS = 60_000
const CONNECTION_TIMEOUT_MS = 20_000

const sessions = new Map<string, ManagedSession>()
const sessionPromises = new Map<string, Promise<ManagedSession>>()

const importBaileys = async (): Promise<BaileysModule> => {
  const mod = (await import('@whiskeysockets/baileys')) as BaileysModule
  return mod
}

interface SessionHandlers {
  onQr?: (qrCode: string) => Promise<void> | void
  onConnected?: () => Promise<void> | void
  onClose?: (
    payload:
      | { reason: 'timeout'; error: Error }
      | { reason: 'closed'; error: Error; details?: unknown }
      | { reason: 'ended' }
  ) => Promise<void> | void
}

interface Deferred<T> {
  readonly promise: Promise<T>
  readonly settled: boolean
  resolveOnce: (value: T | PromiseLike<T>) => void
  rejectOnce: (reason?: unknown) => void
}

interface ManagedSession {
  id: string
  socket: WASocket
  saveCreds: () => Promise<void>
  handlers: SessionHandlers
  firstQr: Deferred<string | undefined>
  connected: Deferred<void>
  closed: boolean
  connectionListener: (state: ConnectionUpdate) => void
  qrTimeout?: NodeJS.Timeout
}

interface WhatsAppSession {
  firstQr: Promise<string | undefined>
  completion: Promise<void>
  end: () => void
}

export const createWhatsAppSession = async (
  sessionId: string,
  handlers: SessionHandlers = {}
): Promise<WhatsAppSession> => {
  const session = await ensureSession(sessionId, handlers, { forceNew: true })

  return {
    firstQr: session.firstQr.promise,
    completion: session.connected.promise,
    end: () => {
      const current = sessions.get(sessionId)
      if (current) {
        try {
          void current.handlers.onClose?.({ reason: 'ended' })
        } catch (error) {
          console.error('[whatsappService.end]', error)
        }
      }
      void teardownSession(sessionId, { keepCreds: true })
    }
  }
}

export const disconnectWhatsAppSession = async (sessionId: string) => {
  const current = sessions.get(sessionId)
  if (current) {
    try {
      void current.handlers.onClose?.({ reason: 'ended' })
    } catch (error) {
      console.error('[whatsappService.disconnect]', error)
    }
  }
  await teardownSession(sessionId, { keepCreds: false })
}

export const sendWhatsAppMessage = async (
  sessionId: string,
  jid: string,
  content: AnyMessageContent,
  options?: MiscMessageGenerationOptions
) => {
  const session = await ensureSession(sessionId)

  if (!session.connected.settled) {
    await promiseWithTimeout(
      session.connected.promise,
      CONNECTION_TIMEOUT_MS,
      'WA_CONNECTION_TIMEOUT'
    )
  }

  return session.socket.sendMessage(jid, content, options)
}

const hasHandlers = (handlers: SessionHandlers) =>
  Boolean(handlers.onQr || handlers.onConnected || handlers.onClose)

const ensureSession = async (
  sessionId: string,
  handlers: SessionHandlers = {},
  options: { forceNew?: boolean } = {}
): Promise<ManagedSession> => {
  if (options.forceNew) {
    await teardownSession(sessionId, { keepCreds: false })
  } else {
    const existing = sessions.get(sessionId)
    if (existing) {
      if (hasHandlers(handlers)) {
        existing.handlers = handlers
      }
      return existing
    }

    const pending = sessionPromises.get(sessionId)
    if (pending) {
      if (hasHandlers(handlers)) {
        pending
          .then((session) => {
            session.handlers = handlers
          })
          .catch(() => {
            // ignored on purpose
          })
      }
      return pending
    }
  }

  const creation = createManagedSession(sessionId, handlers)
  sessionPromises.set(sessionId, creation)

  try {
    const session = await creation
    sessions.set(sessionId, session)
    sessionPromises.delete(sessionId)
    return session
  } catch (error) {
    sessionPromises.delete(sessionId)
    throw error
  }
}

const createManagedSession = async (
  sessionId: string,
  handlers: SessionHandlers
): Promise<ManagedSession> => {
  const {
    default: makeWASocket,
    fetchLatestBaileysVersion,
    DisconnectReason
  } = await importBaileys()

  const { state, saveCreds } = await useFirestoreAuthState(sessionId)
  const { version } = await fetchLatestBaileysVersion()

  const socket = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false
  })

  const session: ManagedSession = {
    id: sessionId,
    socket,
    saveCreds,
    handlers,
    firstQr: createDeferred<string | undefined>(),
    connected: createDeferred<void>(),
    closed: false,
    connectionListener: () => {}
  }

  const processConnectionUpdate = async (update: ConnectionUpdate) => {
    if (session.closed) return

    const { connection, lastDisconnect, qr } = update

    if (qr) {
      try {
        const qrImage = await qrcode.toDataURL(qr)
        session.firstQr.resolveOnce(qrImage)
        clearQrTimeout(session)
        try {
          await session.handlers.onQr?.(qrImage)
        } catch (error) {
          console.error('[whatsappService.onQr]', error)
        }
      } catch (error) {
        const renderError = Object.assign(new Error('WA_QR_RENDER_FAILED'), {
          code: 'WA_QR_RENDER_FAILED',
          cause: error
        })

        session.firstQr.rejectOnce(renderError)
        session.connected.rejectOnce(renderError)
        clearQrTimeout(session)

        try {
          await session.handlers.onClose?.({
            reason: 'closed',
            error: renderError,
            details: lastDisconnect
          })
        } catch (handlerError) {
          console.error('[whatsappService.onClose]', handlerError)
        }

        await teardownSession(session.id, { keepCreds: true })
        return
      }
    }

    if (connection === 'open') {
      clearQrTimeout(session)
      session.firstQr.resolveOnce(undefined)
      session.connected.resolveOnce()
      try {
        await session.handlers.onConnected?.()
      } catch (error) {
        console.error('[whatsappService.onConnected]', error)
      }
      return
    }

    if (connection === 'close') {
      const disconnectInfo = normalizeDisconnect(
        lastDisconnect,
        DisconnectReason
      )

      if (disconnectInfo.shouldRestart) {
        clearQrTimeout(session)
        await teardownSession(session.id, { keepCreds: true })

        try {
          await ensureSession(session.id, session.handlers)
        } catch (error) {
          console.error('[whatsappService.restart]', error)
        }
        return
      }

      session.connected.rejectOnce(disconnectInfo.error)
      if (!session.firstQr.settled) {
        session.firstQr.rejectOnce(disconnectInfo.error)
      }
      clearQrTimeout(session)

      try {
        await session.handlers.onClose?.({
          reason: 'closed',
          error: disconnectInfo.error,
          details: lastDisconnect
        })
      } catch (handlerError) {
        console.error('[whatsappService.onClose]', handlerError)
      }

      await teardownSession(session.id, {
        keepCreds: disconnectInfo.keepCreds
      })
    }
  }

  const handleConnectionUpdate = (update: ConnectionUpdate) => {
    void processConnectionUpdate(update)
  }

  session.connectionListener = handleConnectionUpdate

  socket.ev.on('creds.update', saveCreds)
  socket.ev.on('connection.update', handleConnectionUpdate)

  session.qrTimeout = setTimeout(() => {
    if (!session.firstQr.settled) {
      const timeoutError = Object.assign(new Error('WA_QR_TIMEOUT'), {
        code: 'WA_QR_TIMEOUT'
      })

      session.firstQr.rejectOnce(timeoutError)
      session.connected.rejectOnce(timeoutError)

      try {
        void session.handlers.onClose?.({
          reason: 'timeout',
          error: timeoutError
        })
      } catch (error) {
        console.error('[whatsappService.onClose]', error)
      }

      void teardownSession(session.id, { keepCreds: true })
    }
  }, QR_TIMEOUT_MS)

  return session
}

const normalizeDisconnect = (
  lastDisconnect: unknown,
  DisconnectReason: typeof import('@whiskeysockets/baileys').DisconnectReason
) => {
  const base = (lastDisconnect as any) ?? {}
  const error = base.error ?? base

  const statusCode =
    error?.output?.statusCode ??
    error?.output?.payload?.statusCode ??
    error?.statusCode ??
    error?.code ??
    base?.statusCode ??
    base?.code ??
    null

  const reason =
    statusCode === DisconnectReason.loggedOut
      ? 'logged-out'
      : statusCode === DisconnectReason.restartRequired
      ? 'restart-required'
      : statusCode === DisconnectReason.connectionReplaced
      ? 'replaced'
      : statusCode === DisconnectReason.connectionClosed
      ? 'connection-closed'
      : statusCode === DisconnectReason.timedOut
      ? 'timed-out'
      : 'unknown'

  const keepCreds = reason !== 'logged-out'
  const shouldRestart =
    reason === 'restart-required' || reason === 'connection-closed'

  const disconnectError = Object.assign(new Error('WA_CONNECTION_CLOSED'), {
    code: statusCode ?? 'WA_CONNECTION_CLOSED',
    details: lastDisconnect
  })

  return {
    statusCode,
    error: disconnectError,
    keepCreds,
    shouldRestart,
    reason
  }
}

const teardownSession = async (
  sessionId: string,
  options: { keepCreds?: boolean } = {}
) => {
  const session = sessions.get(sessionId)

  if (session) {
    session.closed = true
    clearQrTimeout(session)

    detachListener(
      session.socket,
      'connection.update',
      session.connectionListener
    )
    detachListener(session.socket, 'creds.update', session.saveCreds)

    try {
      session.socket.end(undefined)
    } catch (error) {
      console.error('[whatsappService.teardown]', error)
    }

    if (!session.firstQr.settled) {
      session.firstQr.rejectOnce(new Error('WA_SESSION_ENDED'))
    }
    if (!session.connected.settled) {
      session.connected.rejectOnce(new Error('WA_SESSION_ENDED'))
    }
  }

  sessions.delete(sessionId)
  sessionPromises.delete(sessionId)

  if (!options.keepCreds) {
    await removeFirestoreAuthState(sessionId).catch((error: unknown) => {
      console.error('[whatsappService.removeFirestoreAuthState]', error)
    })
  }
}

const detachListener = (
  socket: WASocket,
  event: string,
  listener: (...args: any[]) => void
) => {
  if (typeof socket.ev.off === 'function') {
    socket.ev.off(event as any, listener as any)
    return
  }

  const emitter = socket.ev as unknown as {
    removeListener?: (event: string, handler: (...args: any[]) => void) => void
  }
  emitter.removeListener?.(event, listener as any)
}

const createDeferred = <T>(): Deferred<T> => {
  let settled = false
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return {
    get settled() {
      return settled
    },
    promise,
    resolveOnce(value) {
      if (settled) return
      settled = true
      resolve(value)
    },
    rejectOnce(reason) {
      if (settled) return
      settled = true
      reject(reason)
    }
  }
}

const promiseWithTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
) => {
  let timer: NodeJS.Timeout | null = null

  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      timer = null
      reject(new Error(timeoutMessage))
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    return result
  } catch (error) {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    throw error
  }
}

const clearQrTimeout = (session: ManagedSession) => {
  if (session.qrTimeout) {
    clearTimeout(session.qrTimeout)
    session.qrTimeout = undefined
  }
}
