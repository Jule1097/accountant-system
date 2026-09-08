"use client";

import { useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { apiRequest, parseJsonResponse } from "src/lib/api/api-client";
import { buildClientSupplierCollectionPath } from "src/lib/helpers/third-party/third-party-management";
import {
  mergeVoucherThirdPartyOptions,
  resolveMatchingVoucherThirdPartyRecord,
  resolveVoucherInlineInitialValues,
  resolveVoucherThirdPartyModalType,
  shouldShowVoucherInlineThirdPartyAction,
} from "src/lib/helpers/voucher/voucher-inline-third-party";
import { fetchVoucherThirdParties, invalidateVoucherFormOptions } from "src/hooks/voucher/use-voucher-form-options";
import { ClientSupplierFormValues, ClientSupplierRecord } from "src/types/third-party/third-party-resource";
import { VoucherScreenType } from "src/types/voucher/voucher";
import { ParsedVoucherData } from "src/types/parser/gemini-parser";
import { VoucherThirdPartyOption } from "src/types/voucher/voucher-form";
import { VoucherFormValues } from "src/lib/schemas/voucher/voucher-form-schemas";

interface UseVoucherInlineThirdPartyProps {
  type: VoucherScreenType;
  form: UseFormReturn<VoucherFormValues>;
  parsedData?: ParsedVoucherData | null;
  thirdParties: VoucherThirdPartyOption[];
  setThirdParties: (options: VoucherThirdPartyOption[]) => void;
}

interface UseVoucherInlineThirdPartyResult {
  isInlineModalOpen: boolean;
  inlineModalType: "clients" | "suppliers";
  inlineInitialValues: { name?: string; cuit?: string };
  shouldShowInlineAction: boolean;
  openInlineModal: () => void;
  handleInlineModalOpenChange: (open: boolean) => void;
  handleInlineSuccess: (record?: ClientSupplierRecord) => Promise<void>;
  resolveDuplicateRecord: (values: ClientSupplierFormValues) => Promise<ClientSupplierRecord | null>;
}

export function useVoucherInlineThirdParty({
  type,
  form,
  parsedData,
  thirdParties,
  setThirdParties,
}: UseVoucherInlineThirdPartyProps): UseVoucherInlineThirdPartyResult {
  const [isInlineModalOpen, setIsInlineModalOpen] = useState(false);
  const selectedThirdPartyId = form.watch("thirdPartyId");
  const selectedThirdParty = useMemo(
    () => thirdParties.find((thirdParty) => thirdParty.id === selectedThirdPartyId),
    [selectedThirdPartyId, thirdParties]
  );
  const inlineInitialValues = useMemo(
    () => resolveVoucherInlineInitialValues(parsedData, selectedThirdParty),
    [parsedData, selectedThirdParty]
  );
  const shouldShowInlineAction = useMemo(
    () => shouldShowVoucherInlineThirdPartyAction(parsedData, selectedThirdParty),
    [parsedData, selectedThirdParty]
  );

  const handleInlineSuccess = async (record?: ClientSupplierRecord): Promise<void> => {
    if (!record) {
      return;
    }

    invalidateVoucherFormOptions(type);
    const refreshedThirdParties = await fetchVoucherThirdParties(type);
    const nextThirdParties = mergeVoucherThirdPartyOptions(refreshedThirdParties, record);

    setThirdParties(nextThirdParties);

    setTimeout(() => {
      form.setValue("thirdPartyId", record.id, { shouldDirty: true, shouldValidate: true });
      form.setValue("thirdPartyCuit", record.cuit, { shouldDirty: true, shouldValidate: true });
    }, 0);
  };

  const resolveDuplicateRecord = async (
    values: ClientSupplierFormValues
  ): Promise<ClientSupplierRecord | null> => {
    const searchValue = values.name.trim() || values.cuit.trim();
    const response = await apiRequest(
      buildClientSupplierCollectionPath(resolveVoucherThirdPartyModalType(type), {
        page: 1,
        pageSize: 50,
        search: searchValue,
        sortBy: "name",
        sortOrder: "asc",
        recordId: null,
      })
    );
    const payload = await parseJsonResponse<{
      items: ClientSupplierRecord[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }>(response);

    const resolvedRecord = resolveMatchingVoucherThirdPartyRecord(payload.items, values);

    if (!resolvedRecord) {
      return null;
    }

    await handleInlineSuccess(resolvedRecord);

    return resolvedRecord;
  };

  return {
    isInlineModalOpen,
    inlineModalType: resolveVoucherThirdPartyModalType(type),
    inlineInitialValues,
    shouldShowInlineAction,
    openInlineModal: () => setIsInlineModalOpen(true),
    handleInlineModalOpenChange: setIsInlineModalOpen,
    handleInlineSuccess,
    resolveDuplicateRecord,
  };
}
