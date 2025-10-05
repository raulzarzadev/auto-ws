'use client'

import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { WhatsAppInstance } from '@/lib/types'
import { fromNow } from '@/lib/date'

interface InstancesTableProps {
  fetchInstances: () => Promise<WhatsAppInstance[]>
}

const statusVariant: Record<
  WhatsAppInstance['status'],
  'secondary' | 'success' | 'destructive'
> = {
  pending: 'secondary',
  connected: 'success',
  disconnected: 'destructive'
}

export const AdminInstancesTable = ({
  fetchInstances
}: InstancesTableProps) => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchInstances()
      .then((data) => {
        if (active) setInstances(data)
      })
      .catch((err) => {
        console.error(err)
        if (active) setError('No pudimos obtener las instancias')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [fetchInstances])

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  if (instances.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Aún no existen instancias configuradas.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Etiqueta</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Creada</TableHead>
          <TableHead>Actualizada</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {instances.map((instance) => (
          <TableRow key={instance.id}>
            <TableCell className="font-medium">{instance.label}</TableCell>
            <TableCell>{instance.phoneNumber ?? 'Sin número'}</TableCell>
            <TableCell>
              <Badge variant={statusVariant[instance.status]}>
                {instance.status}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-slate-500">
              {fromNow(instance.createdAt)}
            </TableCell>
            <TableCell className="text-sm text-slate-500">
              {fromNow(instance.updatedAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
