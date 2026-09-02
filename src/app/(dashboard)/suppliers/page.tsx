import { ClientSupplierSkeleton } from 'src/components/third-party/third-party-skeleton'
import { SuppliersView } from 'src/components/third-party/suppliers-view'
import { Suspense } from 'react'

export default function SuppliersPage() {
  return (
    <Suspense fallback={<ClientSupplierSkeleton />}>
      <SuppliersView />
    </Suspense>
  )
}
