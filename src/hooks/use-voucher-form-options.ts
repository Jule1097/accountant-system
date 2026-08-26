"use client";

import { useMemo } from "react";
import { apiRequest } from "src/lib/api-client";
import { clearCachedPromise, getCachedPromise } from "src/lib/helpers/promise-cache";
import { resolveVoucherThirdPartyEndpoint } from "src/lib/helpers/voucher-inline-third-party";
import { VoucherScreenType } from "src/types/voucher";
import { VoucherFormCatalogState, VoucherThirdPartyOption } from "src/types/voucher-form";

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

async function parseResponseJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
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
  return parseResponseJson<VoucherFormCatalogState>(response)
}

export async function fetchVoucherThirdParties(type: VoucherScreenType): Promise<VoucherThirdPartyOption[]> {
  const response = await apiRequest(resolveVoucherThirdPartyEndpoint(type))
  const payload = await parseResponseJson<VoucherThirdPartyOption[] | { items: VoucherThirdPartyOption[] }>(response)
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
