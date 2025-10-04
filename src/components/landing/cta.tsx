import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const FinalCTA = () => (
  <section className="mx-auto max-w-4xl rounded-3xl bg-slate-900 px-10 py-16 text-white shadow-xl dark:bg-slate-950">
    <div className="flex flex-col items-center gap-6 text-center">
      <h2 className="text-3xl font-semibold md:text-4xl">
        Listo para lanzar tu próxima automatización
      </h2>
      <p className="max-w-2xl text-base text-white/70">
        Empieza gratis, migra tus proyectos existentes y escala con la
        infraestructura de auto-ws. Sin costos ocultos, sin dolores operativos.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          asChild
          size="lg"
          className="bg-white text-slate-900 hover:bg-slate-100"
        >
          <Link href="/login">Crear cuenta</Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="ghost"
          className="border border-white/30 text-white hover:bg-white/10"
        >
          <Link href="mailto:hola@auto-ws.com?subject=Quiero%20una%20demo">
            Solicitar demo
          </Link>
        </Button>
      </div>
    </div>
  </section>
)
