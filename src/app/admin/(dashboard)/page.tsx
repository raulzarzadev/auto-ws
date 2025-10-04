import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getSessionToken, verifySession } from '@/lib/auth/server'
import {
  fetchAllInstancesAction,
  fetchAllUsersAction
} from '@/lib/trpc/actions'
import { SummaryCard } from '@/components/admin/summary-cards'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminUserTable } from '@/components/admin/user-table'
import { AdminInstancesTable } from '@/components/admin/instances-table'

const SummarySkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <Skeleton key={index} className="h-32 w-full" />
    ))}
  </div>
)

const TableSkeleton = () => (
  <div className="mt-6 space-y-4">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
)

async function getDashboardData() {
  const token = await getSessionToken()
  const session = await verifySession(token ?? undefined)
  if (!session) {
    redirect('/login?redirect=/admin')
  }

  const [users, instances] = await Promise.all([
    fetchAllUsersAction(),
    fetchAllInstancesAction()
  ])

  return { users, instances }
}

export default async function AdminDashboardPage() {
  const dataPromise = getDashboardData()

  return (
    <div className="flex flex-col gap-12">
      <Suspense fallback={<SummarySkeleton />}>
        <SummarySection dataPromise={dataPromise} />
      </Suspense>

      <div className="grid gap-10 xl:grid-cols-[1.2fr_1fr]">
        <Suspense fallback={<TableSkeleton />}>
          <UsersSection dataPromise={dataPromise} />
        </Suspense>
        <Suspense fallback={<TableSkeleton />}>
          <InstancesSection dataPromise={dataPromise} />
        </Suspense>
      </div>
    </div>
  )
}

async function SummarySection({
  dataPromise
}: {
  dataPromise: Promise<Awaited<ReturnType<typeof getDashboardData>>>
}) {
  const { users, instances } = await dataPromise
  const activeInstances = instances.filter(
    (instance) => instance.status === 'connected'
  ).length
  const pendingInstances = instances.filter(
    (instance) => instance.status === 'pending'
  ).length

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        title="Usuarios"
        value={users.length}
        description="Cuentas registradas en la plataforma"
      />
      <SummaryCard
        title="Instancias totales"
        value={instances.length}
        description="Sesiones creadas en Baileys"
      />
      <SummaryCard
        title="Instancias activas"
        value={activeInstances}
        description="Conexiones listas para enviar mensajes"
      />
      <SummaryCard
        title="Instancias pendientes"
        value={pendingInstances}
        description="Esperando escanear código QR"
      />
    </div>
  )
}

async function UsersSection({
  dataPromise
}: {
  dataPromise: Promise<Awaited<ReturnType<typeof getDashboardData>>>
}) {
  const { users } = await dataPromise

  const fetchUsers = async () => users

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Usuarios</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Lista de cuentas registradas y su estado de acceso.
        </p>
      </div>
      <AdminUserTable fetchUsers={fetchUsers} />
    </div>
  )
}

async function InstancesSection({
  dataPromise
}: {
  dataPromise: Promise<Awaited<ReturnType<typeof getDashboardData>>>
}) {
  const { instances } = await dataPromise

  const fetchInstances = async () => instances

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Instancias de WhatsApp</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Controla el estado de cada sesión y consulta la información relevante.
        </p>
      </div>
      <AdminInstancesTable fetchInstances={fetchInstances} />
    </div>
  )
}
