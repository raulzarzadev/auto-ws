import { NextResponse } from 'next/server'

import {
  clearSessionCookie,
  createSessionCookie
} from '@/lib/auth/session-manager'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const idToken = typeof body?.idToken === 'string' ? body.idToken : null

    if (!idToken) {
      return NextResponse.json({ error: 'INVALID_ID_TOKEN' }, { status: 400 })
    }

    await createSessionCookie(idToken)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to create session', error)
    return NextResponse.json(
      { error: 'SESSION_CREATION_FAILED' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  await clearSessionCookie()
  return NextResponse.json({ success: true })
}
