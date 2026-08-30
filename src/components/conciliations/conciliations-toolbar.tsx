export function ConciliationsToolbar() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-[38px] font-mono font-normal leading-none tracking-[-1px] text-foreground">Conciliaciones</h2>
        <p className="mt-2 text-sm text-muted-foreground">Revisión, reprocesamiento y descarte de facturas pendientes de validación.</p>
      </div>
    </div>
  );
}
