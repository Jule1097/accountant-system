import { ClientsView } from 'src/components/third-party/clients-view'
import { Suspense } from 'react'
import { ClientSupplierSkeleton } from 'src/components/third-party/third-party-skeleton'

export default function ClientsPage() {
  return (
    <Suspense fallback={<ClientSupplierSkeleton />}>
      <ClientsView />
    </Suspense>
  )
}
