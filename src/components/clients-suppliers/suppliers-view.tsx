"use client"

import { ClientsSuppliersManagementView } from 'src/components/clients-suppliers/clients-suppliers-management-view'

export function SuppliersView() {
  return (
    <ClientsSuppliersManagementView
      type="suppliers"
      title="Clientes y Proveedores"
      description="Gestioná tus clientes y proveedores"
    />
  )
}
