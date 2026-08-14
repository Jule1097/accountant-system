import { Suspense } from "react";
import { ConciliationsView } from "src/components/conciliations/conciliations-view";
import { VoucherSkeleton } from "src/components/vouchers/voucher-skeleton";

export default function ConciliationsPage() {
  return (
    <Suspense fallback={<VoucherSkeleton />}>
      <ConciliationsView />
    </Suspense>
  );
}
