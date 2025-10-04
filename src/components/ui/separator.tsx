import { cn } from '@/lib/utils'

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
}

export const Separator = ({
  className,
  orientation = 'horizontal',
  decorative = true,
  role,
  ...props
}: SeparatorProps) => (
  <div
    role={decorative ? 'presentation' : role ?? 'separator'}
    data-orientation={orientation}
    className={cn(
      'shrink-0 bg-slate-200 dark:bg-slate-800',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      className
    )}
    {...props}
  />
)
