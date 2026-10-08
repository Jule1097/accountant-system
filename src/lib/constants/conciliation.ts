export const conciliationQueryParams = {
  batchId: "batchId",
  tab: "tab",
  page: "page",
} as const

export const conciliationQueryDefaults = {
  tab: "sales",
  page: 1,
} as const

export const conciliationTabs = ["sales", "purchases"] as const
export const conciliationRasterPreview = { defaultZoom: 1, minZoom: 0.5, maxZoom: 3, zoomStep: 0.25, rotationStep: 90 } as const
export const conciliationRecoveryMessages = {
  cleanupPending: "La factura fue guardada y requiere eliminar el archivo temporal.",
  recovered: "La factura se guardó correctamente.",
} as const
export const conciliationRecoveryLogContext = {
  path: "/api/conciliations/items/[itemId]/recover",
  providerName: "supabase",
} as const
