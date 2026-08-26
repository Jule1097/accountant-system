"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'src/components/ui/dialog'
import { Button } from 'src/components/ui/button'
import { resolveClientSupplierDeleteTitle } from 'src/lib/helpers/client-supplier-ui'
import { ClientSupplierDeleteDialogProps } from 'src/types/client-supplier'

export function ClientSupplierDeleteDialog({
  isOpen,
  type,
  record,
  isDeleting,
  onOpenChange,
  onConfirm,
}: ClientSupplierDeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{resolveClientSupplierDeleteTitle(type)}</DialogTitle>
          <DialogDescription>
            {record
              ? `Vas a eliminar a ${record.name}. Esta acción no se puede deshacer.`
              : 'Esta acción no se puede deshacer.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
