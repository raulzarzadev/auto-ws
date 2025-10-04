'use server'

import { revalidatePath } from 'next/cache'

import { instanceService } from '@/lib/services/instance-service'
import { getSessionToken, verifySession } from '@/lib/auth/server'
import { ValidationError, UnauthorizedError } from '@/lib/errors'
import { createInstanceSchema } from '@/lib/validators/instance'

export const createInstanceAction = async (input: unknown) => {
  const token = await getSessionToken()
  const user = await verifySession(token ?? undefined)
  if (!user) {
    throw new UnauthorizedError()
  }

  const parsed = createInstanceSchema.safeParse(input)
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues.map((issue) => issue.message))
  }

  const instance = await instanceService.create(user.id, parsed.data)
  revalidatePath('/app')
  return instance
}
