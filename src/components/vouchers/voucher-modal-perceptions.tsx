import { UseFieldArrayReturn, UseFormReturn } from "react-hook-form";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { VoucherFormValues } from "src/hooks/use-voucher-form";

interface VoucherModalPerceptionsProps {
  form: UseFormReturn<VoucherFormValues>;
  fields: UseFieldArrayReturn<VoucherFormValues, "perceptions">["fields"];
  append: UseFieldArrayReturn<VoucherFormValues, "perceptions">["append"];
  remove: UseFieldArrayReturn<VoucherFormValues, "perceptions">["remove"];
  catalogs: {
    perceptionConcepts: { id: string; name: string }[];
    taxJurisdictions: { id: string; name: string }[];
  };
}

export function VoucherModalPerceptions({
  form,
  fields,
  append,
  remove,
  catalogs,
}: VoucherModalPerceptionsProps) {
  const { register, watch } = form;

  return (
    <div className="grid gap-2 border-t pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Percepciones
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2 text-[10px]"
          onClick={() => append({ perceptionConceptId: "", taxJurisdictionId: "", amount: 0 })}
        >
          + Agregar Percepción
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-xs italic text-muted-foreground">No hay percepciones cargadas.</p>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => {
            const conceptId = watch(`perceptions.${index}.perceptionConceptId`);
            const selectedConcept = catalogs.perceptionConcepts.find((concept) => concept.id === conceptId);
            const showJurisdiction = selectedConcept?.name.toLowerCase().includes("ingresos brutos");

            return (
              <div key={field.id} className="grid grid-cols-12 items-end gap-2 rounded-md bg-muted/30 p-2">
                <div className="col-span-5 grid gap-1">
                  <label className="text-[9px] font-medium uppercase text-muted-foreground">Concepto</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    {...register(`perceptions.${index}.perceptionConceptId` as const)}
                  >
                    <option value="">Seleccionar</option>
                    {catalogs.perceptionConcepts.map((concept) => (
                      <option key={concept.id} value={concept.id}>
                        {concept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {showJurisdiction ? (
                  <div className="col-span-3 grid gap-1">
                    <label className="text-[9px] font-medium uppercase text-muted-foreground">Jurisdicción</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      {...register(`perceptions.${index}.taxJurisdictionId` as const)}
                    >
                      <option value="">Seleccionar</option>
                      {catalogs.taxJurisdictions.map((jurisdiction) => (
                        <option key={jurisdiction.id} value={jurisdiction.id}>
                          {jurisdiction.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="col-span-3" />
                )}

                <div className="col-span-3 grid gap-1">
                  <label className="text-[9px] font-medium uppercase text-muted-foreground">Importe</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="h-8 px-2 py-1 text-xs"
                    {...register(`perceptions.${index}.amount` as const, { valueAsNumber: true })}
                  />
                </div>

                <div className="col-span-1 flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
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
