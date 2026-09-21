"use client"

import { useMemo, useState } from "react"
import { DataTable } from "src/components/ui/data-table"
import { PaginationControls } from "src/components/ui/pagination-controls"
import { analyticsClientSalesPageSize, analyticsClientSalesPageSizeOptions, analyticsClientSalesPageSizeAriaLabel, analyticsClientSalesTitle } from "src/lib/constants/analytics"
import { getFormattedAmount } from "src/lib/helpers/platform/formatting"
import type { ClientSalesEntry } from "src/types/analytics/analytics"

interface AnalyticsSalesByClientProps {
  currency: string
  clients: ClientSalesEntry[]
}

export function AnalyticsSalesByClient({ currency, clients }: AnalyticsSalesByClientProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(analyticsClientSalesPageSize)
  const totalPages = Math.max(1, Math.ceil(clients.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const visibleClients = useMemo(() => clients.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize), [clients, pageSize, safeCurrentPage])

  return (
    <section className="min-w-0 flex-1 rounded-xl border border-border/50 bg-card p-5" aria-labelledby="analytics-sales-by-client-title">
      <h3 id="analytics-sales-by-client-title" className="pb-4 text-sm font-semibold text-foreground">{analyticsClientSalesTitle}</h3>
      <DataTable
        data={visibleClients}
        columns={[
          { id: "client", header: "Cliente", accessor: (client) => client.name },
          { id: "collected", header: "Cobrado", accessor: (client) => getFormattedAmount(currency, client.total), cellClassName: "text-right font-mono" },
        ]}
        getRowId={(client) => client.clientId}
        emptyState="No existen comprobantes"
        className="rounded-none border-0"
        footer={clients.length > 0 ? (
          <PaginationControls
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            pageLabel={`Página ${safeCurrentPage} de ${totalPages}`}
            pageSizeOptions={analyticsClientSalesPageSizeOptions}
            pageSizeAriaLabel={analyticsClientSalesPageSizeAriaLabel}
            onPageChange={(page) => setCurrentPage(Math.min(page, totalPages))}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize)
              setCurrentPage(1)
            }}
          />
        ) : null}
      />
    </section>
  )
}
