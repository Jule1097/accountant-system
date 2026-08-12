"use client";

import { VoucherManagementView } from "src/components/vouchers/voucher-management-view";

export function SalesView() {
  return (
    <VoucherManagementView
      type="sales"
      title="Ventas"
      description="Gestión y seguimiento de comprobantes de venta emitidos."
    />
  );
}
