'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { AppUser } from '@/lib/types'
import { fromNow } from '@/lib/date'

interface AdminUserTableProps {
  fetchUsers: () => Promise<AppUser[]>
}

export const AdminUserTable = ({ fetchUsers }: AdminUserTableProps) => {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchUsers()
      .then((data) => {
        if (active) {
          setUsers(data)
        }
      })
      .catch((err) => {
        console.error(err)
        if (active) {
          setError('No pudimos obtener los usuarios')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [fetchUsers])

  const hasUsers = users.length > 0

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

  if (!hasUsers) {
    return (
      <p className="text-sm text-slate-500">
        No hay usuarios registrados todavía.
      </p>
    )
  }

  const rows = useMemo(
    () =>
      users.map((user) => (
        <TableRow key={user.id}>
          <TableCell className="font-medium">
            {user.displayName || user.email}
          </TableCell>
          <TableCell>{user.email}</TableCell>
          <TableCell>
            <Badge variant={user.role === 'admin' ? 'success' : 'secondary'}>
              {user.role}
            </Badge>
          </TableCell>
          <TableCell className="text-sm text-slate-500">
            {fromNow(user.createdAt)}
          </TableCell>
          <TableCell className="text-sm text-slate-500">
            {user.lastLoginAt ? fromNow(user.lastLoginAt) : 'Sin registro'}
          </TableCell>
        </TableRow>
      )),
    [users]
  )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Correo</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Alta</TableHead>
          <TableHead>Último acceso</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>{rows}</TableBody>
    </Table>
  )
}
