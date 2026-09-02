"use client"

import { ClientsSuppliersManagementView } from 'src/components/third-party/third-party-management-view'

export function SuppliersView() {
  return (
    <ClientsSuppliersManagementView
      type="suppliers"
      title="Clientes y Proveedores"
      description="Gestioná tus clientes y proveedores"
    />
  )
}
