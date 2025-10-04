'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'

import { SummaryCard } from '@/components/admin/summary-cards'
import { CreateInstanceForm } from '@/components/app/create-instance-form'
import {
  PendingAction,
  UserInstancesTable
} from '@/components/app/instances-table'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { fromNow } from '@/lib/date'
import { WhatsAppInstance } from '@/lib/types'
import {
  fetchUserInstancesAction,
  regenerateInstanceQrAction,
  updateInstanceStatusAction
} from '@/lib/trpc/actions'

interface UserDashboardClientProps {
  initialInstances: WhatsAppInstance[]
}

const statusMessage: Record<WhatsAppInstance['status'], string> = {
  connected: 'Instancia marcada como conectada',
  pending: 'Instancia en espera de conexión',
  disconnected: 'Instancia marcada como desconectada'
}

type Feedback = {
  type: 'success' | 'error'
  message: string
} | null

export const UserDashboardClient = ({
  initialInstances
}: UserDashboardClientProps) => {
  const [instances, setInstances] = useState(initialInstances)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [lastUpdated, setLastUpdated] = useState<string>(() =>
    new Date().toISOString()
  )
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [isRefreshing, startRefreshing] = useTransition()
  const [isMutating, startMutating] = useTransition()

  const summary = useMemo(() => {
    const total = instances.length
    const connected = instances.filter(
      (item) => item.status === 'connected'
    ).length
    const pending = instances.filter((item) => item.status === 'pending').length
    const disconnected = instances.filter(
      (item) => item.status === 'disconnected'
    ).length

    return { total, connected, pending, disconnected }
  }, [instances])

  const markUpdated = useCallback(() => {
    setLastUpdated(new Date().toISOString())
  }, [])

  const refreshInstances = useCallback(() => {
    startRefreshing(() => {
      void (async () => {
        try {
          const data = await fetchUserInstancesAction()
          setInstances(data)
          markUpdated()
          setFeedback(null)
        } catch (error) {
          console.error(error)
          setFeedback({
            type: 'error',
            message: 'No pudimos actualizar tus instancias. Intenta nuevamente.'
          })
        }
      })()
    })
  }, [markUpdated])

  const handleInstanceCreated = useCallback(
    (instance: WhatsAppInstance) => {
      setInstances((prev) => {
        const others = prev.filter((item) => item.id !== instance.id)
        return [instance, ...others]
      })
      markUpdated()
      setFeedback({
        type: 'success',
        message:
          'Instancia creada correctamente. Recuerda escanear el QR para finalizar la conexión.'
      })
    },
    [markUpdated]
  )

  const handleStatusChange = useCallback(
    (id: string, status: WhatsAppInstance['status']) => {
      setPendingAction({ id, type: 'status' })
      startMutating(() => {
        void (async () => {
          try {
            const updated = await updateInstanceStatusAction({ id, status })
            setInstances((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            )
            markUpdated()
            setFeedback({ type: 'success', message: statusMessage[status] })
          } catch (error) {
            console.error(error)
            setFeedback({
              type: 'error',
              message: 'No pudimos actualizar el estado de la instancia.'
            })
          } finally {
            setPendingAction(null)
          }
        })()
      })
    },
    [markUpdated]
  )

  const handleRegenerate = useCallback(
    (id: string) => {
      setPendingAction({ id, type: 'regenerate' })
      startMutating(() => {
        void (async () => {
          try {
            const updated = await regenerateInstanceQrAction({ id })
            setInstances((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            )
            markUpdated()
            setFeedback({
              type: 'success',
              message: 'Generamos un nuevo QR. Escanéalo desde tu dispositivo.'
            })
          } catch (error) {
            console.error(error)
            setFeedback({
              type: 'error',
              message: 'No pudimos regenerar el QR de la instancia.'
            })
          } finally {
            setPendingAction(null)
          }
        })()
      })
    },
    [markUpdated]
  )

  const handleInstanceSynced = useCallback(
    (instance: WhatsAppInstance) => {
      setInstances((prev) => {
        let changed = false
        const next = prev.map((item) => {
          if (item.id === instance.id) {
            if (
              item.updatedAt !== instance.updatedAt ||
              item.status !== instance.status ||
              item.qrCode !== instance.qrCode
            ) {
              changed = true
            }
            return instance
          }
          return item
        })

        if (changed) {
          markUpdated()
        }

        return next
      })
    },
    [markUpdated]
  )

  return (
    <div className="flex flex-col gap-10">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Resumen general</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Monitorea la salud de tus instancias y mantente al día con su
              estado.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span>Actualizado {fromNow(lastUpdated)}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={refreshInstances}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Instancias totales"
            value={summary.total}
            description="Incluye todas las sesiones creadas"
          />
          <SummaryCard
            title="Activas"
            value={summary.connected}
            description="Listas para enviar mensajes"
          />
          <SummaryCard
            title="Pendientes"
            value={summary.pending}
            description="Esperando escanear el código QR"
          />
          <SummaryCard
            title="Desconectadas"
            value={summary.disconnected}
            description="Finalizadas o en pausa"
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <CreateInstanceForm onCreated={handleInstanceCreated} />
        <Card className="h-full border-slate-200/70 shadow-sm dark:border-slate-700">
          <CardHeader>
            <CardTitle>¿Cómo conectar tu instancia?</CardTitle>
            <CardDescription>
              Sigue estos pasos para asegurar una conexión estable con tu
              dispositivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-3 pl-4 text-sm text-slate-600 dark:text-slate-300">
              <li>
                Abre WhatsApp en tu teléfono y ve a la sección de dispositivos
                vinculados.
              </li>
              <li>
                Selecciona "Vincular dispositivo" y escanea el código QR
                generado.
              </li>
              <li>
                Mantén tu teléfono con buena conectividad y energía para evitar
                desconexiones inesperadas.
              </li>
              <li>
                Si se pierde la conexión, usa "Regenerar QR" para crear una
                nueva sesión segura.
              </li>
            </ol>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Tus instancias</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestiona el estado de cada sesión, descarga un nuevo QR o desconecta
            aquellas que ya no necesitas.
          </p>
        </div>
        {feedback ? (
          <p
            className={
              feedback.type === 'success'
                ? 'text-sm text-emerald-600'
                : 'text-sm text-red-600'
            }
          >
            {feedback.message}
          </p>
        ) : null}
        <UserInstancesTable
          instances={instances}
          onStatusChange={handleStatusChange}
          onRegenerate={handleRegenerate}
          onInstanceUpdate={handleInstanceSynced}
          pendingAction={pendingAction}
          isMutating={isMutating}
        />
      </section>
    </div>
  )
}
