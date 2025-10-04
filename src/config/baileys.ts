import 'server-only'

import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const SESSIONS_DIR = join(process.cwd(), '.data', 'whatsapp-sessions')

export const ensureSessionsDir = async () => {
  await mkdir(SESSIONS_DIR, { recursive: true })
  return SESSIONS_DIR
}

export const getSessionFilePath = async (sessionId: string) => {
  const dir = await ensureSessionsDir()
  return join(dir, `${sessionId}.json`)
}
