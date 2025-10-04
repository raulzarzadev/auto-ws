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

  return <UserDashboardClient initialInstances={instances} />
}
