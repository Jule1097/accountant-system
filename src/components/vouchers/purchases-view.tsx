"use client";

import { useState, Suspense, use } from "react";
import { VoucherTable } from "src/components/vouchers/voucher-table";
import { VoucherModal } from "src/components/vouchers/voucher-modal";
import { VoucherSkeleton } from "src/components/vouchers/voucher-skeleton";
import { useVouchers } from "src/hooks/use-vouchers";
import { Voucher } from "src/models/Voucher";

function PurchasesTableContainer({ promise, onAdd }: { promise: Promise<Voucher[]> | null; onAdd: () => void }) {
  if (!promise) return null;
  const vouchers = use(promise);
  return <VoucherTable data={vouchers} type="purchases" onAdd={onAdd} />;
}

export function PurchasesView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { promise } = useVouchers("purchase");

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

      <Suspense fallback={<VoucherSkeleton />}>
        <PurchasesTableContainer promise={promise} onAdd={() => setIsModalOpen(true)} />
      </Suspense>

      <VoucherModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        type="purchases"
      />
    </div>
  );
}
