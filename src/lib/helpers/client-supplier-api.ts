import { NextResponse } from 'next/server'
import { buildClientSupplierFilters } from 'src/lib/helpers/client-supplier'
import { clientSupplierListQuerySchema } from 'src/lib/schemas/client-supplier-schemas'
import { ClientSupplierFilterParams } from 'src/types/client-supplier'

export function parseClientSupplierListQuery(searchParams: URLSearchParams):
  | { success: true; data: ClientSupplierFilterParams & { page: number; pageSize: number } }
  | { success: false } {
  const parsed = clientSupplierListQuerySchema.safeParse({
    page: searchParams.get('page') || undefined,
    pageSize: searchParams.get('pageSize') || undefined,
    search: searchParams.get('search') || undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: searchParams.get('sortOrder') || undefined,
  })

  if (!parsed.success) {
    return { success: false }
  }

  return {
    success: true,
    data: {
      ...parsed.data,
      filters: buildClientSupplierFilters(searchParams),
    },
  }
}

export function resolveClientSupplierCollectionErrorResponse(message: string): NextResponse {
  if (
    message === 'El cliente ya existe'
    || message === 'El proveedor ya existe'
    || message === 'El CUIT ya existe'
  ) {
    return NextResponse.json({ error: message }, { status: 409 })
  }

  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
}

export function resolveClientSupplierItemErrorResponse(message: string): NextResponse {
  if (message === 'Cliente no encontrado' || message === 'Proveedor no encontrado') {
    return NextResponse.json({ error: message }, { status: 404 })
  }

  if (
    message === 'El cliente ya existe'
    || message === 'El proveedor ya existe'
    || message === 'El CUIT ya existe'
    || message === 'No se puede eliminar el cliente porque tiene comprobantes asociados.'
    || message === 'No se puede eliminar el proveedor porque tiene comprobantes asociados.'
  ) {
    return NextResponse.json({ error: message }, { status: 409 })
  }

  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
}
