'use server'

import { revalidatePath } from 'next/cache'

import { requireSession } from '@/lib/auth/server'
import { userService } from '@/lib/services/user-service'
import { instanceService } from '@/lib/services/instance-service'
import {
  CreateInstanceInput,
  InstanceIdInput,
  SendTestMessageInput,
  UpdateInstanceStatusInput,
  createInstanceSchema,
  instanceIdSchema,
  sendTestMessageSchema,
  updateInstanceStatusSchema
} from '@/lib/validators/instance'

export const fetchAllUsersAction = async () => userService.listAll()
export const fetchAllInstancesAction = async () => instanceService.listAll()

export const fetchUserInstancesAction = async () => {
  const user = await requireSession()
  return instanceService.listForOwner(user.id)
}

export const fetchInstanceByIdAction = async (input: InstanceIdInput) => {
  const user = await requireSession()
  const data = instanceIdSchema.parse(input)
  return instanceService.getOwnedInstance(user.id, data.id)
}

export const createInstanceAction = async (input: CreateInstanceInput) => {
  const user = await requireSession()

  const data = createInstanceSchema.parse(input)
  const instance = await instanceService.create(user.id, data)
  revalidatePath('/app')
  return instance
}

export const startInstanceAction = async (input: InstanceIdInput) => {
  const user = await requireSession()
  const data = instanceIdSchema.parse(input)

  const instance = await instanceService.start(user.id, data.id)
  revalidatePath('/app')
  return instance
}

export const deleteInstanceAction = async (input: InstanceIdInput) => {
  const user = await requireSession()
  const data = instanceIdSchema.parse(input)

  await instanceService.deletePendingInstance(user.id, data.id)
  revalidatePath('/app')
}

export const updateInstanceStatusAction = async (
  input: UpdateInstanceStatusInput
) => {
  const user = await requireSession()
  const data = updateInstanceStatusSchema.parse(input)

  const instance = await instanceService.updateStatus(
    user.id,
    data.id,
    data.status
  )
  revalidatePath('/app')
  return instance
}

export const regenerateInstanceQrAction = async (input: InstanceIdInput) => {
  const user = await requireSession()
  const data = instanceIdSchema.parse(input)

  const instance = await instanceService.regenerateQr(user.id, data.id)
  revalidatePath('/app')
  return instance
}

export const requestInstancePairingCodeAction = async (
  input: InstanceIdInput
) => {
  const user = await requireSession()
  const data = instanceIdSchema.parse(input)

  return instanceService.requestPairingCode(user.id, data.id)
}

export const sendInstanceTestMessageAction = async (
  input: SendTestMessageInput
) => {
  const user = await requireSession()
  const data = sendTestMessageSchema.parse(input)

  return instanceService.sendTestMessage(user.id, data)
}
