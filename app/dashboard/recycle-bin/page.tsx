'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TableSkeleton } from '@/components/loaders/TableSkeleton'
import { useDeletedFilesQuery, useRestoreFileMutation, useDeleteFileMutation } from '@/hooks/useFiles'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Trash2, RotateCcw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { formatBytes } from '@/lib/utils'
import { useAuth } from '@/contexts/auth'
import { ResponsiveContainer } from '@/components/ResponsiveContainer'

export default function RecycleBinPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const { data, isLoading } = useDeletedFilesQuery({
    page,
    limit: 20,
    showAll: user?.role === 'admin',
  })

  const { mutate: restore } = useRestoreFileMutation()
  const { mutate: deletePermanently } = useDeleteFileMutation()

  const handleRestore = (fileId: string) => {
    restore(fileId)
  }

  const handleDelete = (fileId: string) => {
    deletePermanently({ fileId, permanent: true })
    setDeleteConfirm(null)
  }

  return (
    <ResponsiveContainer>
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="border-b border-border p-6 space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Recycle Bin</h1>
        <p className="text-muted-foreground">Deleted files are retained for 30 days before permanent removal</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <TableSkeleton rows={5} columns={4} />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Deleted</TableHead>
                  <TableHead>Expires In</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.files && data.files.length > 0 ? (
                  data.files.map((file) => {
                    const expiresAt = file.deletedAt
                      ? new Date(new Date(file.deletedAt).getTime() + 30 * 24 * 60 * 60 * 1000)
                      : null

                    return (
                      <TableRow key={file.fileId}>
                         <TableCell className="font-medium">{file.name}</TableCell>
                         <TableCell>{formatBytes(0)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(file.deletedAt || ''), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          {expiresAt && (
                            <Badge variant={formatDistanceToNow(expiresAt).includes('day') ? 'default' : 'destructive'}>
                              {formatDistanceToNow(expiresAt, { addSuffix: true })}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestore(file.fileId)}
                            className="gap-1"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteConfirm(file.fileId)}
                            className="gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">Recycle bin is empty</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete File?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The file will be permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Permanently Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </ResponsiveContainer>
)
}
