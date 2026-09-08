import {
  ClientSupplierEntityType,
  ClientSupplierModalMode,
  ClientSupplierSortBy,
  ClientSupplierSortOrder,
} from 'src/types/third-party/third-party-resource'
import { FeedbackDescriptor } from 'src/types/shared/feedback'
import { feedbackTypes } from 'src/lib/constants/feedback'
import { thirdPartyEntityTypes, thirdPartyQueryDefaults, thirdPartySortByOptions, thirdPartySortOrderOptions } from 'src/lib/constants/third-party'

export function resolveClientSupplierEntityLabel(type: ClientSupplierEntityType): string {
  return type === thirdPartyEntityTypes.clients ? 'cliente' : 'proveedor'
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
  return type === thirdPartyEntityTypes.clients ? 'Cliente actualizado' : 'Proveedor actualizado'
  }

  return type === thirdPartyEntityTypes.clients ? 'Cliente guardado' : 'Proveedor guardado'
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
  return type === thirdPartyEntityTypes.clients ? 'Cliente seleccionado' : 'Proveedor seleccionado'
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
  return `Buscar por ${type === thirdPartyEntityTypes.clients ? 'cliente' : 'proveedor'} o CUIT...`
}

export function resolveClientSupplierListErrorFallback(type: ClientSupplierEntityType): string {
  return type === thirdPartyEntityTypes.clients ? 'No se pudieron cargar los clientes.' : 'No se pudieron cargar los proveedores.'
}

export function resolveClientSupplierAddButtonLabel(type: ClientSupplierEntityType): string {
  return type === thirdPartyEntityTypes.clients ? 'Agregar cliente' : 'Agregar proveedor'
}

export function resolveClientSupplierDeleteTitle(type: ClientSupplierEntityType): string {
  return type === thirdPartyEntityTypes.clients ? 'Eliminar cliente' : 'Eliminar proveedor'
}

export function resolveClientSupplierDetailTitle(type: ClientSupplierEntityType): string {
  return type === thirdPartyEntityTypes.clients ? 'Detalle del cliente' : 'Detalle del proveedor'
}

export function buildClientSupplierSaveFeedback(
  type: ClientSupplierEntityType,
  mode: Exclude<ClientSupplierModalMode, 'view'>
): FeedbackDescriptor {
  return {
    type: feedbackTypes.success,
    title: resolveClientSupplierSuccessTitle(type, mode),
    description: resolveClientSupplierSuccessDescription(type, mode),
  }
}

export function buildClientSupplierResolvedFeedback(type: ClientSupplierEntityType): FeedbackDescriptor {
  return {
    type: feedbackTypes.success,
    title: resolveClientSupplierResolvedTitle(type),
    description: resolveClientSupplierResolvedDescription(type),
  }
}

export function buildClientSupplierSubmitErrorFeedback(
  mode: Exclude<ClientSupplierModalMode, 'view'>,
  description: string
): FeedbackDescriptor {
  return {
    type: feedbackTypes.error,
    title: resolveClientSupplierSubmitErrorTitle(mode),
    description,
  }
}

export function buildClientSupplierDetailErrorFeedback(
  type: ClientSupplierEntityType,
  description: string
): FeedbackDescriptor {
  return {
    type: feedbackTypes.error,
    title: `${resolveClientSupplierEntityLabel(type)[0].toUpperCase()}${resolveClientSupplierEntityLabel(type).slice(1)} no disponible`,
    description,
  }
}

export function buildClientSupplierDeleteSuccessFeedback(type: ClientSupplierEntityType): FeedbackDescriptor {
  const label = resolveClientSupplierEntityLabel(type)

  return {
    type: feedbackTypes.success,
    title: `${label[0].toUpperCase()}${label.slice(1)} eliminado`,
    description: `El ${label} se eliminó correctamente.`,
  }
}

export function buildClientSupplierDeleteErrorFeedback(
  type: ClientSupplierEntityType,
  description: string
): FeedbackDescriptor {
  void type

  return {
    type: feedbackTypes.error,
    title: 'No se pudo eliminar',
    description,
  }
}

export function getClientSupplierSortValue(
  sortBy?: ClientSupplierSortBy,
  sortOrder?: ClientSupplierSortOrder
): string {
  return `${sortBy || thirdPartyQueryDefaults.sortBy}:${sortOrder || thirdPartyQueryDefaults.sortOrder}`
}

export function resolveClientSupplierSortSelection(
  value: string
): { sortBy: ClientSupplierSortBy; sortOrder: ClientSupplierSortOrder } {
  const [sortBy, sortOrder] = value.split(':')

  return {
    sortBy: thirdPartySortByOptions.includes(sortBy as typeof thirdPartySortByOptions[number]) ? sortBy as ClientSupplierSortBy : thirdPartyQueryDefaults.sortBy,
    sortOrder: thirdPartySortOrderOptions.includes(sortOrder as typeof thirdPartySortOrderOptions[number]) ? sortOrder as ClientSupplierSortOrder : thirdPartyQueryDefaults.sortOrder,
  }
}
