'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { doc, onSnapshot } from 'firebase/firestore'

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
import { firestore } from '@/config/firebase-client'
import { fromNow } from '@/lib/date'
import { WhatsAppInstance } from '@/lib/types'

type ActionType =
  | 'status'
  | 'regenerate'
  | 'delete'
  | 'test-message'
  | 'start'
  | 'pairing-code'

export type PendingAction = {
  id: string
  type: ActionType
} | null

interface UserInstancesTableProps {
  instances: WhatsAppInstance[]
  onStatusChange: (id: string, status: 'disconnected') => void
  onStart: (id: string) => void
  onRegenerate: (id: string) => void
  onInstanceUpdate: (instance: WhatsAppInstance) => void
  onDeleteInstance: (id: string) => void
  onSendTestMessage: (id: string) => void
  onRequestPairingCode: (id: string) => Promise<string>
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
  disconnected: 'Apagada'
}

export const UserInstancesTable = ({
  instances,
  onStatusChange,
  onStart,
  onRegenerate,
  onInstanceUpdate,
  onDeleteInstance,
  onSendTestMessage,
  onRequestPairingCode,
  pendingAction,
  isMutating
}: UserInstancesTableProps) => {
  const [modalInstanceId, setModalInstanceId] = useState<string | null>(null)
  const [autoStartInstanceId, setAutoStartInstanceId] = useState<string | null>(
    null
  )

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
    if (instance && instance.status === 'connected') {
      setModalInstanceId(null)
    }
  }, [modalInstanceId, sortedInstances])

  const isActionDisabled = (id: string, type: ActionType) =>
    isMutating && pendingAction?.id === id && pendingAction.type === type

  const handleModalClose = useCallback(() => {
    setModalInstanceId(null)
  }, [])

  useEffect(() => {
    if (!autoStartInstanceId) {
      return
    }

    if (
      pendingAction &&
      pendingAction.id === autoStartInstanceId &&
      pendingAction.type === 'start'
    ) {
      return
    }

    const refreshedInstance = sortedInstances.find(
      (item) => item.id === autoStartInstanceId
    )

    if (!refreshedInstance) {
      setAutoStartInstanceId(null)
      return
    }

    if (refreshedInstance.status === 'pending') {
      setModalInstanceId(autoStartInstanceId)
    }

    setAutoStartInstanceId(null)
  }, [autoStartInstanceId, pendingAction, sortedInstances])

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
          const isDisconnected = instance.status === 'disconnected'
          const isActionPending = (type: ActionType) =>
            pendingAction?.id === instance.id && pendingAction.type === type
          const isStarting = isActionPending('start')
          const isRegenerating = isActionPending('regenerate')
          const isDeleting = isActionPending('delete')
          const isDisconnecting = isActionPending('status')
          const isTesting = isActionPending('test-message')

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
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[instance.status]}>
                      {statusLabel[instance.status]}
                    </Badge>
                    <Button asChild size="icon" variant="ghost">
                      <Link href={`/app/instances/${instance.id}`}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </Link>
                    </Button>
                  </div>
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

                {isConnected ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-900/20 dark:text-emerald-100">
                    <p className="font-medium">
                      Instancia conectada y lista para enviar mensajes.
                    </p>
                    <p className="mt-1 text-emerald-700/90 dark:text-emerald-100/80">
                      Consulta los detalles de la API para integrar tus flujos.
                    </p>
                    <div className="mt-3 flex justify-end">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/app/instances/${instance.id}`}>
                          Ver detalles de la API
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : isPending ? (
                  <div className="rounded-lg border border-dashed border-sky-300 bg-sky-50/60 p-4 text-sm text-sky-700 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-200">
                    <p className="font-medium">
                      Instancia encendida, esperando vinculación.
                    </p>
                    <p className="mt-1 text-sky-600 dark:text-sky-100">
                      Abre el QR o solicita un código numérico para enlazar tu
                      teléfono.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-200">
                    <p className="font-medium">Instancia apagada.</p>
                    <p className="mt-1 text-slate-500 dark:text-slate-300">
                      Enciéndela para generar un nuevo QR o un código de enlace.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-wrap justify-end gap-2">
                {isDisconnected ? (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isActionDisabled(instance.id, 'start')}
                      onClick={() => {
                        setAutoStartInstanceId(instance.id)
                        onStart(instance.id)
                      }}
                    >
                      {isStarting ? 'Encendiendo…' : 'Encender'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isActionDisabled(instance.id, 'delete')}
                      onClick={() => onDeleteInstance(instance.id)}
                    >
                      {isDeleting ? 'Eliminando…' : 'Eliminar'}
                    </Button>
                  </>
                ) : null}

                {isPending ? (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setModalInstanceId(instance.id)}
                    >
                      Ver QR o código
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isActionDisabled(instance.id, 'regenerate')}
                      onClick={() => onRegenerate(instance.id)}
                    >
                      {isRegenerating ? 'Reiniciando…' : 'Reiniciar QR'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isActionDisabled(instance.id, 'status')}
                      onClick={() =>
                        onStatusChange(instance.id, 'disconnected')
                      }
                    >
                      {isDisconnecting ? 'Apagando…' : 'Apagar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isActionDisabled(instance.id, 'delete')}
                      onClick={() => onDeleteInstance(instance.id)}
                    >
                      {isDeleting ? 'Eliminando…' : 'Eliminar'}
                    </Button>
                  </>
                ) : null}

                {isConnected ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isActionDisabled(instance.id, 'status')}
                      onClick={() =>
                        onStatusChange(instance.id, 'disconnected')
                      }
                    >
                      {isDisconnecting ? 'Apagando…' : 'Apagar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isActionDisabled(instance.id, 'test-message')}
                      onClick={() => onSendTestMessage(instance.id)}
                    >
                      {isTesting ? 'Enviando…' : 'Enviar mensaje de prueba'}
                    </Button>
                  </>
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
        onRequestPairingCode={onRequestPairingCode}
        pendingAction={pendingAction}
      />
    </>
  )
}

interface QrModalProps {
  instance: WhatsAppInstance | null
  open: boolean
  onClose: () => void
  onInstanceUpdate: (instance: WhatsAppInstance) => void
  onRequestPairingCode: (id: string) => Promise<string>
  pendingAction: PendingAction
}

const QrModal = ({
  instance,
  open,
  onClose,
  onInstanceUpdate,
  onRequestPairingCode,
  pendingAction
}: QrModalProps) => {
  const [error, setError] = useState<string | null>(null)
  const isPairingPending = Boolean(
    instance &&
      pendingAction?.id === instance.id &&
      pendingAction.type === 'pairing-code'
  )
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [pairingError, setPairingError] = useState<string | null>(null)

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

  useEffect(() => {
    if (!open) {
      setPairingCode(null)
      setPairingError(null)
    }
  }, [open])

  useEffect(() => {
    if (!open || !instance) {
      return
    }

    // Guard: only run Firestore subscription on client side when Firebase is initialized
    if (typeof window === 'undefined' || !firestore) {
      return
    }

    setError(null)

    const reference = doc(firestore, 'instances', instance.id)
    const unsubscribe = onSnapshot(
      reference,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError('Esta instancia ya no está disponible.')
          return
        }

        const data = snapshot.data() as WhatsAppInstance
        onInstanceUpdate({ ...data, id: snapshot.id })
      },
      (err) => {
        console.error(err)
        setError('No pudimos escuchar cambios del QR en tiempo real.')
      }
    )

    return () => {
      unsubscribe()
    }
  }, [open, instance, onInstanceUpdate])

  useEffect(() => {
    if (!instance) {
      return
    }

    if (instance.status !== 'pending') {
      setPairingCode(null)
      setPairingError(null)
    }
  }, [instance])

  const handleRequestPairingCode = useCallback(async () => {
    if (!instance) {
      return
    }

    try {
      setPairingError(null)
      const code = await onRequestPairingCode(instance.id)
      setPairingCode(code)
    } catch (error) {
      setPairingCode(null)
      setPairingError(
        error instanceof Error
          ? error.message
          : 'No pudimos generar el código de enlace.'
      )
    }
  }, [instance, onRequestPairingCode])

  if (!open || !instance) {
    return null
  }

  const showQr = instance.status === 'pending' && Boolean(instance.qrCode)
  const formattedPairingCode =
    pairingCode
      ?.replace(/\s+/g, '')
      .match(/.{1,3}/g)
      ?.join(' ') ?? pairingCode

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
            {showQr && instance.qrCode ? (
              <Image
                src={instance.qrCode}
                alt={`Código QR para ${instance.label}`}
                width={240}
                height={240}
                unoptimized
                className="h-60 w-60 rounded-xl border border-white object-contain shadow-sm"
              />
            ) : (
              <p className="w-60 text-center text-sm text-slate-500">
                No hay un QR disponible en este momento. Si la sesión ya está
                conectada cerraremos automáticamente esta ventana.
              </p>
            )}
          </div>

          {instance.status === 'pending' ? (
            <div className="w-full max-w-xs rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-center text-sm text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-900/20 dark:text-indigo-100">
              <p className="font-medium">Código de vinculación</p>
              {formattedPairingCode ? (
                <p className="mt-3 text-2xl font-mono tracking-[0.3em]">
                  {formattedPairingCode}
                </p>
              ) : (
                <p className="mt-3 text-xs text-indigo-700/90 dark:text-indigo-100/70">
                  Si no puedes escanear el QR, solicita un código numérico y
                  captúralo en tu teléfono.
                </p>
              )}
              <div className="mt-4 flex justify-center">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleRequestPairingCode}
                  disabled={isPairingPending}
                >
                  {isPairingPending
                    ? 'Generando código...'
                    : formattedPairingCode
                    ? 'Actualizar código'
                    : 'Obtener código'}
                </Button>
              </div>
              {pairingError ? (
                <p className="mt-2 text-xs text-red-500">{pairingError}</p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              El QR se actualiza automáticamente cuando WhatsApp emite un nuevo
              código. Mantén esta ventana abierta para recibirlo al instante.
            </span>
            {error ? <span className="text-red-500">{error}</span> : null}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
