"use client";

import { useMemo } from "react";
import { apiRequest, parseJsonResponse } from "src/lib/api/api-client";
import { clearCachedPromise, getCachedPromise } from "src/lib/helpers/platform/promise-cache";
import { resolveVoucherThirdPartyEndpoint } from "src/lib/helpers/voucher/voucher-inline-third-party";
import { VoucherScreenType } from "src/types/voucher/voucher";
import { VoucherFormCatalogState, VoucherThirdPartyOption } from "src/types/voucher/voucher-form";

interface UseVoucherFormOptionsProps {
  isOpen: boolean;
  type: VoucherScreenType;
}

export interface VoucherFormOptionsData {
  catalogs: VoucherFormCatalogState;
  thirdParties: VoucherThirdPartyOption[];
}

interface UseVoucherFormOptionsResult {
  promise: Promise<VoucherFormOptionsData> | null;
}

function resolveVoucherFormOptionsCacheKey(type: VoucherScreenType): string {
  return `voucher-form-options:${type}`
}

function resolveVoucherThirdPartyList(
  payload: VoucherThirdPartyOption[] | { items: VoucherThirdPartyOption[] }
): VoucherThirdPartyOption[] {
  if (Array.isArray(payload)) {
    return payload
  }

  return payload.items
}

export async function fetchVoucherCatalogs(): Promise<VoucherFormCatalogState> {
  const response = await apiRequest("/api/catalogs")
  return parseJsonResponse<VoucherFormCatalogState>(response)
}

export async function fetchVoucherThirdParties(type: VoucherScreenType): Promise<VoucherThirdPartyOption[]> {
  const response = await apiRequest(resolveVoucherThirdPartyEndpoint(type))
  const payload = await parseJsonResponse<VoucherThirdPartyOption[] | { items: VoucherThirdPartyOption[] }>(response)
  return resolveVoucherThirdPartyList(payload)
}

export function invalidateVoucherFormOptions(type: VoucherScreenType): void {
  clearCachedPromise(resolveVoucherFormOptionsCacheKey(type))
}

export function useVoucherFormOptions({
  isOpen,
  type,
}: UseVoucherFormOptionsProps): UseVoucherFormOptionsResult {
  const promise = useMemo(() => {
    if (!isOpen) {
      return null;
    }

    return getCachedPromise(resolveVoucherFormOptionsCacheKey(type), () =>
      Promise.all([
        fetchVoucherCatalogs(),
        fetchVoucherThirdParties(type),
      ]).then(([catalogs, thirdParties]) => ({
        catalogs,
        thirdParties,
      }))
    );
  }, [isOpen, type]);

  return {
    promise,
  };
}
