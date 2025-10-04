import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

const steps = [
  {
    title: '1. Crea un proyecto',
    description:
      'Conecta tu cuenta de Firebase y sincroniza usuarios automáticamente mediante auth.'
  },
  {
    title: '2. Genera instancias',
    description:
      'Crea instancias de WhatsApp y recibe el QR en segundos para vincular tu dispositivo.'
  },
  {
    title: '3. Monetiza con Stripe',
    description:
      'Configura planes y pasarelas de pago para cobrar a tus clientes desde tu dashboard.'
  }
]

export const Steps = () => (
  <section
    id="demo"
    className="mx-auto max-w-4xl rounded-3xl border border-slate-200/70 bg-white px-8 py-12 shadow-md dark:border-slate-800 dark:bg-slate-900"
  >
    <div className="mx-auto max-w-2xl text-center">
      <Badge className="bg-sky-600 text-white">Demo guiada</Badge>
      <h2 className="mt-4 text-3xl font-semibold">
        Implementa tu flujo en menos de 10 minutos
      </h2>
      <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
        Aprovecha la arquitectura opinionada para lanzar rápidamente sin
        sacrificar escalabilidad.
      </p>
    </div>
    <div className="mt-8 space-y-6">
      {steps.map((step, index) => (
        <Card
          key={step.title}
          className="border-slate-200/70 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/60"
        >
          <CardContent className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-lg font-semibold text-sky-600">
              {index + 1}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {step.description}
              </p>
            </div>
          </CardContent>
          {index < steps.length - 1 ? (
            <Separator className="mx-auto w-3/4" />
          ) : null}
        </Card>
      ))}
    </div>
  </section>
)
