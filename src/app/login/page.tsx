'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut
} from 'firebase/auth'
import {
  Formik,
  Form,
  Field,
  type FormikHelpers,
  type FormikProps
} from 'formik'
import { z } from 'zod'

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { zodToFormikValidate } from '@/lib/forms/zodAdapter'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { firebaseAuth } from '@/config/firebase-client'

const EMAIL_STORAGE_KEY = 'auto-ws-email-for-sign-in'

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo válido')
})

type LoginValues = z.infer<typeof loginSchema>

type LoginMode = 'send-link' | 'confirm-link'
type LoginStatus = 'idle' | 'sending' | 'sent' | 'verifying' | 'error'

const initialValues: LoginValues = {
  email: ''
}

const LoginPageFallback = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--background))] px-6 py-10">
    <Card className="w-full max-w-md border-slate-200/70 shadow-lg dark:border-slate-800">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-semibold">
          Cargando formulario…
        </CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Preparando la verificación segura de acceso.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-10 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="h-10 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
      </CardFooter>
    </Card>
  </div>
)

const LoginPageContent = () => {
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect') ?? '/app'

  const [mode, setMode] = useState<LoginMode>('send-link')
  const [status, setStatus] = useState<LoginStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const formikRef = useRef<FormikProps<LoginValues>>(null)

  const createSessionFromToken = useCallback(async (idToken: string) => {
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      body: JSON.stringify({ idToken })
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error ?? 'SESSION_CREATION_FAILED')
    }
  }, [])

  const completeSignIn = useCallback(
    async (email: string) => {
      if (typeof window === 'undefined') return
      if (!email) {
        setErrorMessage('Ingresa tu correo para validar el enlace recibido.')
        setStatus('error')
        return
      }

      try {
        setStatus('verifying')
        setErrorMessage(null)

        const credential = await signInWithEmailLink(
          firebaseAuth,
          email,
          window.location.href
        )

        window.localStorage.removeItem(EMAIL_STORAGE_KEY)

        const idToken = await credential.user.getIdToken(true)
        await createSessionFromToken(idToken)
        await signOut(firebaseAuth)

        router.replace(redirect)
      } catch (error) {
        console.error(error)
        setErrorMessage('No pudimos validar el enlace. Solicita uno nuevo.')
        setStatus('error')
        setMode('send-link')
      }
    },
    [createSessionFromToken, redirect, router]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (isSignInWithEmailLink(firebaseAuth, window.location.href)) {
      setMode('confirm-link')
      const storedEmail = window.localStorage.getItem(EMAIL_STORAGE_KEY)
      if (storedEmail) {
        formikRef.current?.setFieldValue('email', storedEmail, false)
        void completeSignIn(storedEmail)
      }
    }
  }, [completeSignIn])

  const handleSubmit = async (
    values: LoginValues,
    helpers: FormikHelpers<LoginValues>
  ) => {
    if (mode === 'confirm-link') {
      await completeSignIn(values.email)
      helpers.setSubmitting(false)
      return
    }

    if (typeof window === 'undefined') {
      helpers.setSubmitting(false)
      return
    }
    try {
      setStatus('sending')
      setErrorMessage(null)

      const actionCodeSettings = {
        url: `${window.location.origin}/login?redirect=${encodeURIComponent(
          redirect
        )}`,
        handleCodeInApp: true
      }

      await sendSignInLinkToEmail(
        firebaseAuth,
        values.email,
        actionCodeSettings
      )
      window.localStorage.setItem(EMAIL_STORAGE_KEY, values.email)

      setStatus('sent')
      setMode('confirm-link')
    } catch (error) {
      console.error(error)
      setErrorMessage('No pudimos enviar el enlace. Intenta nuevamente.')
      setStatus('error')
    } finally {
      helpers.setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--background))] px-6 py-10">
      <ErrorBoundary>
        <Card className="w-full max-w-md border-slate-200/70 shadow-lg dark:border-slate-800">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-semibold">
              Accede a tu cuenta
            </CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Te enviaremos un enlace mágico a tu correo. No necesitas
              contraseña.
            </p>
          </CardHeader>
          <Formik<LoginValues>
            innerRef={formikRef}
            initialValues={initialValues}
            validate={zodToFormikValidate(loginSchema)}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form noValidate>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Field
                      as={Input}
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tu@correo.com"
                      autoComplete="email"
                      aria-invalid={touched.email && Boolean(errors.email)}
                      disabled={isSubmitting || status === 'verifying'}
                    />
                    {touched.email && errors.email ? (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.email}
                      </p>
                    ) : null}
                  </div>

                  {status === 'sent' ? (
                    <p className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800 dark:border-sky-900/70 dark:bg-sky-900/30 dark:text-sky-200">
                      Revisa tu bandeja de entrada y haz clic en el enlace para
                      continuar.
                    </p>
                  ) : null}

                  {status === 'verifying' ? (
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-900/30 dark:text-emerald-200">
                      Validando el enlace… un momento.
                    </p>
                  ) : null}

                  {errorMessage ? (
                    <p className="text-sm text-red-600" role="alert">
                      {errorMessage}
                    </p>
                  ) : null}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      isSubmitting ||
                      status === 'sending' ||
                      status === 'verifying'
                    }
                  >
                    {mode === 'confirm-link'
                      ? status === 'verifying'
                        ? 'Validando enlace…'
                        : 'Confirmar acceso'
                      : status === 'sending'
                      ? 'Enviando enlace…'
                      : 'Enviar enlace de acceso'}
                  </Button>
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                    ¿No tienes cuenta?{' '}
                    <Link
                      href="mailto:hola@auto-ws.com"
                      className="text-sky-600 hover:underline"
                    >
                      Escríbenos para habilitar tu acceso
                    </Link>
                    .
                  </p>
                </CardFooter>
              </Form>
            )}
          </Formik>
        </Card>
      </ErrorBoundary>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  )
}
