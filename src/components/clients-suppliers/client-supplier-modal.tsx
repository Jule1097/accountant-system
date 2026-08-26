"use client"

import { useEffect } from 'react'
import { Button } from 'src/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from 'src/components/ui/dialog'
import { DialogLoadingState } from 'src/components/ui/dialog-loading-state'
import { Input } from 'src/components/ui/input'
import { useClientSupplierForm } from 'src/hooks/use-client-supplier-form'
import {
  resolveClientSupplierEntityLabel,
  resolveClientSupplierDetailTitle,
  resolveClientSupplierModalTitle,
} from 'src/lib/helpers/client-supplier-ui'
import {
  ClientSupplierDetailModalProps,
  ClientSupplierModalProps,
} from 'src/types/client-supplier'

export function ClientSupplierModal({
  isOpen,
  type,
  mode,
  isLoading = false,
  record,
  initialValues,
  onOpenChange,
  onSuccess,
  onResolveDuplicate,
}: ClientSupplierModalProps) {
  const {
    register,
    errors,
    isSubmitting,
    isSubmitDisabled,
    onSubmit,
  } = useClientSupplierForm({
    isOpen,
    type,
    mode,
    record,
    initialValues,
    onOpenChange,
    onSuccess,
    onResolveDuplicate,
  })

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{resolveClientSupplierModalTitle(type, mode)}</DialogTitle>
            <DialogDescription>
              Estamos preparando la información del registro seleccionado.
            </DialogDescription>
          </DialogHeader>
          <DialogLoadingState
            title={`Cargando ${resolveClientSupplierEntityLabel(type)}`}
            description="Estamos trayendo la información para editar el registro."
          />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{resolveClientSupplierModalTitle(type, mode)}</DialogTitle>
          <DialogDescription>
            Completá el nombre y el CUIT para {mode === 'edit' ? 'actualizar' : 'crear'} el registro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="client-supplier-name" className="text-sm font-medium text-foreground">Nombre</label>
            <Input id="client-supplier-name" {...register('name')} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="grid gap-2">
            <label htmlFor="client-supplier-cuit" className="text-sm font-medium text-foreground">CUIT</label>
            <Input id="client-supplier-cuit" {...register('cuit')} />
            {errors.cuit ? <p className="text-xs text-destructive">{errors.cuit.message}</p> : null}
          </div>
          <Button type="submit" className="w-full bg-[#FF5C00] text-white hover:bg-[#FF8A4C]" disabled={isSubmitDisabled}>
            {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Guardar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ClientSupplierDetailModal({
  isOpen,
  type,
  record,
  isLoading = false,
  error,
  onOpenChange,
  onLoadError,
}: ClientSupplierDetailModalProps) {
  useEffect(() => {
    if (!error) {
      return
    }

    onLoadError(error)
  }, [error, onLoadError])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{resolveClientSupplierDetailTitle(type)}</DialogTitle>
          <DialogDescription>Visualizá la información guardada del registro seleccionado.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <DialogLoadingState
            title={`Cargando ${resolveClientSupplierEntityLabel(type)}`}
            description="Estamos trayendo la información para mostrar el detalle."
          />
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">Nombre</span>
              <span className="text-sm text-foreground">{record?.name || '—'}</span>
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">CUIT</span>
              <span className="text-sm text-foreground">{record?.cuit || '—'}</span>
            </div>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
