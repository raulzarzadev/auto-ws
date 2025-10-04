'use client'

import { Suspense } from 'react'

import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'
import { Steps } from '@/components/landing/steps'
import { Pricing } from '@/components/landing/pricing'
import { FAQ } from '@/components/landing/faq'
import { FinalCTA } from '@/components/landing/cta'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { Skeleton } from '@/components/ui/skeleton'

const LandingLoading = () => (
  <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
    <Skeleton className="h-64 w-full" />
    <Skeleton className="h-48 w-full" />
  </div>
)

const LandingError = (error: Error, reset: () => void) => (
  <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
    <h2 className="text-xl font-semibold">No pudimos cargar la landing</h2>
    <p className="mt-2 text-sm">{error.message}</p>
    <button
      className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      onClick={reset}
    >
      Reintentar
    </button>
  </div>
)

const LandingSections = () => (
  <>
    <Hero />
    <Features />
    <Steps />
    <Pricing />
    <FAQ />
    <FinalCTA />
  </>
)

export const LandingMain = () => (
  <main className="flex flex-1 flex-col gap-24 px-6 pb-24 pt-16">
    <ErrorBoundary fallback={LandingError}>
      <Suspense fallback={<LandingLoading />}>
        <LandingSections />
      </Suspense>
    </ErrorBoundary>
  </main>
)
