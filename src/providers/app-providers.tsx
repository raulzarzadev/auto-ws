'use client'

import { PropsWithChildren } from 'react'

import { ReduxProvider } from '@/providers/redux-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { Toaster } from '@/components/shared/toaster'

export const AppProviders = ({ children }: PropsWithChildren) => (
  <ThemeProvider>
    <ReduxProvider>
      <ErrorBoundary>
        {children}
        <Toaster />
      </ErrorBoundary>
    </ReduxProvider>
  </ThemeProvider>
)
