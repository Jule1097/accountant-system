import { ParsedUrlState, UrlParameterConfigs } from "src/types/shared/url-state"

export interface UseTableQueryStateOptions<TParameters extends UrlParameterConfigs> {
  pathname: string
  parameters: TParameters
  pageKey?: keyof TParameters & string
  searchKey?: keyof TParameters & string
  sortKey?: keyof TParameters & string
  debounceMs?: number
  totalPages?: number
}

export interface TableQueryStateResult<TParameters extends UrlParameterConfigs> {
  query: ParsedUrlState<TParameters>
  searchValue: string
  setSearch: (value: string) => void
  cancelSearch: () => void
  setSort: (value: string) => void
  setPage: (value: number) => void
  update: (values: Partial<ParsedUrlState<TParameters>>) => void
}
