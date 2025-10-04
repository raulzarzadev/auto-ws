import * as React from 'react'

import { cn } from '@/lib/utils'

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'destructive'
  | 'outline'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-sky-100 text-sky-700',
  secondary: 'border-transparent bg-slate-100 text-slate-700',
  success: 'border-transparent bg-emerald-100 text-emerald-700',
  destructive: 'border-transparent bg-red-100 text-red-700',
  outline: 'border-slate-200 text-slate-700'
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
)
Badge.displayName = 'Badge'

export { Badge }
