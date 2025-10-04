'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { PropsWithChildren } from 'react'

export const ThemeProvider = ({ children }: PropsWithChildren) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
  >
    {children}
  </NextThemesProvider>
)
