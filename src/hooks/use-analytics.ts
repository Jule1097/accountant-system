"use client"

import { useMemo } from 'react'
import { useCompany } from 'src/contexts/company-context'
import { apiRequest } from 'src/lib/api-client'
import { UseAnalyticsResult, AnalyticsData } from 'src/types/analytics'

export function useAnalytics(): UseAnalyticsResult {
  const { activeCompanyId } = useCompany()

  const promise = useMemo(() => {
    if (!activeCompanyId) {
      return null
    }
    return apiRequest('/api/analytics')
      .then((res) => res.json() as Promise<AnalyticsData>)
  }, [activeCompanyId])

  return {
    promise
  }
}

