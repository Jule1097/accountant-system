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
  handlePosBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  handleNumberBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
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
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Fecha</label>
          <Input type="date" disabled={isProcessing} {...register("date")} />
          {errors.date && <p className="text-2xs text-destructive">{errors.date.message}</p>}
        </div>

        <div className="grid gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Moneda</label>
          <select
            disabled={isProcessing}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("currency")}
          >
            <option value="$">ARS</option>
            <option value="USD">USD</option>
          </select>
          {errors.currency && <p className="text-2xs text-destructive">{errors.currency.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="grid col-span-1 gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Pto. Venta</label>
          <Input placeholder="00001" disabled={isProcessing} {...register("posNumber")} onBlur={handlePosBlur} />
          {errors.posNumber && <p className="text-2xs text-destructive">{errors.posNumber.message}</p>}
        </div>

        <div className="grid col-span-2 gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Número</label>
          <Input placeholder="00000000" disabled={isProcessing} {...register("number")} onBlur={handleNumberBlur} />
          {errors.number && <p className="text-2xs text-destructive">{errors.number.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Letra</label>
          <select
            disabled={isProcessing}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("voucherLetterId")}
          >
            <option value="">Seleccionar Letra</option>
            {catalogs.voucherLetters.map((voucherLetter) => (
              <option key={voucherLetter.id} value={voucherLetter.id}>
                {voucherLetter.letter}
              </option>
            ))}
          </select>
          {errors.voucherLetterId && <p className="text-2xs text-destructive">{errors.voucherLetterId.message}</p>}
        </div>

        <div className="grid gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Tipo Comprobante</label>
          <select
            disabled={isProcessing}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("voucherTypeId")}
          >
            <option value="">Seleccionar Tipo</option>
            {catalogs.voucherTypes.map((voucherType) => (
              <option key={voucherType.id} value={voucherType.id}>
                {voucherType.name}
              </option>
            ))}
          </select>
          {errors.voucherTypeId && <p className="text-2xs text-destructive">{errors.voucherTypeId.message}</p>}
        </div>
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
          {thirdParties.map((thirdParty) => (
            <option key={thirdParty.id} value={thirdParty.id}>
              {thirdParty.name}
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
          <Input type="number" step="0.01" placeholder="0.00" disabled={isProcessing} {...register("totalAmount", { valueAsNumber: true })} />
          {errors.totalAmount && <p className="text-2xs text-destructive">{errors.totalAmount.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Subtotal</label>
          <Input type="number" step="0.01" placeholder="0.00" disabled={isProcessing} {...register("subtotal", { valueAsNumber: true })} />
          {errors.subtotal && <p className="text-2xs text-destructive">{errors.subtotal.message}</p>}
        </div>

        <div className="grid gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">IVA</label>
          <Input type="number" step="0.01" placeholder="0.00" disabled={isProcessing} {...register("vatAmount", { valueAsNumber: true })} />
          {errors.vatAmount && <p className="text-2xs text-destructive">{errors.vatAmount.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="grid gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">No Gravado</label>
          <Input type="number" step="0.01" placeholder="0.00" disabled={isProcessing} {...register("nonTaxableAmount", { valueAsNumber: true })} />
          {errors.nonTaxableAmount && <p className="text-2xs text-destructive">{errors.nonTaxableAmount.message}</p>}
        </div>

        <div className="grid gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Exento</label>
          <Input type="number" step="0.01" placeholder="0.00" disabled={isProcessing} {...register("exemptAmount", { valueAsNumber: true })} />
          {errors.exemptAmount && <p className="text-2xs text-destructive">{errors.exemptAmount.message}</p>}
        </div>

        <div className="grid gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Otros Impuestos</label>
          <Input type="number" step="0.01" placeholder="0.00" disabled={isProcessing} {...register("otherTaxesAmount", { valueAsNumber: true })} />
          {errors.otherTaxesAmount && <p className="text-2xs text-destructive">{errors.otherTaxesAmount.message}</p>}
        </div>
      </div>

      <div className="grid gap-1">
        <label className="text-[10px] font-medium text-muted-foreground uppercase">Concepto</label>
        <Input placeholder="Detalle del comprobante" disabled={isProcessing} {...register("concept")} />
        {errors.concept && <p className="text-2xs text-destructive">{errors.concept.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Medio de Pago</label>
          <Input placeholder="Transferencia" disabled={isProcessing} {...register("paymentMethod")} />
          {errors.paymentMethod && <p className="text-2xs text-destructive">{errors.paymentMethod.message}</p>}
        </div>

        <div className="grid gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Estado</label>
          <select
            disabled={isProcessing}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("status")}
          >
            <option value="pending">Pendiente</option>
            <option value="partial">Parcial</option>
            <option value="paid">Pagado</option>
          </select>
          {errors.status && <p className="text-2xs text-destructive">{errors.status.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Fecha de Pago</label>
          <Input type="date" disabled={isProcessing} {...register("paymentDate")} />
          {errors.paymentDate && <p className="text-2xs text-destructive">{errors.paymentDate.message}</p>}
        </div>

        <div className="grid gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Importe Pagado</label>
          <Input type="number" step="0.01" placeholder="0.00" disabled={isProcessing} {...register("paidAmount", { valueAsNumber: true })} />
          {errors.paidAmount && <p className="text-2xs text-destructive">{errors.paidAmount.message}</p>}
        </div>
      </div>

      <div className="grid gap-1">
        <label className="text-[10px] font-medium text-muted-foreground uppercase">Comentarios</label>
        <textarea
          rows={3}
          disabled={isProcessing}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...register("comments")}
        />
        {errors.comments && <p className="text-2xs text-destructive">{errors.comments.message}</p>}
      </div>
    </>
  );
}
