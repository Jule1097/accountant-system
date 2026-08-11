"use client";

import { VoucherManagementView } from "src/components/vouchers/voucher-management-view";

export function PurchasesView() {
  return (
    <VoucherManagementView
      type="purchases"
      title="Compras"
      description="Gestión y registro de comprobantes de compras y gastos."
    />
  );
}
