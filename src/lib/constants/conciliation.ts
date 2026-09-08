export const conciliationQueryParams = {
  batchId: "batchId",
  tab: "tab",
  page: "page",
  notificationId: "notificationId",
} as const

export const conciliationQueryDefaults = {
  tab: "sales",
  page: 1,
} as const

export const conciliationTabs = ["sales", "purchases"] as const
