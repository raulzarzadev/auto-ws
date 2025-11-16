import { redirect } from 'next/navigation'

import { UserDashboardClient } from '@/components/app/user-dashboard'
import { instanceService } from '@/lib/services/instance-service'
import { getCurrentUser } from '@/lib/auth/server'

export default async function UserDashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/app')
  }

  const instances = await instanceService.listForOwner(user.id)

  // Force serialization to remove any prototype chains
  const cleanInstances = instances.map((inst) => ({
    id: inst.id,
    ownerId: inst.ownerId,
    label: inst.label,
    status: inst.status,
    qrCode: inst.qrCode,
    phoneNumber: inst.phoneNumber,
    createdAt: inst.createdAt,
    updatedAt: inst.updatedAt,
    apiKey: inst.apiKey,
    metadata: inst.metadata
  }))

  return <UserDashboardClient initialInstances={cleanInstances} />
}
