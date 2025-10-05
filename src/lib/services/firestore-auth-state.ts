'use server'

import { BufferJSON, initAuthCreds, proto } from '@whiskeysockets/baileys'

import { firebaseAdminDb } from '@/config/firebase-admin'

import type {
  AuthenticationCreds,
  AuthenticationState,
  SignalDataTypeMap
} from '@whiskeysockets/baileys'

const COLLECTION = 'whatsappAuthStates'

type FirestoreAuthDocument = {
  creds?: unknown
  keys?: Record<string, Record<string, unknown>>
  updatedAt?: string
}

const getAuthDocRef = (sessionId: string) =>
  firebaseAdminDb.collection(COLLECTION).doc(sessionId)

const serialize = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value, BufferJSON.replacer))

const deserialize = <T>(value: unknown): T =>
  value === undefined || value === null
    ? (value as T)
    : (JSON.parse(JSON.stringify(value), BufferJSON.reviver) as T)

const decodeKeys = (raw?: Record<string, Record<string, unknown>>) => {
  const decoded: Record<string, Record<string, unknown>> = {}

  if (!raw) {
    return decoded
  }

  for (const category of Object.keys(raw)) {
    decoded[category] = {}

    for (const id of Object.keys(raw[category]!)) {
      const value = raw[category]![id]
      decoded[category]![id] = deserialize(value)
    }
  }

  return decoded
}

export const useFirestoreAuthState = async (
  sessionId: string
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> => {
  const docRef = getAuthDocRef(sessionId)
  const snapshot = await docRef.get()
  const data = (snapshot.data() as FirestoreAuthDocument | undefined) ?? {}

  const creds: AuthenticationCreds = data.creds
    ? deserialize<AuthenticationCreds>(data.creds)
    : initAuthCreds()

  const keysStore = decodeKeys(data.keys)

  const persist = async (partial: Partial<FirestoreAuthDocument>) => {
    await docRef.set(
      {
        ...partial,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    )
  }

  const state: AuthenticationState = {
    creds,
    keys: {
      get: async (type, ids) => {
        const result: Record<string, SignalDataTypeMap[typeof type]> = {}

        for (const id of ids) {
          let value = keysStore?.[type]?.[id]

          if (type === 'app-state-sync-key' && value) {
            value = proto.Message.AppStateSyncKeyData.fromObject(value)
          }

          if (value) {
            result[id] = value as SignalDataTypeMap[typeof type]
          }
        }

        return result
      },
      set: async (data) => {
        let shouldPersist = false

        for (const category of Object.keys(data)) {
          const entries = data[category as keyof SignalDataTypeMap]
          if (!entries) continue

          if (!keysStore[category]) {
            keysStore[category] = {}
          }

          for (const id of Object.keys(entries)) {
            const value = entries[id]
            if (value) {
              keysStore[category]![id] = serialize(value)
            } else if (keysStore[category] && keysStore[category]![id]) {
              delete keysStore[category]![id]
            }
            shouldPersist = true
          }
        }

        if (shouldPersist) {
          await persist({ keys: serialize(keysStore) })
        }
      }
    }
  }

  return {
    state,
    saveCreds: async () => {
      await persist({ creds: serialize(creds) })
    }
  }
}

export const removeFirestoreAuthState = async (sessionId: string) => {
  const docRef = getAuthDocRef(sessionId)
  await docRef.delete().catch((error) => {
    console.error('[firestoreAuthState.remove]', error)
  })
}
