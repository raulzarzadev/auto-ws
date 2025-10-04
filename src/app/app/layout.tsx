import { ReactNode } from 'react'
import { redirect } from 'next/navigation'

import { AppShell } from '@/components/layout/app-shell'
import { Badge } from '@/components/ui/badge'
import { getCurrentUser } from '@/lib/auth/server'

export default async function UserAppLayout({
  children
}: {
  children: ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/app')
  }

  return (
    <AppShell
      title="Mis instancias"
      description="Crea, conecta y monitorea tus sesiones de WhatsApp"
      actions={
        <div className="flex items-center gap-3 rounded-lg border border-slate-200/70 bg-white/60 px-4 py-2 text-left shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {user.displayName || user.email}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user.email}
            </p>
          </div>
          <Badge variant={user.role === 'admin' ? 'secondary' : 'default'}>
            {user.role}
          </Badge>
        </div>
      }
    >
      {children}
    </AppShell>
  )
}
