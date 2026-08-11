"use client";

import { useMemo } from "react";
import { apiRequest } from "src/lib/api-client";
import { getCachedPromise } from "src/lib/helpers/promise-cache";
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

function resolveThirdPartyEndpoint(type: VoucherScreenType): string {
  if (type === "sales") {
    return "/api/clients";
  }

  return "/api/suppliers";
}

export function useVoucherFormOptions({
  isOpen,
  type,
}: UseVoucherFormOptionsProps): UseVoucherFormOptionsResult {
  const promise = useMemo(() => {
    if (!isOpen) {
      return null;
    }

    return getCachedPromise(`voucher-form-options:${type}`, () =>
      Promise.all([
        apiRequest("/api/catalogs").then(parseResponseJson<VoucherFormCatalogState>),
        apiRequest(resolveThirdPartyEndpoint(type)).then(parseResponseJson<VoucherThirdPartyOption[]>),
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
