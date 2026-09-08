export type DetailMode = "detail" | "edit"
export type DetailState = "idle" | "loading" | "ready" | "unavailable" | "error"

export interface UseConditionalDetailOptions<TRecord> {
  mode: DetailMode
  id: string | null
  open?: boolean
  currentRecord?: TRecord
  fetchById: (id: string) => Promise<TRecord>
}

export interface ConditionalDetailResult<TRecord> {
  state: DetailState
  record: TRecord | undefined
  error: unknown
}
