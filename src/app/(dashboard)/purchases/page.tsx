import { Suspense } from "react";
import { PurchasesView } from "src/components/vouchers/purchases-view";
import { VoucherSkeleton } from "src/components/vouchers/voucher-skeleton";

export default function PurchasesPage() {
  return (
    <Suspense fallback={<VoucherSkeleton />}>
      <PurchasesView />
    </Suspense>
  );
}
