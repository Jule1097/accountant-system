"use client"

import type { ChangeEvent, MouseEvent } from 'react'
import { Eye, Pencil, Search, Trash2, X } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { PaginationControls } from 'src/components/ui/pagination-controls'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table'
import {
  buildClientSupplierPageLabel,
  clientSupplierPageSizeOptions,
} from 'src/lib/helpers/client-supplier-management'
import {
  ClientSupplierTableProps,
} from 'src/types/client-supplier'
import {
  getClientSupplierSortValue,
  resolveClientSupplierAddButtonLabel,
  resolveClientSupplierEntityLabel,
  resolveClientSupplierSearchPlaceholder,
  resolveClientSupplierSortSelection,
} from 'src/lib/helpers/client-supplier-ui'

export function ClientSupplierTable({
  data,
  query,
  searchValue,
  type,
  onAdd,
  onSelectRecord,
  onDeleteRecord,
  onSearchChange,
  onClearFilters,
  onSortChange,
  onPageChange,
  onPageSizeChange,
}: ClientSupplierTableProps) {
  const records = data?.items || []
  const currentPage = data?.page || query.page || 1
  const totalPages = data?.totalPages || 1
  const hasActiveFilters = Boolean(query.search)

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0 flex-1">
            <label className="mb-2 block text-sm font-medium text-foreground">Buscar</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                placeholder={resolveClientSupplierSearchPlaceholder(type)}
                className="h-9 border-input bg-card pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-[#FF5C00]"
                onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 xl:max-w-[40%]">
            {hasActiveFilters ? (
              <Button
                variant="outline"
                className="h-9 border-input bg-card px-3 text-foreground hover:bg-muted hover:text-foreground"
                onClick={onClearFilters}
              >
                Borrar filtros
                <X className="ml-2 h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">{data?.total ?? 0} registros encontrados</div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <label className="text-sm text-muted-foreground" htmlFor="client-supplier-sort">Ordenar por</label>
            <select
              id="client-supplier-sort"
              className="flex h-9 rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF5C00]"
              value={getClientSupplierSortValue(query.sortBy, query.sortOrder)}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                const { sortBy, sortOrder } = resolveClientSupplierSortSelection(event.target.value)
                onSortChange(sortBy, sortOrder)
              }}
            >
              <option value="name:asc">Nombre (A-Z)</option>
              <option value="name:desc">Nombre (Z-A)</option>
              <option value="cuit:asc">CUIT (ascendente)</option>
              <option value="cuit:desc">CUIT (descendente)</option>
            </select>
            <Button onClick={onAdd} className="h-9 bg-[#FF5C00] px-3 text-[#FFFFFF] hover:bg-[#FF8A4C]">
              {resolveClientSupplierAddButtonLabel(type)}
            </Button>
          </div>
        </div>

        <Table className="text-[13px] text-foreground">
          <TableHeader className="bg-muted/30 ">
            <TableRow className="border-b-border hover:bg-transparent">
              <TableHead className="text-[11px] font-semibold tracking-[0.5px] text-muted-foreground">Nombre</TableHead>
              <TableHead className="text-[11px] font-semibold tracking-[0.5px] text-muted-foreground">CUIT</TableHead>
              <TableHead className="text-center text-[11px] font-semibold tracking-[0.5px] text-muted-foreground">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow className="border-b-border bg-card">
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No se encontraron registros.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id} className="border-b-border bg-card transition-colors hover:bg-muted/30">
                  <TableCell className="font-medium text-foreground">{record.name}</TableCell>
                  <TableCell className="text-muted-foreground">{record.cuit}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-[#FF5C00]"
                        aria-label={`Ver ${resolveClientSupplierEntityLabel(type)}`}
                        onClick={(event: MouseEvent<HTMLButtonElement>) => {
                          event.stopPropagation()
                          onSelectRecord(record, 'view')
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-[#FF5C00]"
                        aria-label={`Editar ${resolveClientSupplierEntityLabel(type)}`}
                        onClick={(event: MouseEvent<HTMLButtonElement>) => {
                          event.stopPropagation()
                          onSelectRecord(record, 'edit')
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Eliminar ${resolveClientSupplierEntityLabel(type)}`}
                        onClick={(event: MouseEvent<HTMLButtonElement>) => {
                          event.stopPropagation()
                          onDeleteRecord(record)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={query.pageSize}
          pageLabel={buildClientSupplierPageLabel(
            data || {
              items: [],
              total: 0,
              page: query.page,
              pageSize: query.pageSize,
              totalPages: 1,
            }
          )}
          pageSizeOptions={clientSupplierPageSizeOptions}
          pageSizeAriaLabel="Mostrar registros por página"
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  )
}
