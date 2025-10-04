import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { AppProviders } from '@/providers/app-providers'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: {
    default: 'Auto WS Platform',
    template: '%s | Auto WS'
  },
  description: 'Gestión de instancias de WhatsApp con automatizaciones y pagos'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
