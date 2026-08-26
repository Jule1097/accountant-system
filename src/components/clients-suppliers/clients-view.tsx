"use client"

import { ClientsSuppliersManagementView } from 'src/components/clients-suppliers/clients-suppliers-management-view'

export function ClientsView() {
  return (
    <ClientsSuppliersManagementView
      type="clients"
      title="Clientes y Proveedores"
      description="Gestioná tus clientes y proveedores"
    />
  )
}
