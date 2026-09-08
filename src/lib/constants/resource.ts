export const defaultResourceSearchDebounceMs = 500

export const resourceDetailModes = {
  detail: "detail",
  edit: "edit",
} as const

export const resourceDetailStates = {
  idle: "idle",
  loading: "loading",
  ready: "ready",
  unavailable: "unavailable",
  error: "error",
} as const

export const resourceMutationStatuses = {
  idle: "idle",
  loading: "loading",
  success: "success",
  error: "error",
} as const

export const resourceOperationErrors = {
  activeCompanyRequired: "An active company is required",
  createUnavailable: "Create operation is not available",
  updateUnavailable: "Update operation is not available",
  deleteUnavailable: "Delete operation is not available",
} as const
