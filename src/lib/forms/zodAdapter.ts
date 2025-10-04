import { ZodSchema } from 'zod'

type FormikErrors<T> = Partial<Record<keyof T, string>>

export const zodToFormikValidate =
  <T extends Record<string, unknown>>(schema: ZodSchema<T>) =>
  (values: T) => {
    const result = schema.safeParse(values)
    if (result.success) return {} as FormikErrors<T>

    return result.error.issues.reduce<FormikErrors<T>>((acc, issue) => {
      const path = issue.path.join('.') as keyof T
      if (!acc[path]) {
        acc[path] = issue.message as FormikErrors<T>[keyof T]
      }
      return acc
    }, {} as FormikErrors<T>)
  }
