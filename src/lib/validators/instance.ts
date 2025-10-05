import { z } from 'zod'

export const createInstanceSchema = z.object({
  label: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  phoneNumber: z
    .string()
    .min(8, 'Ingresa un número válido')
    .regex(/^[0-9+\s-]+$/, 'Solo números, espacios y guiones')
})

export const updateInstanceStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['pending', 'connected', 'disconnected'])
})

export const sendTestMessageSchema = z.object({
  id: z.string().min(1, 'Identificador inválido'),
  phone: z
    .string()
    .min(8, 'Ingresa un número válido')
    .regex(/^[0-9+\s-]+$/, 'Solo números, espacios, + y guiones'),
  content: z
    .string()
    .min(1, 'Escribe el mensaje de prueba')
    .max(500, 'El mensaje no puede exceder 500 caracteres')
})

export type CreateInstanceInput = z.infer<typeof createInstanceSchema>
export type UpdateInstanceStatusInput = z.infer<
  typeof updateInstanceStatusSchema
>
export type SendTestMessageInput = z.infer<typeof sendTestMessageSchema>

export const instanceIdSchema = z.object({
  id: z.string().min(1, 'Identificador inválido')
})

export type InstanceIdInput = z.infer<typeof instanceIdSchema>
