import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/theme-toggle'

const links = [
  { href: '#caracteristicas', label: 'Características' },
  { href: '#demo', label: 'Cómo funciona' },
  { href: '#precios', label: 'Precios' },
  { href: '#faq', label: 'FAQ' }
]

export const Navbar = () => (
  <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
    <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
      <Link
        href="/"
        className="text-lg font-semibold text-slate-900 dark:text-white"
      >
        auto-ws
      </Link>
      <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Button asChild size="sm" variant="secondary">
          <Link href="/login">Acceder</Link>
        </Button>
      </div>
    </div>
  </header>
)
