"use client";

import { useState, Suspense, use } from "react";
import { VoucherTable } from "src/components/vouchers/voucher-table";
import { VoucherModal } from "src/components/vouchers/voucher-modal";
import { VoucherSkeleton } from "src/components/vouchers/voucher-skeleton";
import { SalesKpiCards } from "src/components/vouchers/sales-kpi-cards";
import { useVouchers } from "src/hooks/use-vouchers";
import { Voucher } from "src/models/Voucher";

function SalesTableContainer({
  promise,
  onAdd,
  onSelectVoucher,
}: {
  promise: Promise<Voucher[]> | null;
  onAdd: () => void;
  onSelectVoucher: (voucher: Voucher) => void;
}) {
  if (!promise) return null;
  const vouchers = use(promise);
  return <VoucherTable data={vouchers} type="sales" onAdd={onAdd} onSelectVoucher={onSelectVoucher} />;
}

export function SalesView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const { promise } = useVouchers("sale");

  const handleAdd = () => {
    setSelectedVoucher(null);
    setIsModalOpen(true);
  };

  const handleSelectVoucher = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setIsModalOpen(true);
  };

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

      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="h-[104px] rounded-xl bg-card animate-pulse border border-border/50" />
          <div className="h-[104px] rounded-xl bg-card animate-pulse border border-border/50" />
          <div className="h-[104px] rounded-xl bg-card animate-pulse border border-border/50" />
        </div>
      }>
        <SalesKpiCards promise={promise} />
      </Suspense>

      <Suspense fallback={<VoucherSkeleton />}>
        <SalesTableContainer promise={promise} onAdd={handleAdd} onSelectVoucher={handleSelectVoucher} />
      </Suspense>

      <VoucherModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        type="sales"
        initialVoucher={selectedVoucher}
      />
    </div>
  );
}
