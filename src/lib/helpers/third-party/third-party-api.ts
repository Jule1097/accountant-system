import { NextResponse } from 'next/server'
import { httpStatusCodes } from 'src/lib/constants/http'
import { buildClientSupplierFilters } from 'src/lib/helpers/third-party/third-party-persistence'
import { clientSupplierListQuerySchema } from 'src/lib/schemas/third-party/third-party-schemas'
import { ClientSupplierFilterParams } from 'src/types/third-party/third-party-resource'
import {
  clientDeleteBlockedError,
  clientDuplicateCuitError,
  clientDuplicateNameError,
  clientNotFoundError,
  clientSupplierUnexpectedError,
  supplierDeleteBlockedError,
  supplierDuplicateNameError,
  supplierNotFoundError,
} from 'src/lib/constants/messages'

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
    message === clientDuplicateNameError
    || message === supplierDuplicateNameError
    || message === clientDuplicateCuitError
  ) {
    return NextResponse.json({ error: message }, { status: httpStatusCodes.conflict })
  }

  return NextResponse.json({ error: clientSupplierUnexpectedError }, { status: httpStatusCodes.internalServerError })
}

export function resolveClientSupplierItemErrorResponse(message: string): NextResponse {
  if (message === clientNotFoundError || message === supplierNotFoundError) {
    return NextResponse.json({ error: message }, { status: httpStatusCodes.notFound })
  }

  if (
    message === clientDuplicateNameError
    || message === supplierDuplicateNameError
    || message === clientDuplicateCuitError
    || message === clientDeleteBlockedError
    || message === supplierDeleteBlockedError
  ) {
    return NextResponse.json({ error: message }, { status: httpStatusCodes.conflict })
  }

  return NextResponse.json({ error: clientSupplierUnexpectedError }, { status: httpStatusCodes.internalServerError })
}
