"use client"

import useSWR from "swr"
import { useCompany } from "src/contexts/company-context"
import { buildCompanyPathKey, companyPathFetcher } from "src/lib/helpers/platform/swr"
import { DashboardRecentActivityData } from "src/types/dashboard/dashboard"

interface UseDashboardActivityOptions {
  suspense?: boolean
}

export function useDashboardActivity(options?: UseDashboardActivityOptions) {
  const { activeCompanyId, loading: isCompanyLoading } = useCompany()
  const key = buildCompanyPathKey(activeCompanyId, "/api/dashboard/recent-activity", !isCompanyLoading)
  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([companyId, path]) => companyPathFetcher<DashboardRecentActivityData>(companyId, path),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      suspense: options?.suspense ?? true,
    }
  )

  return {
    data,
    error,
    isLoading,
    mutate,
  }
}
