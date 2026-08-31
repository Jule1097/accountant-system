"use client"

import useSWR from 'swr'
import { useCompany } from 'src/contexts/company-context'
import { buildCompanyPathKey, companyPathFetcher } from 'src/lib/helpers/platform/swr'
import { AnalyticsData } from 'src/types/analytics/analytics'

interface UseAnalyticsOptions {
  suspense?: boolean
}

export function useAnalytics(options?: UseAnalyticsOptions) {
  const { activeCompanyId, loading: isCompanyLoading } = useCompany()
  const key = buildCompanyPathKey(activeCompanyId, '/api/analytics', !isCompanyLoading)
  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([companyId, path]) => companyPathFetcher<AnalyticsData>(companyId, path),
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
