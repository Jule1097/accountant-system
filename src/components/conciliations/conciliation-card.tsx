import type { ReactNode } from "react";
import { Button } from "src/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "src/components/ui/tooltip";
import { CheckCircle, Eye, Loader2, RefreshCw, Save, Trash2, TriangleAlert, XCircle } from "lucide-react";
import { ConciliationItem, ConciliationItemAction } from "src/types/conciliations";
import { getFormattedAmount, getFormattedDate } from "src/lib/helpers/formatting";

interface ConciliationCardProps {
  voucher: ConciliationItem;
  activeAction?: ConciliationItemAction;
  isSelected: boolean;
  onSelectionChange: (voucher: ConciliationItem, checked: boolean) => void;
  onReview: (voucher: ConciliationItem) => void;
  onRegenerate: (voucher: ConciliationItem) => void;
  onPersist: (voucher: ConciliationItem) => void;
  onDelete: (voucher: ConciliationItem) => void;
}

function isWorking(activeAction: ConciliationItemAction | undefined): boolean {
  return !!activeAction;
}

function getStatusBadgeClassName(status: ConciliationItem["status"]): string {
  if (status === "Lista") {
    return "bg-emerald-500/10 text-emerald-500";
  }

  if (status === "Validada") {
    return "bg-sky-500/10 text-sky-500";
  }

  if (status === "Procesando") {
    return "bg-[#FF5C00]/10 text-[#FF5C00]";
  }

  if (status === "Duplicada") {
    return "bg-amber-500/10 text-amber-500";
  }

  return "bg-destructive/10 text-destructive";
}

function getStatusIcon(status: ConciliationItem["status"]) {
  if (status === "Lista") {
    return <CheckCircle className="h-4 w-4" />;
  }

  if (status === "Validada") {
    return <Save className="h-4 w-4" />;
  }

  if (status === "Procesando") {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (status === "Duplicada") {
    return <TriangleAlert className="h-4 w-4" />;
  }

  return <XCircle className="h-4 w-4" />;
}

function getActionLabel(action: "review" | "retry" | "persist" | "delete", voucher: ConciliationItem): string {
  if (action === "review") {
    return `Revisar factura ${voucher.documentId}`;
  }

  if (action === "retry") {
    return `Regenerar factura ${voucher.documentId}`;
  }

  if (action === "persist") {
    return `Guardar factura ${voucher.documentId}`;
  }

  return `Eliminar factura ${voucher.documentId}`;
}

function renderActionButton({
  label,
  tooltip,
  onClick,
  icon,
  disabled,
  className,
}: {
  label: string;
  tooltip: string;
  onClick: () => void;
  icon: ReactNode;
  disabled?: boolean;
  className: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span />}>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className={className}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function ConciliationCard({
  voucher,
  activeAction,
  isSelected,
  onSelectionChange,
  onReview,
  onRegenerate,
  onPersist,
  onDelete,
}: ConciliationCardProps) {
  const isActionPending = isWorking(activeAction);

  return (
    <TooltipProvider delay={120}>
      <div className={`rounded-xl border bg-card px-4 py-3 transition-colors ${isSelected ? "border-[#FF5C00]/50" : "border-border/50"}`}>
        <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {voucher.canDiscard && (
              <label className="mt-10 flex shrink-0 items-center">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(event) => onSelectionChange(voucher, event.target.checked)}
                  className="h-4 w-4 rounded border-input accent-[#FF5C00]"
                  aria-label={`Seleccionar factura ${voucher.documentId}`}
                />
              </label>
            )}

            <div className={`mt-8 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getStatusBadgeClassName(voucher.status)}`}>
              {getStatusIcon(voucher.status)}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-medium text-foreground">{voucher.documentId}</span>
                {voucher.date && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{getFormattedDate(voucher.date)}</span>
                  </>
                )}
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusBadgeClassName(voucher.status)}`}>
                  {voucher.status}
                </span>
              </div>

              <p className="truncate text-sm font-semibold text-foreground">
                {voucher.thirdParty || "Sin tercero identificado"}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">{voucher.message}</p>

              {voucher.amount !== null && voucher.currency && (
                <div className="pt-1 text-sm font-medium text-foreground">
                  {getFormattedAmount(voucher.currency, voucher.amount)}
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 md:pl-3 mt-10">
            {voucher.canReview && renderActionButton({
              label: getActionLabel("review", voucher),
              tooltip: "Revisar",
              onClick: () => onReview(voucher),
              icon: <Eye className="h-3.5 w-3.5" />,
              disabled: isActionPending,
              className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15",
            })}
            {voucher.canRetry && renderActionButton({
              label: getActionLabel("retry", voucher),
              tooltip: activeAction === "retrying" ? "Regenerando..." : "Regenerar",
              onClick: () => onRegenerate(voucher),
              icon: activeAction === "retrying"
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="h-3.5 w-3.5" />,
              disabled: isActionPending,
              className: "border-[#FF5C00]/30 bg-[#FF5C00]/10 text-[#FF5C00] hover:bg-[#FF5C00]/15",
            })}
            {voucher.status === "Validada" && renderActionButton({
              label: getActionLabel("persist", voucher),
              tooltip: activeAction === "persisting" ? "Guardando..." : "Guardar",
              onClick: () => onPersist(voucher),
              icon: activeAction === "persisting"
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Save className="h-3.5 w-3.5" />,
              disabled: isActionPending,
              className: "border-sky-500/30 bg-sky-500/10 text-sky-500 hover:bg-sky-500/15",
            })}
            {voucher.canDiscard && renderActionButton({
              label: getActionLabel("delete", voucher),
              tooltip: activeAction === "deleting" ? "Eliminando..." : "Eliminar",
              onClick: () => onDelete(voucher),
              icon: activeAction === "deleting"
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Trash2 className="h-3.5 w-3.5" />,
              disabled: isActionPending,
              className: "border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/15",
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
