import { hasCorruptedParserText } from "src/lib/helpers/parser-text";
import { GeminiRepairableField, RawGeminiParsedVoucher } from "src/types/gemini-parser";

type GeminiRepairableScalarField =
  | "thirdPartyName"
  | "concept"
  | "paymentMethod"
  | "status"
  | "comments"
  | "voucherType"
  | "voucherLetter";

const repairableScalarFields: GeminiRepairableScalarField[] = [
  "thirdPartyName",
  "concept",
  "paymentMethod",
  "status",
  "comments",
  "voucherType",
  "voucherLetter",
];

function hasCorruptedScalarValue(value?: string): boolean {
  if (!value) {
    return false;
  }

  return hasCorruptedParserText(value);
}

function hasCorruptedVatDetails(items?: RawGeminiParsedVoucher["vatDetails"]): boolean {
  if (!items?.length) {
    return false;
  }

  return items.some((item) => hasCorruptedScalarValue(item.vatRateName));
}

function hasCorruptedTaxItems(
  items?: RawGeminiParsedVoucher["retentions"] | RawGeminiParsedVoucher["perceptions"]
): boolean {
  if (!items?.length) {
    return false;
  }

  return items.some((item) => {
    return hasCorruptedScalarValue(item.conceptName) || hasCorruptedScalarValue(item.province);
  });
}

export function getGeminiRepairFields(payload: RawGeminiParsedVoucher): GeminiRepairableField[] {
  const fields: GeminiRepairableField[] = repairableScalarFields.filter((field) =>
    hasCorruptedScalarValue(payload[field])
  );

  if (hasCorruptedVatDetails(payload.vatDetails)) {
    fields.push("vatDetails");
  }

  if (hasCorruptedTaxItems(payload.retentions)) {
    fields.push("retentions");
  }

  if (hasCorruptedTaxItems(payload.perceptions)) {
    fields.push("perceptions");
  }

  return [...new Set(fields)];
}

function hasMeaningfulScalarRepairValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && !hasCorruptedParserText(value);
}

function hasMeaningfulListRepairValue<T>(value: T[] | undefined): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

export function mergeGeminiRepairFields(
  payload: RawGeminiParsedVoucher,
  repairFields: GeminiRepairableField[],
  repairedPayload: Partial<RawGeminiParsedVoucher>
): RawGeminiParsedVoucher {
  const nextPayload = { ...payload };

  for (const field of repairFields) {
    if (field === "vatDetails") {
      if (hasMeaningfulListRepairValue(repairedPayload.vatDetails)) {
        nextPayload.vatDetails = repairedPayload.vatDetails;
      }

      continue;
    }

    if (field === "retentions") {
      if (hasMeaningfulListRepairValue(repairedPayload.retentions)) {
        nextPayload.retentions = repairedPayload.retentions;
      }

      continue;
    }

    if (field === "perceptions") {
      if (hasMeaningfulListRepairValue(repairedPayload.perceptions)) {
        nextPayload.perceptions = repairedPayload.perceptions;
      }

      continue;
    }

    const nextValue = repairedPayload[field];

    if (hasMeaningfulScalarRepairValue(nextValue)) {
      nextPayload[field] = nextValue;
    }
  }

  return nextPayload;
}
