"use client"

import useSWR from 'swr'
import { useCompany } from 'src/contexts/company-context'
import { buildCompanyPathKey, companyPathFetcher } from 'src/lib/helpers/swr'
import { AnalyticsData } from 'src/types/analytics'

export function useAnalytics() {
  const { activeCompanyId } = useCompany()
  const key = buildCompanyPathKey(activeCompanyId, '/api/analytics')
  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([companyId, path]) => companyPathFetcher<AnalyticsData>(companyId, path)
  )

  return {
    data,
    error,
    isLoading,
    mutate,
  }
}
