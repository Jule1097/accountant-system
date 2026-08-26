import { ClientsView } from 'src/components/clients-suppliers/clients-view'
import { Suspense } from 'react'
import { ClientSupplierSkeleton } from 'src/components/clients-suppliers/client-supplier-skeleton'

export default function ClientsPage() {
  return (
    <Suspense fallback={<ClientSupplierSkeleton />}>
      <ClientsView />
    </Suspense>
  )
}
