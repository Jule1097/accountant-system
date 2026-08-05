"use client";

import { useState } from "react";
import { VoucherTable } from "src/components/vouchers/voucher-table";
import { VoucherModal } from "src/components/vouchers/voucher-modal";

const dummySales = [
  { id: "1", date: "2026-08-01", type: "Factura A", thirdPartyName: "Cliente Uno SA", thirdPartyCuit: "30-11111111-1", total: 10500.50 },
  { id: "2", date: "2026-08-02", type: "Factura B", thirdPartyName: "Cliente Dos", thirdPartyCuit: "20-22222222-2", total: 3200.00 },
];

export function SalesView() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ventas</h2>
          <p className="text-sm text-muted-foreground">
            Gestión y seguimiento de comprobantes de venta emitidos.
          </p>
        </div>
      </div>

      <VoucherTable
        data={dummySales}
        type="sales"
        onAdd={() => setIsModalOpen(true)}
      />

      <VoucherModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        type="sales"
      />
    </div>
  );
}
