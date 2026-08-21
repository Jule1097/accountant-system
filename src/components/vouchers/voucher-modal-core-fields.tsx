import { UseFormReturn, useWatch } from "react-hook-form";
import { Input } from "src/components/ui/input";
import { VoucherFormValues } from "src/hooks/use-voucher-form";
import { shouldRequireVoucherExchangeRate } from "src/lib/helpers/voucher-form";
import { getVoucherFormattedAmount } from "src/lib/helpers/voucher-management";
import { Voucher } from "src/models/Voucher";
import { VoucherModalMode } from "src/types/voucher";
import { cn } from "src/lib/utils";

interface VoucherModalCoreFieldsProps {
  form: UseFormReturn<VoucherFormValues>;
  isProcessing: boolean;
  catalogs: {
    voucherTypes: { id: string; name: string }[];
    voucherLetters: { id: string; letter: string }[];
  };
  thirdParties: { id: string; name: string; cuit: string }[];
  type: "sales" | "purchases";
  mode?: VoucherModalMode;
  initialVoucher?: Voucher | null;
  handlePosBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  handleNumberBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  taxListsNode?: React.ReactNode;
}

const fieldContainerClass = "flex min-w-0 flex-col gap-1.5";
const labelClass = "text-[10px] font-medium text-muted-foreground uppercase";
const inputClass = "w-full rounded-md border border-input bg-card px-3 py-2 text-[13px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-[38px]";
const errorClass = "text-[10px] leading-tight text-destructive";

export function VoucherModalCoreFields({
  form,
  isProcessing,
  catalogs,
  thirdParties,
  type,
  mode,
  initialVoucher,
  handlePosBlur,
  handleNumberBlur,
  taxListsNode,
}: VoucherModalCoreFieldsProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const selectedCurrency = useWatch({
    control,
    name: "currency",
  });
  const shouldShowExchangeRate = shouldRequireVoucherExchangeRate(selectedCurrency || "$");
  const isDisabled = isProcessing || mode === "view";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 p-4 bg-muted/40 border border-border rounded-lg">
        <div className="text-xs font-semibold text-[#FF5C00]">1. Identificación y Fechas</div>
        <div className="grid grid-cols-2 gap-3">
          <div className={fieldContainerClass}>
            <label className={labelClass}>
              {type === "sales" ? "Cliente" : "Proveedor"}
            </label>
            <select
              disabled={isDisabled}
              className={inputClass}
              {...register("thirdPartyId")}
            >
              <option value="">Seleccionar Razón Social</option>
              {thirdParties.map((thirdParty) => (
                <option key={thirdParty.id} value={thirdParty.id}>
                  {thirdParty.name}
                </option>
              ))}
            </select>
            {errors.thirdPartyId && <p className={errorClass}>{errors.thirdPartyId.message}</p>}
          </div>
          <div className={fieldContainerClass}>
            <label className={labelClass}>Fecha</label>
            <Input type="date" className="bg-card h-[38px] text-[13px] px-3" disabled={isDisabled} {...register("date")} />
            {errors.date && <p className={errorClass}>{errors.date.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className={fieldContainerClass}>
            <label className={labelClass}>CUIT</label>
            <Input placeholder="00-00000000-0" className="bg-card h-[38px] text-[13px] px-3" disabled readOnly {...register("thirdPartyCuit")} />
          </div>
          <div className={fieldContainerClass}>
            <label className={labelClass}>Moneda</label>
            <select
              disabled={isDisabled}
              className={inputClass}
              {...register("currency")}
            >
              <option value="$">ARS</option>
              <option value="USD">USD</option>
            </select>
            {errors.currency && <p className={errorClass}>{errors.currency.message}</p>}
          </div>
        </div>
        {shouldShowExchangeRate ? (
          <div className="grid grid-cols-2 gap-3">
            <div className={fieldContainerClass}>
              <label className={labelClass}>Tipo de cambio</label>
              <Input
                type="number"
                step="0.0001"
                placeholder="0.0000"
                className="bg-card h-[38px] text-[13px] px-3"
                disabled={isDisabled}
                {...register("exchangeRate", { valueAsNumber: true })}
              />
              {errors.exchangeRate && <p className={errorClass}>{errors.exchangeRate.message}</p>}
            </div>
          </div>
        ) : null}
        <div className="grid gap-3">
          <div className={fieldContainerClass}>
            <label className={labelClass}>Concepto</label>
            <Input placeholder="Detalle del comprobante" className="bg-card h-[38px] text-[13px] px-3" disabled={isDisabled} {...register("concept")} />
            {errors.concept && <p className={errorClass}>{errors.concept.message}</p>}
          </div>
          <div className={fieldContainerClass}>
            <label className={labelClass}>Comentarios</label>
            <textarea
              rows={2}
              disabled={isDisabled}
              className={cn(inputClass, "h-auto resize-none")}
              {...register("comments")}
            />
            {errors.comments && <p className={errorClass}>{errors.comments.message}</p>}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 p-4 bg-muted/40 border border-border rounded-lg">
        <div className="text-xs font-semibold text-[#FF5C00]">2. Numeración y Clasificación</div>
        <div className="grid grid-cols-2 gap-3">
          <div className={fieldContainerClass}>
            <label className={labelClass}>Tipo Comprobante</label>
            <select
              disabled={isDisabled}
              className={inputClass}
              {...register("voucherTypeId")}
            >
              <option value="">Seleccionar Tipo</option>
              {catalogs.voucherTypes.map((voucherType) => (
                <option key={voucherType.id} value={voucherType.id}>
                  {voucherType.name}
                </option>
              ))}
            </select>
            {errors.voucherTypeId && <p className={errorClass}>{errors.voucherTypeId.message}</p>}
          </div>
          <div className={fieldContainerClass}>
            <label className={labelClass}>Letra</label>
            <select
              disabled={isDisabled}
              className={inputClass}
              {...register("voucherLetterId")}
            >
              <option value="">Seleccionar Letra</option>
              {catalogs.voucherLetters.map((voucherLetter) => (
                <option key={voucherLetter.id} value={voucherLetter.id}>
                  {voucherLetter.letter}
                </option>
              ))}
            </select>
            {errors.voucherLetterId && <p className={errorClass}>{errors.voucherLetterId.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className={cn(fieldContainerClass, "col-span-1")}>
            <label className={labelClass}>Pto. Venta</label>
            <Input placeholder="00001" className="bg-card h-[38px] text-[13px] px-3" disabled={isDisabled} {...register("posNumber")} onBlur={handlePosBlur} />
            {errors.posNumber && <p className={errorClass}>{errors.posNumber.message}</p>}
          </div>

          <div className={cn(fieldContainerClass, "col-span-2")}>
            <label className={labelClass}>Número</label>
            <Input placeholder="00000000" className="bg-card h-[38px] text-[13px] px-3" disabled={isDisabled} {...register("number")} onBlur={handleNumberBlur} />
            {errors.number && <p className={errorClass}>{errors.number.message}</p>}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 p-4 bg-muted/40 border border-border rounded-lg">
        <div className="text-xs font-semibold text-[#FF5C00]">3. Importes y Totales</div>
        <div className="grid grid-cols-2 gap-3">
          <div className={fieldContainerClass}>
            <label className={labelClass}>Subtotal</label>
            <Input type="number" step="0.01" placeholder="0.00" className="bg-card h-[38px] text-[13px] px-3" disabled={isDisabled} {...register("subtotal", { valueAsNumber: true })} />
            {errors.subtotal && <p className={errorClass}>{errors.subtotal.message}</p>}
          </div>
          <div className={fieldContainerClass}>
            <label className={labelClass}>IVA</label>
            <Input type="number" step="0.01" placeholder="0.00" className="bg-card h-[38px] text-[13px] px-3" disabled={isDisabled} {...register("vatAmount", { valueAsNumber: true })} />
            {errors.vatAmount && <p className={errorClass}>{errors.vatAmount.message}</p>}
          </div>
        </div>
        <div className={fieldContainerClass}>
          <label className={labelClass}>Importe Total</label>
          <Input type="number" step="0.01" placeholder="0.00" className="bg-card h-[38px] text-[13px] px-3 font-semibold text-[#FF5C00]" disabled={isDisabled} {...register("totalAmount", { valueAsNumber: true })} />
          {errors.totalAmount && <p className={errorClass}>{errors.totalAmount.message}</p>}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className={fieldContainerClass}>
            <label className={labelClass}>No Gravado</label>
            <Input type="number" step="0.01" placeholder="0.00" className="bg-card h-[38px] text-[13px] px-3" disabled={isDisabled} {...register("nonTaxableAmount", { valueAsNumber: true })} />
            {errors.nonTaxableAmount && <p className={errorClass}>{errors.nonTaxableAmount.message}</p>}
          </div>
          <div className={fieldContainerClass}>
            <label className={labelClass}>Exento</label>
            <Input type="number" step="0.01" placeholder="0.00" className="bg-card h-[38px] text-[13px] px-3" disabled={isDisabled} {...register("exemptAmount", { valueAsNumber: true })} />
            {errors.exemptAmount && <p className={errorClass}>{errors.exemptAmount.message}</p>}
          </div>
          <div className={fieldContainerClass}>
            <label className={labelClass}>Otros Imp.</label>
            <Input type="number" step="0.01" placeholder="0.00" className="bg-card h-[38px] text-[13px] px-3" disabled={isDisabled} {...register("otherTaxesAmount", { valueAsNumber: true })} />
            {errors.otherTaxesAmount && <p className={errorClass}>{errors.otherTaxesAmount.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className={fieldContainerClass}>
            <label className={labelClass}>Estado</label>
            <select
              disabled={isDisabled}
              className={inputClass}
              {...register("status")}
            >
              <option value="pending">Pendiente</option>
              <option value="partial">Parcial</option>
              <option value="paid">Pagado</option>
            </select>
            {errors.status && <p className={errorClass}>{errors.status.message}</p>}
          </div>
          <div className={fieldContainerClass}>
            <label className={labelClass}>Medio de Pago</label>
            <Input placeholder="Transferencia" className="bg-card h-[38px] text-[13px] px-3" disabled={isDisabled} {...register("paymentMethod")} />
            {errors.paymentMethod && <p className={errorClass}>{errors.paymentMethod.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className={fieldContainerClass}>
            <label className={labelClass}>Fecha de Pago</label>
            <Input type="date" className="bg-card h-[38px] text-[13px] px-3" disabled={isDisabled} {...register("paymentDate")} />
            {errors.paymentDate && <p className={errorClass}>{errors.paymentDate.message}</p>}
          </div>
          <div className={fieldContainerClass}>
            <label className={labelClass}>Importe Pagado</label>
            <Input type="number" step="0.01" placeholder="0.00" className="bg-card h-[38px] text-[13px] px-3" disabled={isDisabled} {...register("paidAmount", { valueAsNumber: true })} />
            {errors.paidAmount && <p className={errorClass}>{errors.paidAmount.message}</p>}
          </div>
        </div>
        {mode === "view" && initialVoucher && (
          <div className="grid grid-cols-2 gap-3 mt-1 pt-3 border-t border-border/30">
            <div className={fieldContainerClass}>
              <label className={labelClass}>Saldo</label>
              <Input
                type="text"
                className="bg-card h-[38px] text-[13px] px-3 font-semibold text-[#FF5C00]"
                disabled
                value={getVoucherFormattedAmount(
                  initialVoucher.currency,
                  Number(initialVoucher.saldo)
                )}
              />
            </div>
          </div>
        )}
        {taxListsNode}
      </div>
    </div>
  );
}
