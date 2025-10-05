import 'server-only'

import qrcode from 'qrcode'

import {
  loadFirestoreAuthState,
  removeFirestoreAuthState
} from '@/lib/services/firestore-auth-state'
import { instanceRepository } from '@/lib/repositories/instance-repository'

type BaileysModule = typeof import('@whiskeysockets/baileys')
type WASocket = import('@whiskeysockets/baileys').WASocket
type ConnectionState = import('@whiskeysockets/baileys').ConnectionState
type ConnectionUpdate = Partial<ConnectionState>
type AnyMessageContent = import('@whiskeysockets/baileys').AnyMessageContent
type MiscMessageGenerationOptions =
  import('@whiskeysockets/baileys').MiscMessageGenerationOptions
type BaileysEventMap = import('@whiskeysockets/baileys').BaileysEventMap
type CredsUpdatePayload = BaileysEventMap['creds.update']

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

const DEFAULT_HANDLERS_APPLIED = Symbol('DEFAULT_HANDLERS_APPLIED')

type SessionHandlersWithDefaults = SessionHandlers & {
  [DEFAULT_HANDLERS_APPLIED]?: true
}

const createDefaultHandlers = (sessionId: string): SessionHandlers => ({
  onQr: async (qrCode) => {
    if (!qrCode) return
    try {
      await instanceRepository.updateStatus(sessionId, 'pending', qrCode)
    } catch (error) {
      console.error('[whatsappService.defaultHandlers.onQr]', error)
    }
  },
  onConnected: async () => {
    try {
      await instanceRepository.updateStatus(sessionId, 'connected', null)
    } catch (error) {
      console.error('[whatsappService.defaultHandlers.onConnected]', error)
    }
  },
  onClose: async ({ reason }) => {
    if (reason === 'closed' || reason === 'ended') {
      try {
        await instanceRepository.updateStatus(sessionId, 'disconnected', null)
      } catch (error) {
        console.error('[whatsappService.defaultHandlers.onClose]', error)
      }
    }
  }
})

const mergeHandlers = (...handlersList: SessionHandlers[]): SessionHandlers => {
  const onQrHandlers = handlersList
    .map((handler) => handler?.onQr)
    .filter(
      (handler): handler is NonNullable<SessionHandlers['onQr']> =>
        typeof handler === 'function'
    )

  const onConnectedHandlers = handlersList
    .map((handler) => handler?.onConnected)
    .filter(
      (handler): handler is NonNullable<SessionHandlers['onConnected']> =>
        typeof handler === 'function'
    )

  const onCloseHandlers = handlersList
    .map((handler) => handler?.onClose)
    .filter(
      (handler): handler is NonNullable<SessionHandlers['onClose']> =>
        typeof handler === 'function'
    )

  return {
    onQr:
      onQrHandlers.length > 0
        ? async (qrCode) => {
            for (const handler of onQrHandlers) {
              try {
                await handler(qrCode)
              } catch (error) {
                console.error('[whatsappService.handlers.onQr]', error)
              }
            }
          }
        : undefined,
    onConnected:
      onConnectedHandlers.length > 0
        ? async () => {
            for (const handler of onConnectedHandlers) {
              try {
                await handler()
              } catch (error) {
                console.error('[whatsappService.handlers.onConnected]', error)
              }
            }
          }
        : undefined,
    onClose:
      onCloseHandlers.length > 0
        ? async (payload) => {
            for (const handler of onCloseHandlers) {
              try {
                await handler(payload)
              } catch (error) {
                console.error('[whatsappService.handlers.onClose]', error)
              }
            }
          }
        : undefined
  }
}

const withDefaultHandlers = (
  sessionId: string,
  handlers: SessionHandlers
): SessionHandlers => {
  const typedHandlers = handlers as SessionHandlersWithDefaults
  if (typedHandlers?.[DEFAULT_HANDLERS_APPLIED]) {
    return handlers
  }

  const combined = mergeHandlers(createDefaultHandlers(sessionId), handlers)
  ;(combined as SessionHandlersWithDefaults)[DEFAULT_HANDLERS_APPLIED] = true
  return combined
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
  const customHandlersProvided = hasHandlers(handlers)
  const normalizedHandlers = withDefaultHandlers(sessionId, handlers)

  if (options.forceNew) {
    await teardownSession(sessionId, { keepCreds: false })
  } else {
    const existing = sessions.get(sessionId)
    if (existing) {
      if (customHandlersProvided) {
        existing.handlers = normalizedHandlers
      }
      return existing
    }

    const pending = sessionPromises.get(sessionId)
    if (pending) {
      if (customHandlersProvided) {
        pending
          .then((session) => {
            session.handlers = normalizedHandlers
          })
          .catch(() => {
            // ignored on purpose
          })
      }
      return pending
    }
  }

  const creation = createManagedSession(sessionId, normalizedHandlers)
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

  const { state, saveCreds } = await loadFirestoreAuthState(sessionId)
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

type UnknownRecord = Record<string, unknown>

const asRecord = (value: unknown): UnknownRecord => {
  if (typeof value === 'object' && value !== null) {
    return value as UnknownRecord
  }

  return {}
}

const getNestedValue = (source: UnknownRecord, path: readonly string[]) => {
  let current: unknown = source

  for (const key of path) {
    if (
      typeof current !== 'object' ||
      current === null ||
      !(key in (current as UnknownRecord))
    ) {
      return undefined
    }

    current = (current as UnknownRecord)[key]
  }

  return current
}

const toNumericCode = (value: string | number | null): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

const selectCodeValue = (
  ...values: unknown[]
): string | number | null => {
  for (const value of values) {
    if (typeof value === 'number' || typeof value === 'string') {
      return value
    }
  }

  return null
}

const normalizeDisconnect = (
  lastDisconnect: unknown,
  DisconnectReason: typeof import('@whiskeysockets/baileys').DisconnectReason
) => {
  const base = asRecord(lastDisconnect)
  const errorDetails = asRecord(base.error ?? base)

  const rawStatusCode = selectCodeValue(
    getNestedValue(errorDetails, ['output', 'statusCode']),
    getNestedValue(errorDetails, ['output', 'payload', 'statusCode']),
    getNestedValue(errorDetails, ['statusCode']),
    getNestedValue(errorDetails, ['code']),
    getNestedValue(base, ['statusCode']),
    getNestedValue(base, ['code'])
  )

  const numericStatusCode = toNumericCode(rawStatusCode)

  const reason =
    numericStatusCode === DisconnectReason.loggedOut
      ? 'logged-out'
      : numericStatusCode === DisconnectReason.restartRequired
      ? 'restart-required'
      : numericStatusCode === DisconnectReason.connectionReplaced
      ? 'replaced'
      : numericStatusCode === DisconnectReason.connectionClosed
      ? 'connection-closed'
      : numericStatusCode === DisconnectReason.timedOut
      ? 'timed-out'
      : 'unknown'

  const keepCreds = reason !== 'logged-out'
  const shouldRestart =
    reason === 'restart-required' || reason === 'connection-closed'

  const disconnectError = Object.assign(new Error('WA_CONNECTION_CLOSED'), {
    code: rawStatusCode ?? 'WA_CONNECTION_CLOSED',
    details: lastDisconnect
  })

  return {
    statusCode: rawStatusCode,
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
    detachListener(
      session.socket,
      'creds.update',
      session.saveCreds as unknown as (payload: CredsUpdatePayload) => void
    )

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

type BaileysEventEmitter = import('@whiskeysockets/baileys').BaileysEventEmitter

const detachListener = <Event extends keyof BaileysEventMap>(
  socket: WASocket,
  event: Event,
  listener: (payload: BaileysEventMap[Event]) => void
) => {
  const emitter = socket.ev as BaileysEventEmitter & {
    removeListener?: <E extends keyof BaileysEventMap>(
      eventName: E,
      handler: (payload: BaileysEventMap[E]) => void
    ) => void
  }

  if (typeof emitter.off === 'function') {
    emitter.off(event, listener)
    return
  }

  emitter.removeListener?.(event, listener)
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
