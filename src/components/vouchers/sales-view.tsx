"use client";

import { useState, Suspense, use } from "react";
import { VoucherTable } from "src/components/vouchers/voucher-table";
import { VoucherModal } from "src/components/vouchers/voucher-modal";
import { VoucherSkeleton } from "src/components/vouchers/voucher-skeleton";
import { useVouchers } from "src/hooks/use-vouchers";
import { Voucher } from "src/models/Voucher";

function SalesTableContainer({ promise, onAdd }: { promise: Promise<Voucher[]> | null; onAdd: () => void }) {
  if (!promise) return null;
  const vouchers = use(promise);
  return <VoucherTable data={vouchers} type="sales" onAdd={onAdd} />;
}

export function SalesView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { promise } = useVouchers("sale");

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

      <Suspense fallback={<VoucherSkeleton />}>
        <SalesTableContainer promise={promise} onAdd={() => setIsModalOpen(true)} />
      </Suspense>

      <VoucherModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        type="sales"
      />
    </div>
  );
}
