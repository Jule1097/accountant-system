"use client";

import { useState } from "react";
import { VoucherTable } from "src/components/vouchers/voucher-table";
import { VoucherModal } from "src/components/vouchers/voucher-modal";

const dummyPurchases = [
  { id: "1", date: "2026-08-01", type: "Factura A", thirdPartyName: "Proveedor Central", thirdPartyCuit: "30-55555555-5", total: 4500.00 },
  { id: "2", date: "2026-08-03", type: "Ticket", thirdPartyName: "Librería", thirdPartyCuit: "20-44444444-4", total: 150.75 },
];

export function PurchasesView() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Compras</h2>
          <p className="text-sm text-muted-foreground">
            Gestión y registro de comprobantes de compras y gastos.
          </p>
        </div>
      </div>

      <VoucherTable
        data={dummyPurchases}
        type="purchases"
        onAdd={() => setIsModalOpen(true)}
      />

      <VoucherModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        type="purchases"
      />
    </div>
  );
}
