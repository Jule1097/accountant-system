import { ClientSupplierSkeleton } from 'src/components/clients-suppliers/client-supplier-skeleton'
import { SuppliersView } from 'src/components/clients-suppliers/suppliers-view'
import { Suspense } from 'react'

export default function SuppliersPage() {
  return (
    <Suspense fallback={<ClientSupplierSkeleton />}>
      <SuppliersView />
    </Suspense>
  )
}
