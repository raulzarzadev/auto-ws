import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const plans = [
  {
    name: 'Starter',
    price: '19',
    description: 'Ideal para freelancers que manejan hasta 3 proyectos.',
    features: ['3 instancias activas', 'Logs básicos', 'Soporte por email'],
    cta: 'Empieza ahora',
    href: '/app'
  },
  {
    name: 'Growth',
    price: '49',
    description: 'El plan favorito de agencias con necesidades recurrentes.',
    features: [
      'Instancias ilimitadas',
      'Accesos multi-equipo',
      'Automatizaciones programadas'
    ],
    cta: 'Probar 14 días',
    href: '/checkout?plan=growth',
    popular: true
  },
  {
    name: 'Enterprise',
    price: '119',
    description:
      'Para organizaciones con compliance avanzado y SLAs dedicados.',
    features: [
      'Soporte 24/7',
      'Reportes personalizados',
      'Integraciones on-premise'
    ],
    cta: 'Hablar con ventas',
    href: 'mailto:ventas@auto-ws.com'
  }
]

export const Pricing = () => (
  <section id="precios" className="mx-auto flex max-w-6xl flex-col gap-10">
    <div className="text-center">
      <Badge variant="secondary" className="mb-4">
        Planes flexibles
      </Badge>
      <h2 className="text-3xl font-semibold md:text-4xl">
        Escala sin dolores administrativos
      </h2>
      <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
        Inicia con un plan mensual y evoluciona a medida que crecen tus
        operaciones.
      </p>
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      {plans.map((plan) => (
        <Card
          key={plan.name}
          className={`border-slate-200/70 shadow-sm transition-transform hover:-translate-y-1 dark:border-slate-700 ${
            plan.popular ? 'border-sky-500 shadow-xl' : ''
          }`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{plan.name}</CardTitle>
              {plan.popular ? (
                <Badge className="bg-sky-600 text-white">Recomendado</Badge>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {plan.description}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-4xl font-semibold">${plan.price}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {' '}
                /mes
              </span>
            </div>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-sky-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              asChild
              className="w-full"
              variant={plan.popular ? 'default' : 'secondary'}
            >
              <a href={plan.href}>{plan.cta}</a>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  </section>
)
