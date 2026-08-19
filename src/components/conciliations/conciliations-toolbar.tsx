import { Button } from "src/components/ui/button";

interface ConciliationsToolbarProps {
  canPersistBatch: boolean;
  persistLabel: string;
  onPersistBatch: () => void;
}

export function ConciliationsToolbar({
  canPersistBatch,
  persistLabel,
  onPersistBatch,
}: ConciliationsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-[38px] font-mono font-normal leading-none tracking-[-1px] text-foreground">Conciliaciones</h2>
        <p className="mt-2 text-sm text-muted-foreground">Revisión, reprocesamiento y descarte de facturas pendientes de validación.</p>
      </div>

      <div className="flex flex-wrap items-center justify-start gap-3 sm:justify-end">
        {canPersistBatch && (
          <Button
            onClick={onPersistBatch}
            className="h-10 bg-[#FF5C00] px-4 text-sm font-medium text-white hover:bg-[#FF5C00]/90"
          >
            {persistLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
