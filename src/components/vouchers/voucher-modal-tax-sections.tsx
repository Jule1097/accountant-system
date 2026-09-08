import type { UseFieldArrayReturn, UseFormReturn } from "react-hook-form";
import { VoucherModalPerceptions } from "src/components/vouchers/voucher-modal-perceptions";
import { VoucherModalRetentions } from "src/components/vouchers/voucher-modal-retentions";
import type { VoucherFormValues } from "src/hooks/voucher/use-voucher-form";
import type { VoucherFormOptionsData } from "src/hooks/voucher/use-voucher-form-options";
import type { VoucherScreenType } from "src/types/voucher/voucher";

interface VoucherModalTaxSectionsProps {
  form: UseFormReturn<VoucherFormValues>;
  type: VoucherScreenType;
  catalogs: VoucherFormOptionsData["catalogs"];
  retentionFields: UseFieldArrayReturn<VoucherFormValues, "retentions">["fields"];
  appendRetention: UseFieldArrayReturn<VoucherFormValues, "retentions">["append"];
  removeRetention: UseFieldArrayReturn<VoucherFormValues, "retentions">["remove"];
  perceptionFields: UseFieldArrayReturn<VoucherFormValues, "perceptions">["fields"];
  appendPerception: UseFieldArrayReturn<VoucherFormValues, "perceptions">["append"];
  removePerception: UseFieldArrayReturn<VoucherFormValues, "perceptions">["remove"];
  disabled: boolean;
}

export function VoucherModalTaxSections({
  form,
  type,
  catalogs,
  retentionFields,
  appendRetention,
  removeRetention,
  perceptionFields,
  appendPerception,
  removePerception,
  disabled,
}: VoucherModalTaxSectionsProps) {
  return (
    <>
      {type === "sales" ? (
        <VoucherModalRetentions
          form={form}
          fields={retentionFields}
          append={appendRetention}
          remove={removeRetention}
          catalogs={catalogs}
          disabled={disabled}
        />
      ) : (
        <VoucherModalPerceptions
          form={form}
          fields={perceptionFields}
          append={appendPerception}
          remove={removePerception}
          catalogs={catalogs}
          disabled={disabled}
        />
      )}
    </>
  );
}
