import { Suspense } from "react";
import { SalesView } from "src/components/vouchers/sales-view";
import { VoucherSkeleton } from "src/components/vouchers/voucher-skeleton";

export default function SalesPage() {
  return (
    <Suspense fallback={<VoucherSkeleton />}>
      <SalesView />
    </Suspense>
  );
}
