export type AsyncMutationStatus = "idle" | "loading" | "success" | "error"

export interface UseAsyncMutationOptions<TResult> {
  onSuccess?: (result: TResult) => Promise<void> | void
}

export interface AsyncMutationResult<TResult> {
  status: AsyncMutationStatus
  error: unknown
  execute: <TResultOverride = TResult>(operation: () => Promise<TResultOverride>) => Promise<TResultOverride>
  reset: () => void
}
