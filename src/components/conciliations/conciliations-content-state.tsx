import { CheckCircle } from "lucide-react";
import type { ReactNode } from "react";
import type { ConciliationSectionData } from "src/types/conciliation/conciliations";

interface ConciliationsContentStateProps {
  isLoading: boolean;
  sections: ConciliationSectionData[];
  children: ReactNode;
}

function ConciliationsLoadingState() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 bg-card px-4 py-3">
        <div className="h-4 w-32 rounded bg-muted/70" />
      </div>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="rounded-xl border border-border/50 bg-card px-4 py-4">
          <div className="space-y-3">
            <div className="h-4 w-40 rounded bg-muted/70" />
            <div className="h-4 w-60 rounded bg-muted/60" />
            <div className="h-3 w-48 rounded bg-muted/50" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConciliationsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card p-12 text-center">
      <CheckCircle className="mb-3 h-8 w-8 text-emerald-500" />
      <div className="text-sm font-semibold text-foreground">¡Todo al día!</div>
      <p className="mt-1 max-w-[280px] text-xs text-muted-foreground">
        No hay facturas pendientes de conciliación en esta lista.
      </p>
    </div>
  );
}

export function ConciliationsContentState({ isLoading, sections, children }: ConciliationsContentStateProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <ConciliationsLoadingState />
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="space-y-4">
        <ConciliationsEmptyState />
      </div>
    );
  }

  return <div className="space-y-4">{children}</div>;
}
