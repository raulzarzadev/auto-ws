'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error boundary', error)
  }, [error])

  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[hsl(var(--background))] p-6 text-[hsl(var(--foreground))]">
        <div className="max-w-lg text-center">
          <h2 className="text-2xl font-semibold">Algo salió mal</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {error.message || 'Intenta recargar la página o vuelve más tarde.'}
          </p>
        </div>
        <Button onClick={() => reset()}>Reintentar</Button>
      </body>
    </html>
  )
}
