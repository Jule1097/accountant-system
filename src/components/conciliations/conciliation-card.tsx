import { Card } from "src/components/ui/card";
import { Button } from "src/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { PendingVoucher } from "src/types/conciliations";
import { getFormattedAmount, getFormattedDate } from "src/lib/helpers/formatting";

interface ConciliationCardProps {
  voucher: PendingVoucher;
  isRegenerating: boolean;
  onReview: (id: string) => void;
  onRegenerate: (uuid: string, id: string) => void;
  onDelete: (uuid: string) => void;
}

export function ConciliationCard({
  voucher,
  isRegenerating,
  onReview,
  onRegenerate,
  onDelete,
}: ConciliationCardProps) {
  return (
    <Card className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 border border-border/50 bg-card rounded-lg gap-4 shadow-sm relative hover:border-border transition-colors">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="flex-shrink-0 mt-0.5">
          {voucher.status === "Listo" && (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="h-5 w-5" />
            </div>
          )}
          {voucher.status === "Error" && (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="h-5 w-5" />
            </div>
          )}
          {voucher.status === "Duplicado" && (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-mono font-medium text-foreground">{voucher.id}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{getFormattedDate(voucher.date)}</span>
            {voucher.status === "Listo" && (
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                Listo
              </span>
            )}
            {voucher.status === "Error" && (
              <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                Error
              </span>
            )}
            {voucher.status === "Duplicado" && (
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                Duplicado
              </span>
            )}
          </div>

          <div className="text-sm font-semibold text-foreground truncate">{voucher.thirdParty}</div>
          <p className="text-xs text-muted-foreground leading-relaxed">{voucher.message}</p>

          <div className="text-sm font-medium text-foreground pt-1">
            {getFormattedAmount(voucher.currency, voucher.amount)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end md:self-center md:pl-4">
        {voucher.status === "Listo" && (
          <Button
            onClick={() => onReview(voucher.id)}
            className="bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white font-medium px-4 h-9 rounded-md text-xs"
          >
            Revisar
          </Button>
        )}
        {voucher.status === "Error" && (
          <Button
            onClick={() => onRegenerate(voucher.uuid, voucher.id)}
            disabled={isRegenerating}
            className="bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white font-medium px-4 h-9 rounded-md text-xs gap-1.5"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Regenerando...
              </>
            ) : (
              "Regenerar"
            )}
          </Button>
        )}
        {voucher.status === "Duplicado" && (
          <Button
            onClick={() => onDelete(voucher.uuid)}
            className="font-medium px-4 h-9 rounded-md text-xs !bg-red-600 hover:!bg-red-700 !text-white"
          >
            Eliminar
          </Button>
        )}
      </div>
    </Card>
  );
}
