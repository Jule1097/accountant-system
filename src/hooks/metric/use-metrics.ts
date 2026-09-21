"use client"

import useSWR from "swr"
import { useCompany } from "src/contexts/company-context"
import { buildCompanyPathKey, companyPathFetcher } from "src/lib/helpers/platform/swr"
import type { MetricData } from "src/types/metric/metric"

interface UseMetricsOptions {
  suspense?: boolean
}

export function useMetrics(options?: UseMetricsOptions) {
  const { activeCompanyId, loading: isCompanyLoading } = useCompany()
  const key = buildCompanyPathKey(activeCompanyId, "/api/metrics", !isCompanyLoading)
  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([companyId, path]) => companyPathFetcher<MetricData>(companyId, path),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      suspense: options?.suspense ?? true,
    }
  )

  return { data, error, isLoading, mutate }
}
