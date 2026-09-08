"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { defaultResourceSearchDebounceMs } from "src/lib/constants/resource"
import { parseUrlState, updateUrlState } from "src/lib/helpers/shared/url-state"
import { TableQueryStateResult, UseTableQueryStateOptions } from "src/types/shared/table-query-state"
import { ParsedUrlState, UrlParameterConfigs } from "src/types/shared/url-state"

export function useTableQueryState<TParameters extends UrlParameterConfigs>({ pathname, parameters, pageKey, searchKey, sortKey, debounceMs = defaultResourceSearchDebounceMs, totalPages, }: UseTableQueryStateOptions<TParameters>): TableQueryStateResult<TParameters> {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchSnapshot = searchParams.toString()
  const query = useMemo(() => parseUrlState(new URLSearchParams(searchSnapshot), parameters),
    [parameters, searchSnapshot]
  )
  const sourceSearchValue = searchKey ? String(query[searchKey] ?? "") : ""
  const [localSearchState, setLocalSearchState] = useState({ sourceValue: sourceSearchValue, value: sourceSearchValue })

  const timeoutRef = useRef<number | null>(null)
  const cancelSearch = useCallback((): void => {
    if (timeoutRef.current === null) return
    window.clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }, [])

  const searchValue = localSearchState.sourceValue === sourceSearchValue ? localSearchState.value : sourceSearchValue

  const replaceQuery = useCallback((values: Partial<ParsedUrlState<TParameters>>): void => {
    const nextSearchParams = updateUrlState(new URLSearchParams(searchSnapshot), parameters, values)
    router.replace(`${pathname}${nextSearchParams.toString() ? `?${nextSearchParams}` : ""}`, { scroll: false })
  }, [parameters, pathname, router, searchSnapshot])

  const normalizedQuery = pageKey && totalPages && Number(query[pageKey]) > totalPages ? { ...query, [pageKey]: totalPages } : query

  useEffect(() => {
    if (!pageKey || !totalPages || Number(query[pageKey]) <= totalPages) {
      return
    }

    replaceQuery({ [pageKey]: totalPages } as Partial<ParsedUrlState<TParameters>>)
  }, [pageKey, query, replaceQuery, totalPages])

  const setSearch = useCallback((value: string): void => {
    setLocalSearchState({ sourceValue: sourceSearchValue, value })
    if (!searchKey) {
      return
    }

    cancelSearch()

    timeoutRef.current = window.setTimeout(() => {
      replaceQuery({ [searchKey]: value, ...(pageKey ? { [pageKey]: 1 } : {}) } as Partial<ParsedUrlState<TParameters>>)
      timeoutRef.current = null
    }, debounceMs)
  }, [cancelSearch, debounceMs, pageKey, replaceQuery, searchKey, sourceSearchValue])

  const setSort = useCallback((value: string): void => {
    if (!sortKey) {
      return
    }

    replaceQuery({ [sortKey]: value, ...(pageKey ? { [pageKey]: 1 } : {}) } as Partial<ParsedUrlState<TParameters>>)
  }, [pageKey, replaceQuery, sortKey])

  const setPage = useCallback((value: number): void => {
    if (pageKey) {
      replaceQuery({ [pageKey]: value } as Partial<ParsedUrlState<TParameters>>)
    }
  }, [pageKey, replaceQuery])

  const update = useCallback((values: Partial<ParsedUrlState<TParameters>>): void => {
    replaceQuery(values)
  }, [replaceQuery])

  useEffect(() => cancelSearch, [cancelSearch])

  return { query: normalizedQuery, searchValue, setSearch, cancelSearch, setSort, setPage, update }
}
