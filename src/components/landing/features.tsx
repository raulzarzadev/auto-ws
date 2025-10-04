import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  LucideIcon,
  ShieldCheck,
  Bot,
  CreditCard,
  Zap,
  Clock,
  Layers
} from 'lucide-react'

interface Feature {
  title: string
  description: string
  icon: LucideIcon
  badge?: string
}

const features: Feature[] = [
  {
    title: 'Instancias ilimitadas',
    description:
      'Crea, pausa y elimina instancias de WhatsApp con un solo clic, listas para integrarse a tus bots.',
    icon: Bot,
    badge: 'Popular'
  },
  {
    title: 'Roles y permisos',
    description:
      'Administra cuentas de clientes y equipos con visibilidad completa del estado de cada sesión.',
    icon: ShieldCheck
  },
  {
    title: 'Cobros automáticos',
    description:
      'Conecta Stripe y genera suscripciones o pagos únicos en cuestión de minutos.',
    icon: CreditCard
  },
  {
    title: 'Automatizaciones con server actions',
    description:
      'Orquesta tareas en segundo plano sin servidores dedicados gracias a las server actions de Next.js.',
    icon: Zap
  },
  {
    title: 'Logs en tiempo real',
    description:
      'Consulta la actividad y los mensajes sincronizados desde Baileys para un soporte proactivo.',
    icon: Clock
  },
  {
    title: 'Integraciones modulares',
    description:
      'Extiende la plataforma con Firebase, webhooks y APIs externas manteniendo una arquitectura limpia.',
    icon: Layers
  }
]

export const Features = () => (
  <section
    id="caracteristicas"
    className="mx-auto flex max-w-6xl flex-col gap-10"
  >
    <div className="text-center">
      <Badge variant="secondary" className="mb-4">
        Para equipos que escalan rápido
      </Badge>
      <h2 className="text-3xl font-semibold md:text-4xl">
        Todo lo que necesitas para operar tus campañas
      </h2>
      <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
        Desde la creación de instancias hasta la facturación y la analítica,
        centraliza tus operaciones en una misma plataforma.
      </p>
    </div>
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {features.map((feature) => (
        <Card key={feature.title} className="border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-sky-100 p-2 text-sky-600">
              <feature.icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                {feature.title}
                {feature.badge ? (
                  <Badge className="bg-sky-600 text-white">
                    {feature.badge}
                  </Badge>
                ) : null}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {feature.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  </section>
)
