'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { fromNow } from '@/lib/date'
import { WhatsAppInstance } from '@/lib/types'
import { fetchInstanceByIdAction } from '@/lib/trpc/actions'

type ActionType = 'status' | 'regenerate'

export type PendingAction = {
  id: string
  type: ActionType
} | null

interface UserInstancesTableProps {
  instances: WhatsAppInstance[]
  onStatusChange: (id: string, status: WhatsAppInstance['status']) => void
  onRegenerate: (id: string) => void
  onInstanceUpdate: (instance: WhatsAppInstance) => void
  pendingAction: PendingAction
  isMutating: boolean
}

const statusVariant: Record<
  WhatsAppInstance['status'],
  'success' | 'secondary' | 'destructive'
> = {
  connected: 'success',
  pending: 'secondary',
  disconnected: 'destructive'
}

const statusLabel: Record<WhatsAppInstance['status'], string> = {
  connected: 'Conectada',
  pending: 'Pendiente',
  disconnected: 'Desconectada'
}

const POLLING_INTERVAL = 7000

export const UserInstancesTable = ({
  instances,
  onStatusChange,
  onRegenerate,
  onInstanceUpdate,
  pendingAction,
  isMutating
}: UserInstancesTableProps) => {
  const [modalInstanceId, setModalInstanceId] = useState<string | null>(null)

  const sortedInstances = useMemo(
    () =>
      [...instances].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [instances]
  )

  const activeInstance = useMemo(
    () =>
      modalInstanceId
        ? sortedInstances.find((item) => item.id === modalInstanceId) ?? null
        : null,
    [modalInstanceId, sortedInstances]
  )

  useEffect(() => {
    if (!modalInstanceId) return

    const instance = sortedInstances.find((item) => item.id === modalInstanceId)
    if (instance && instance.status !== 'pending') {
      setModalInstanceId(null)
    }
  }, [modalInstanceId, sortedInstances])

  const isActionDisabled = (id: string, type: ActionType) =>
    isMutating && pendingAction?.id === id && pendingAction.type === type

  const handleModalClose = useCallback(() => {
    setModalInstanceId(null)
  }, [])

  if (sortedInstances.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Aún no has creado instancias. Usa el formulario para generar la primera.
      </p>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedInstances.map((instance) => {
          const isPending = instance.status === 'pending'
          const isConnected = instance.status === 'connected'
          return (
            <Card
              key={instance.id}
              className="border-slate-200/70 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700"
            >
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{instance.label}</CardTitle>
                    <CardDescription>
                      Creada {fromNow(instance.createdAt)}
                    </CardDescription>
                  </div>
                  <Badge variant={statusVariant[instance.status]}>
                    {statusLabel[instance.status]}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Actualizada {fromNow(instance.updatedAt)}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1 text-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Teléfono asignado
                  </p>
                  <p className="text-base text-slate-900 dark:text-slate-100">
                    {instance.phoneNumber ?? 'Sin número registrado'}
                  </p>
                </div>

                {isPending ? (
                  <div className="rounded-lg border border-dashed border-sky-300 bg-sky-50/60 p-4 text-sm text-sky-700 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-200">
                    <p className="font-medium">Generamos un nuevo QR.</p>
                    <p className="mt-1 text-sky-600 dark:text-sky-100">
                      Escanéalo desde tu dispositivo para completar la conexión.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setModalInstanceId(instance.id)}
                      >
                        Ver QR
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isActionDisabled(instance.id, 'regenerate')}
                        onClick={() => onRegenerate(instance.id)}
                      >
                        Regenerar QR
                      </Button>
                    </div>
                  </div>
                ) : isConnected ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                    <p className="font-medium">
                      Listo para integrarse con tu API personalizada.
                    </p>
                    <p className="mt-1">
                      Comparte el endpoint seguro para que tu equipo envíe
                      mensajes usando el API Key único de esta instancia.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild size="sm">
                        <Link href={`/app/instances/${instance.id}`}>
                          Ver detalles de la API
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isActionDisabled(instance.id, 'regenerate')}
                        onClick={() => onRegenerate(instance.id)}
                      >
                        Regenerar QR
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No hay código QR activo para este estado. Puedes regenerarlo
                    en caso de necesitar una nueva vinculación.
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex flex-wrap justify-end gap-2">
                {!isConnected ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={
                      instance.status === 'connected' ||
                      isActionDisabled(instance.id, 'status')
                    }
                    onClick={() => onStatusChange(instance.id, 'connected')}
                  >
                    Marcar conectada
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={
                    instance.status === 'disconnected' ||
                    isActionDisabled(instance.id, 'status')
                  }
                  onClick={() => onStatusChange(instance.id, 'disconnected')}
                >
                  Desconectar
                </Button>
                {!isPending && !isConnected ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={
                      instance.status === 'connected' ||
                      isActionDisabled(instance.id, 'regenerate')
                    }
                    onClick={() => onRegenerate(instance.id)}
                  >
                    Regenerar QR
                  </Button>
                ) : null}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <QrModal
        instance={activeInstance}
        open={Boolean(activeInstance)}
        onClose={handleModalClose}
        onInstanceUpdate={onInstanceUpdate}
      />
    </>
  )
}

interface QrModalProps {
  instance: WhatsAppInstance | null
  open: boolean
  onClose: () => void
  onInstanceUpdate: (instance: WhatsAppInstance) => void
}

const QrModal = ({
  instance,
  open,
  onClose,
  onInstanceUpdate
}: QrModalProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  const refreshInstance = useCallback(async () => {
    if (!instance) return

    setIsRefreshing(true)
    try {
      const updated = await fetchInstanceByIdAction({ id: instance.id })
      onInstanceUpdate(updated)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('No pudimos refrescar el QR automáticamente.')
    } finally {
      setIsRefreshing(false)
    }
  }, [instance, onInstanceUpdate])

  useEffect(() => {
    if (!open || !instance || instance.status !== 'pending') {
      return
    }

    let active = true

    const fetchLatest = async () => {
      if (!active) return
      await refreshInstance()
    }

    void fetchLatest()
    const interval = window.setInterval(fetchLatest, POLLING_INTERVAL)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [open, instance, refreshInstance])

  if (!open || !instance) {
    return null
  }

  const showQr = instance.status === 'pending' && Boolean(instance.qrCode)

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">
              Escanea el código de {instance.label}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mantén la app abierta mientras sincronizamos el QR.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          >
            Cerrar
          </Button>
        </div>

        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
            {showQr ? (
              <img
                src={instance.qrCode ?? ''}
                alt={`Código QR para ${instance.label}`}
                className="h-60 w-60 rounded-xl border border-white object-contain shadow-sm"
              />
            ) : (
              <p className="w-60 text-center text-sm text-slate-500">
                No hay un QR disponible en este momento. Si la sesión ya está
                conectada cerraremos automáticamente esta ventana.
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Actualizamos el código cada pocos segundos para garantizar la
              validez del enlace.
            </span>
            {isRefreshing ? (
              <span className="text-sky-600 dark:text-sky-300">
                Refrescando QR...
              </span>
            ) : null}
            {error ? <span className="text-red-500">{error}</span> : null}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
