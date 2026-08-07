import { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { VoucherFormValues } from "src/hooks/use-voucher-form";

interface VoucherModalRetentionsProps {
  form: UseFormReturn<VoucherFormValues>;
  fields: UseFieldArrayReturn<VoucherFormValues, "retentions">["fields"];
  append: UseFieldArrayReturn<VoucherFormValues, "retentions">["append"];
  remove: UseFieldArrayReturn<VoucherFormValues, "retentions">["remove"];
  catalogs: {
    retentionConcepts: { id: string; name: string; type: string }[];
  };
  type: "sales" | "purchases";
}

export function VoucherModalRetentions({
  form,
  fields,
  append,
  remove,
  catalogs,
  type,
}: VoucherModalRetentionsProps) {
  const { register, watch } = form;

  return (
    <div className="grid gap-2 border-t pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Retenciones y Percepciones
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-[10px] h-7 px-2"
          onClick={() => append({ retentionConceptId: "", amount: 0, province: "" })}
        >
          + Agregar Concepto
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No hay retenciones cargadas.</p>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => {
            const conceptId = watch(`retentions.${index}.retentionConceptId`);
            const selectedConcept = catalogs.retentionConcepts.find(rc => rc.id === conceptId);
            const showProvince = selectedConcept?.name.toLowerCase().includes("ingresos brutos");

            return (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-end bg-muted/30 p-2 rounded-md">
                <div className="col-span-5 grid gap-1">
                  <label className="text-[9px] font-medium text-muted-foreground uppercase">Concepto</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    {...register(`retentions.${index}.retentionConceptId` as const)}
                  >
                    <option value="">Seleccionar</option>
                    {catalogs.retentionConcepts
                      .filter((rc) => rc.type === (type === "sales" ? "sale" : "purchase"))
                      .map((rc) => (
                        <option key={rc.id} value={rc.id}>
                          {rc.name}
                        </option>
                      ))}
                  </select>
                </div>

                {showProvince ? (
                  <div className="col-span-3 grid gap-1">
                    <label className="text-[9px] font-medium text-muted-foreground uppercase">Jurisdicción</label>
                    <Input
                      placeholder="Ej: CABA"
                      className="h-8 px-2 py-1 text-xs"
                      {...register(`retentions.${index}.province` as const)}
                    />
                  </div>
                ) : (
                  <div className="col-span-3" />
                )}

                <div className="col-span-3 grid gap-1">
                  <label className="text-[9px] font-medium text-muted-foreground uppercase">Importe</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="h-8 px-2 py-1 text-xs"
                    {...register(`retentions.${index}.amount` as const, { valueAsNumber: true })}
                  />
                </div>

                <div className="col-span-1 flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive/80 h-8 w-8 p-0"
                    onClick={() => remove(index)}
                  >
                    &times;
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
