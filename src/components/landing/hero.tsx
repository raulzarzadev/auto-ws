import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const Hero = () => (
  <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-sky-500 to-indigo-600 px-8 py-20 text-white shadow-lg">
    <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-center">
      <div className="flex-1 space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-sm font-medium uppercase tracking-wide">
          Plataforma todo-en-uno
        </span>
        <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
          Automatiza tus flujos de WhatsApp con facturación integrada y control
          total.
        </h1>
        <p className="text-lg text-white/80">
          Crea instancias en segundos, gestiona usuarios desde un dashboard
          intuitivo y cobra con Stripe sin complicaciones.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="bg-white text-sky-600 hover:bg-slate-100"
          >
            <Link href="/app">Entrar al panel</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/40 bg-transparent text-white hover:bg-white/10"
          >
            <Link href="#demo">Ver demo rápida</Link>
          </Button>
        </div>
      </div>
      <div className="flex flex-1 justify-center lg:justify-end">
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white/10 p-6 backdrop-blur">
          <div className="space-y-4 text-sm text-white/80">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white">Instancias activas</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs">
                12
              </span>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-white/60">
                Nueva instancia
              </p>
              <p className="mt-2 text-base font-semibold text-white">
                WhatsApp ● Campaña Black Friday
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-emerald-200">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300" />{' '}
                Conectada hace 3 minutos
              </div>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-white/60">
                Stripe billing
              </p>
              <p className="mt-2 text-base font-semibold text-white">
                Plan Pro • USD 49/mes
              </p>
              <p className="mt-1 text-xs text-white/70">
                Renovación el 25 de octubre
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
)
