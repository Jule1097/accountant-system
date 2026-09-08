import { resourceDetailModes, resourceDetailStates } from "src/lib/constants/resource"
import { DetailMode, DetailState } from "src/types/shared/conditional-detail"

export function resolveDetailState<TRecord>(
  mode: DetailMode,
  open: boolean,
  id: string | null,
  currentRecord: TRecord | undefined,
  state: DetailState,
  shouldLoad: boolean
): DetailState {
  if (mode === resourceDetailModes.detail) {
    return currentRecord ? resourceDetailStates.ready : resourceDetailStates.unavailable
  }

  if (!open || !id) {
    return resourceDetailStates.idle
  }

  return shouldLoad && state === resourceDetailStates.idle ? resourceDetailStates.loading : state
}
