import { ReactNode } from 'react'

import { requireRole } from '@/lib/auth/server'
import { AppShell } from '@/components/layout/app-shell'
export default async function AdminLayout({
  children
}: {
  children: ReactNode
}) {
  await requireRole('admin')

  return (
    <AppShell
      title="Panel de administración"
      description="Gestiona usuarios, instancias y estados de facturación"
    >
      {children}
    </AppShell>
  )
}
