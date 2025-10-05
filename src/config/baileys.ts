import 'server-only'

import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'

const SESSIONS_DIR = join(process.cwd(), '.data', 'whatsapp-sessions')

export const ensureSessionsDir = async () => {
  await mkdir(SESSIONS_DIR, { recursive: true })
  return SESSIONS_DIR
}

export const getSessionFilePath = async (sessionId: string) => {
  const baseDir = await ensureSessionsDir()
  const sessionDir = join(baseDir, sessionId)
  await mkdir(sessionDir, { recursive: true })
  return sessionDir
}

export const removeSessionData = async (sessionId: string) => {
  const baseDir = await ensureSessionsDir()
  const sessionDir = join(baseDir, sessionId)
  await rm(sessionDir, { recursive: true, force: true })
}
