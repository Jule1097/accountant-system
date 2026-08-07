import { UseFormReturn } from "react-hook-form";
import { Input } from "src/components/ui/input";
import { VoucherFormValues } from "src/hooks/use-voucher-form";

interface VoucherModalCoreFieldsProps {
  form: UseFormReturn<VoucherFormValues>;
  isProcessing: boolean;
  catalogs: {
    voucherTypes: { id: string; name: string }[];
    voucherLetters: { id: string; letter: string }[];
  };
  thirdParties: { id: string; name: string; cuit: string }[];
  type: "sales" | "purchases";
  handlePosBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleNumberBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export function VoucherModalCoreFields({
  form,
  isProcessing,
  catalogs,
  thirdParties,
  type,
  handlePosBlur,
  handleNumberBlur,
}: VoucherModalCoreFieldsProps) {
  const { register, formState: { errors } } = form;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Fecha</label>
          <Input type="date" disabled={isProcessing} {...register("date")} />
          {errors.date && <p className="text-2xs text-destructive">{errors.date.message}</p>}
        </div>

        <div className="grid gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Letra</label>
          <select
            disabled={isProcessing}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("voucherLetterId")}
          >
            <option value="">Seleccionar Letra</option>
            {catalogs.voucherLetters.map((vl) => (
              <option key={vl.id} value={vl.id}>
                {vl.letter}
              </option>
            ))}
          </select>
          {errors.voucherLetterId && (
            <p className="text-2xs text-destructive">{errors.voucherLetterId.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="grid col-span-1 gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Pto. Venta</label>
          <Input
            placeholder="00001"
            disabled={isProcessing}
            {...register("posNumber")}
            onBlur={handlePosBlur}
          />
          {errors.posNumber && <p className="text-2xs text-destructive">{errors.posNumber.message}</p>}
        </div>

        <div className="grid col-span-2 gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Número</label>
          <Input
            placeholder="00000000"
            disabled={isProcessing}
            {...register("number")}
            onBlur={handleNumberBlur}
          />
          {errors.number && <p className="text-2xs text-destructive">{errors.number.message}</p>}
        </div>
      </div>

      <div className="grid gap-1">
        <label className="text-[10px] font-medium text-muted-foreground uppercase">Tipo Comprobante</label>
        <select
          disabled={isProcessing}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...register("voucherTypeId")}
        >
          <option value="">Seleccionar Tipo</option>
          {catalogs.voucherTypes.map((vt) => (
            <option key={vt.id} value={vt.id}>
              {vt.name}
            </option>
          ))}
        </select>
        {errors.voucherTypeId && (
          <p className="text-2xs text-destructive">{errors.voucherTypeId.message}</p>
        )}
      </div>

      <div className="grid gap-1">
        <label className="text-[10px] font-medium text-muted-foreground uppercase">
          {type === "sales" ? "Cliente" : "Proveedor"}
        </label>
        <select
          disabled={isProcessing}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...register("thirdPartyId")}
        >
          <option value="">Seleccionar Razón Social</option>
          {thirdParties.map((tp) => (
            <option key={tp.id} value={tp.id}>
              {tp.name}
            </option>
          ))}
        </select>
        {errors.thirdPartyId && <p className="text-2xs text-destructive">{errors.thirdPartyId.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">CUIT</label>
          <Input placeholder="00-00000000-0" disabled readOnly {...register("thirdPartyCuit")} />
        </div>

        <div className="grid gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Importe Total</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            disabled={isProcessing}
            {...register("totalAmount", { valueAsNumber: true })}
          />
          {errors.totalAmount && <p className="text-2xs text-destructive">{errors.totalAmount.message}</p>}
        </div>
      </div>
    </>
  );
}
