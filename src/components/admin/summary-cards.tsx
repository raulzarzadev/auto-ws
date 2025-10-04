import { ReactNode } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SummaryCardProps {
  title: string
  value: string | number
  description: string
  icon?: ReactNode
}

export const SummaryCard = ({
  title,
  value,
  description,
  icon
}: SummaryCardProps) => (
  <Card className="border-slate-200/60 dark:border-slate-700">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-semibold">{value}</div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </CardContent>
  </Card>
)
