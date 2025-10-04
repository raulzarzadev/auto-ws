import Link from 'next/link'

export const LandingFooter = () => (
  <footer className="mt-16 border-t border-slate-200/60 py-10 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
      <p>
        © {new Date().getFullYear()} auto-ws. Todos los derechos reservados.
      </p>
      <div className="flex items-center gap-4">
        <Link
          href="mailto:hola@auto-ws.com"
          className="hover:text-slate-700 dark:hover:text-slate-200"
        >
          Contacto
        </Link>
        <Link
          href="/terminos"
          className="hover:text-slate-700 dark:hover:text-slate-200"
        >
          Términos
        </Link>
        <Link
          href="/privacidad"
          className="hover:text-slate-700 dark:hover:text-slate-200"
        >
          Privacidad
        </Link>
      </div>
    </div>
  </footer>
)
