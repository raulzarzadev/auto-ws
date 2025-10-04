import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const formatCurrency = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency
  }).format(value)
