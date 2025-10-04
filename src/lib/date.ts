import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export const formatDate = (date: Date | string, pattern = 'dd MMM yyyy') =>
  format(typeof date === 'string' ? parseISO(date) : date, pattern, {
    locale: es
  })

export const fromNow = (date: Date | string) =>
  formatDistanceToNow(typeof date === 'string' ? parseISO(date) : date, {
    addSuffix: true,
    locale: es
  })
