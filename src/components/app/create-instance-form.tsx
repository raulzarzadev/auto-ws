'use client'

import { useState } from 'react'
import { Formik, Form, Field } from 'formik'
import type { FieldProps } from 'formik'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PhoneNumberInput } from '@/components/ui/phone-input'
import { zodToFormikValidate } from '@/lib/forms/zodAdapter'
import { createInstanceAction } from '@/lib/trpc/actions'
import {
  CreateInstanceInput,
  createInstanceSchema
} from '@/lib/validators/instance'
import { WhatsAppInstance } from '@/lib/types'

interface CreateInstanceFormProps {
  onCreated: (instance: WhatsAppInstance) => void
}

const initialValues: CreateInstanceInput = {
  label: '',
  phoneNumber: ''
}

export const CreateInstanceForm = ({ onCreated }: CreateInstanceFormProps) => {
  const [serverError, setServerError] = useState<string | null>(null)
  const [serverSuccess, setServerSuccess] = useState<string | null>(null)

  return (
    <Card className="h-full border-slate-200/70 shadow-sm dark:border-slate-700">
      <CardHeader>
        <CardTitle>Crea una nueva instancia</CardTitle>
        <CardDescription>
          Genera una sesión vinculada a tu cuenta y enciéndela cuando estés
          listo. Podrás vincular tu dispositivo escaneando un QR o usando un
          código numérico.
        </CardDescription>
      </CardHeader>
      <Formik<CreateInstanceInput>
        initialValues={initialValues}
        validate={zodToFormikValidate(createInstanceSchema)}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          try {
            setServerError(null)
            setServerSuccess(null)
            const instance = await createInstanceAction(values)
            onCreated(instance)
            setServerSuccess(
              'Instancia creada. Enciéndela desde el panel para generar un QR o código de enlace.'
            )
            resetForm()
          } catch (error) {
            console.error(error)
            setServerSuccess(null)
            setServerError(
              error instanceof Error
                ? error.message
                : 'No pudimos crear la instancia.'
            )
          } finally {
            setSubmitting(false)
          }
        }}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form noValidate>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">Nombre interno</Label>
                <Field
                  as={Input}
                  id="label"
                  name="label"
                  placeholder="Campaña de bienvenida"
                  aria-invalid={touched.label && Boolean(errors.label)}
                />
                {touched.label && errors.label ? (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.label}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Número vinculado</Label>
                <Field name="phoneNumber">
                  {({ field, form }: FieldProps<string>) => (
                    <PhoneNumberInput
                      id="phoneNumber"
                      name={field.name}
                      value={field.value || undefined}
                      onChange={(value: string | undefined) =>
                        form.setFieldValue(field.name, value ?? '')
                      }
                      onBlur={() => form.setFieldTouched(field.name, true)}
                      placeholder="52 55 1234 5678"
                      error={touched.phoneNumber && Boolean(errors.phoneNumber)}
                    />
                  )}
                </Field>
                {touched.phoneNumber && errors.phoneNumber ? (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.phoneNumber}
                  </p>
                ) : null}
              </div>
              {serverError ? (
                <p className="text-sm text-red-600" role="alert">
                  {serverError}
                </p>
              ) : null}
              {serverSuccess ? (
                <p className="text-sm text-emerald-600" role="status">
                  {serverSuccess}
                </p>
              ) : null}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creando instancia...' : 'Crear instancia'}
              </Button>
            </CardFooter>
          </Form>
        )}
      </Formik>
    </Card>
  )
}
