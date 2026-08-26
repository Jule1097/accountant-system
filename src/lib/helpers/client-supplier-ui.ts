import {
  ClientSupplierEntityType,
  ClientSupplierModalMode,
  ClientSupplierSortBy,
  ClientSupplierSortOrder,
} from 'src/types/client-supplier'

export function resolveClientSupplierEntityLabel(type: ClientSupplierEntityType): string {
  return type === 'clients' ? 'cliente' : 'proveedor'
}

export function resolveClientSupplierModalTitle(
  type: ClientSupplierEntityType,
  mode: Exclude<ClientSupplierModalMode, 'view'>
): string {
  if (mode === 'edit') {
    return `Editar ${resolveClientSupplierEntityLabel(type)}`
  }

  return `Agregar ${resolveClientSupplierEntityLabel(type)}`
}

export function resolveClientSupplierSuccessTitle(
  type: ClientSupplierEntityType,
  mode: Exclude<ClientSupplierModalMode, 'view'>
): string {
  if (mode === 'edit') {
    return type === 'clients' ? 'Cliente actualizado' : 'Proveedor actualizado'
  }

  return type === 'clients' ? 'Cliente guardado' : 'Proveedor guardado'
}

export function resolveClientSupplierSuccessDescription(
  type: ClientSupplierEntityType,
  mode: Exclude<ClientSupplierModalMode, 'view'>
): string {
  if (mode === 'edit') {
    return `El ${resolveClientSupplierEntityLabel(type)} se actualizó correctamente.`
  }

  return `El ${resolveClientSupplierEntityLabel(type)} se guardó correctamente.`
}

export function resolveClientSupplierResolvedTitle(type: ClientSupplierEntityType): string {
  return type === 'clients' ? 'Cliente seleccionado' : 'Proveedor seleccionado'
}

export function resolveClientSupplierResolvedDescription(type: ClientSupplierEntityType): string {
  return `Se seleccionó el ${resolveClientSupplierEntityLabel(type)} que ya existía.`
}

export function resolveClientSupplierSubmitErrorTitle(
  mode: Exclude<ClientSupplierModalMode, 'view'>
): string {
  if (mode === 'edit') {
    return 'No se pudo actualizar'
  }

  return 'No se pudo guardar'
}

export function resolveClientSupplierSearchPlaceholder(type: ClientSupplierEntityType): string {
  return `Buscar por ${type === 'clients' ? 'cliente' : 'proveedor'} o CUIT...`
}

export function resolveClientSupplierAddButtonLabel(type: ClientSupplierEntityType): string {
  return type === 'clients' ? 'Agregar cliente' : 'Agregar proveedor'
}

export function resolveClientSupplierDeleteTitle(type: ClientSupplierEntityType): string {
  return type === 'clients' ? 'Eliminar cliente' : 'Eliminar proveedor'
}

export function resolveClientSupplierDetailTitle(type: ClientSupplierEntityType): string {
  return type === 'clients' ? 'Detalle del cliente' : 'Detalle del proveedor'
}

export function getClientSupplierSortValue(
  sortBy?: ClientSupplierSortBy,
  sortOrder?: ClientSupplierSortOrder
): string {
  return `${sortBy || 'name'}:${sortOrder || 'asc'}`
}

export function resolveClientSupplierSortSelection(
  value: string
): { sortBy: ClientSupplierSortBy; sortOrder: ClientSupplierSortOrder } {
  const [sortBy, sortOrder] = value.split(':')

  return {
    sortBy: sortBy === 'cuit' ? 'cuit' : 'name',
    sortOrder: sortOrder === 'desc' ? 'desc' : 'asc',
  }
}
