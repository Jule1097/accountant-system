"use client";

import { useMemo } from "react";
import { apiRequest, parseJsonResponse } from "src/lib/api/api-client";
import { useCompany } from "src/contexts/company-context";
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

function resolveVoucherFormOptionsCacheKey(type: VoucherScreenType, companyId: string): string {
  return `voucher-form-options:${companyId}:${type}`
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

export function invalidateVoucherFormOptions(type: VoucherScreenType, companyId: string | null): void {
  if (!companyId) {
    return
  }

  clearCachedPromise(resolveVoucherFormOptionsCacheKey(type, companyId))
}

export function useVoucherFormOptions({
  isOpen,
  type,
}: UseVoucherFormOptionsProps): UseVoucherFormOptionsResult {
  const { activeCompanyId, loading: isCompanyLoading } = useCompany();
  const promise = useMemo(() => {
    if (!isOpen || isCompanyLoading || !activeCompanyId) {
      return null;
    }

    return getCachedPromise(resolveVoucherFormOptionsCacheKey(type, activeCompanyId), () =>
      Promise.all([
        fetchVoucherCatalogs(),
        fetchVoucherThirdParties(type),
      ]).then(([catalogs, thirdParties]) => ({
        catalogs,
        thirdParties,
      }))
    );
  }, [activeCompanyId, isCompanyLoading, isOpen, type]);

  return {
    promise,
  };
}
