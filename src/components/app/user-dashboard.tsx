'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'

import { SummaryCard } from '@/components/admin/summary-cards'
import { CreateInstanceForm } from '@/components/app/create-instance-form'
import {
  PendingAction,
  UserInstancesTable
} from '@/components/app/instances-table'
import { Button } from '@/components/ui/button'
import { PhoneNumberInput } from '@/components/ui/phone-input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { fromNow } from '@/lib/date'
import { WhatsAppInstance } from '@/lib/types'
import {
  deleteInstanceAction,
  fetchUserInstancesAction,
  requestInstancePairingCodeAction,
  regenerateInstanceQrAction,
  startInstanceAction,
  sendInstanceTestMessageAction,
  updateInstanceStatusAction
} from '@/lib/trpc/actions'

interface UserDashboardClientProps {
  initialInstances: WhatsAppInstance[]
}

type Feedback = {
  type: 'success' | 'error'
  message: string
} | null

type TestMessageFormValues = {
  phone: string
  content: string
}

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
  const [testModalInstance, setTestModalInstance] =
    useState<WhatsAppInstance | null>(null)
  const [testModalError, setTestModalError] = useState<string | null>(null)
  const [testFormValues, setTestFormValues] = useState<TestMessageFormValues>(
    () => ({ phone: '', content: '' })
  )
  const [isSendingTest, setIsSendingTest] = useState(false)

  useEffect(() => {
    if (!testModalInstance && pendingAction?.type === 'test-message') {
      setPendingAction(null)
    }
  }, [pendingAction?.type, testModalInstance])

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
          'Instancia creada. Enciéndela cuando quieras generar el QR o el código de vinculación.'
      })
    },
    [markUpdated]
  )

  const handleStatusChange = useCallback(
    (id: string, status: 'disconnected') => {
      setPendingAction({ id, type: 'status' })
      startMutating(() => {
        void (async () => {
          try {
            const updated = await updateInstanceStatusAction({ id, status })
            setInstances((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            )
            markUpdated()
            setFeedback({
              type: 'success',
              message: 'Instancia apagada correctamente.'
            })
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

  const handleStartInstance = useCallback(
    (id: string) => {
      setPendingAction({ id, type: 'start' })
      startMutating(() => {
        void (async () => {
          try {
            const updated = await startInstanceAction({ id })
            setInstances((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            )
            markUpdated()
            setFeedback({
              type: 'success',
              message:
                'Encendimos la instancia. Abre el QR o solicita un código para vincularte.'
            })
          } catch (error) {
            console.error(error)
            const message =
              error instanceof Error
                ? error.message
                : 'No pudimos encender la instancia.'
            setFeedback({ type: 'error', message })
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
              message:
                'Reiniciamos la vinculación. Abre el QR o solicita un código numérico.'
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

  const handleRequestPairingCode = useCallback(
    (id: string) =>
      new Promise<string>((resolve, reject) => {
        setPendingAction({ id, type: 'pairing-code' })
        startMutating(() => {
          void (async () => {
            try {
              const { code } = await requestInstancePairingCodeAction({ id })
              markUpdated()
              setFeedback({
                type: 'success',
                message: 'Generamos un nuevo código de vinculación.'
              })
              resolve(code)
            } catch (error) {
              console.error(error)
              const message =
                error instanceof Error
                  ? error.message
                  : 'No pudimos generar el código de vinculación.'
              setFeedback({ type: 'error', message })
              reject(new Error(message))
            } finally {
              setPendingAction(null)
            }
          })()
        })
      }),
    [markUpdated]
  )

  const handleDeleteInstance = useCallback(
    (id: string) => {
      setPendingAction({ id, type: 'delete' })
      startMutating(() => {
        void (async () => {
          try {
            await deleteInstanceAction({ id })
            setInstances((prev) => prev.filter((item) => item.id !== id))
            markUpdated()
            setFeedback({
              type: 'success',
              message: 'Instancia eliminada correctamente.'
            })
          } catch (error) {
            console.error(error)
            setFeedback({
              type: 'error',
              message: 'No pudimos eliminar la instancia pendiente.'
            })
          } finally {
            setPendingAction(null)
          }
        })()
      })
    },
    [markUpdated]
  )

  const handleSendTestMessage = useCallback(
    (id: string) => {
      const instance = instances.find((item) => item.id === id)
      if (!instance) return

      setPendingAction({ id, type: 'test-message' })
      setTestModalInstance(instance)
      setTestModalError(null)
      setTestFormValues({
        phone: instance.phoneNumber ?? '',
        content: `Mensaje de prueba desde ${instance.label}.`
      })
    },
    [instances]
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

  const handleCloseTestModal = useCallback(() => {
    setTestModalInstance(null)
    setTestModalError(null)
    setIsSendingTest(false)
  }, [])

  const handleTestValueChange = useCallback(
    (field: keyof TestMessageFormValues, value: string) => {
      setTestFormValues((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleSubmitTestMessage = useCallback(async () => {
    if (!testModalInstance) return

    const phone = testFormValues.phone.trim()
    const content = testFormValues.content.trim()

    if (!phone) {
      setTestModalError('Ingresa un número de teléfono válido.')
      return
    }

    if (!content) {
      setTestModalError('Ingresa un mensaje de prueba.')
      return
    }

    setIsSendingTest(true)
    setTestModalError(null)
    setPendingAction({ id: testModalInstance.id, type: 'test-message' })

    try {
      await sendInstanceTestMessageAction({
        id: testModalInstance.id,
        phone,
        content
      })
      markUpdated()
      setFeedback({
        type: 'success',
        message: 'Mensaje de prueba enviado correctamente.'
      })
      handleCloseTestModal()
    } catch (error) {
      console.error(error)
      const message =
        error instanceof Error
          ? error.message
          : 'No pudimos enviar el mensaje de prueba.'
      setTestModalError(message)
      setFeedback({ type: 'error', message })
    } finally {
      setIsSendingTest(false)
      setPendingAction(null)
    }
  }, [
    handleCloseTestModal,
    markUpdated,
    testFormValues.content,
    testFormValues.phone,
    testModalInstance
  ])

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
            title="Apagadas"
            value={summary.disconnected}
            description="Instancias apagadas o en pausa"
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
                Desde el panel, enciende la instancia cuando necesites vincular
                un dispositivo.
              </li>
              <li>
                En WhatsApp abre la sección de dispositivos vinculados y toca
                “Vincular dispositivo”.
              </li>
              <li>
                Escanea el QR del modal o ingresa el código numérico que
                generamos para ti.
              </li>
              <li>
                Mantén tu teléfono con buena conectividad; si necesitas
                reiniciar, usa “Reiniciar QR”.
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
          onStart={handleStartInstance}
          onRegenerate={handleRegenerate}
          onInstanceUpdate={handleInstanceSynced}
          onDeleteInstance={handleDeleteInstance}
          onSendTestMessage={handleSendTestMessage}
          onRequestPairingCode={handleRequestPairingCode}
          pendingAction={pendingAction}
          isMutating={isMutating}
        />
      </section>
      <TestMessageModal
        instance={testModalInstance}
        open={Boolean(testModalInstance)}
        values={testFormValues}
        error={testModalError}
        isSubmitting={isSendingTest}
        onClose={handleCloseTestModal}
        onChange={handleTestValueChange}
        onSubmit={handleSubmitTestMessage}
      />
    </div>
  )
}

interface TestMessageModalProps {
  instance: WhatsAppInstance | null
  open: boolean
  values: TestMessageFormValues
  error: string | null
  isSubmitting: boolean
  onClose: () => void
  onChange: (field: keyof TestMessageFormValues, value: string) => void
  onSubmit: () => void
}

const TestMessageModal = ({
  instance,
  open,
  values,
  error,
  isSubmitting,
  onClose,
  onChange,
  onSubmit
}: TestMessageModalProps) => {
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

  if (!open || !instance) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Mensaje de prueba</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Envía un mensaje rápido a un número específico para verificar la
              instancia.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            type="button"
          >
            Cerrar
          </Button>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="test-message-phone">Número de teléfono</Label>
            <PhoneNumberInput
              id="test-message-phone"
              name="test-phone"
              value={values.phone ? values.phone : undefined}
              onChange={(value: string | undefined) =>
                onChange('phone', value ?? '')
              }
              placeholder="52 55 1234 5678"
              error={Boolean(error)}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Para números de México agregaremos el dígito adicional requerido
              automáticamente.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-message-content">Mensaje</Label>
            <Textarea
              id="test-message-content"
              value={values.content}
              onChange={(event) => onChange('content', event.target.value)}
              placeholder="Hola, esto es un mensaje de prueba."
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mantén el mensaje corto y claro; máximo 500 caracteres.
            </p>
          </div>

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
