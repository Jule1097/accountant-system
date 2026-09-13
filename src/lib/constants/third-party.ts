export const thirdPartyRoles = {
  client: "client",
  supplier: "supplier",
} as const

export const thirdPartyEntityTypes = {
  clients: "clients",
  suppliers: "suppliers",
} as const

export const thirdPartyRecordActions = {
  view: "view",
  edit: "edit",
} as const

export const thirdPartyRoutes = {
  clients: "/clients",
  suppliers: "/suppliers",
} as const

export const thirdPartyQueryParams = {
  page: "page",
  pageSize: "pageSize",
  search: "search",
  sortBy: "sortBy",
  sortOrder: "sortOrder",
  recordId: "recordId",
} as const

export const thirdPartyQueryDefaults = {
  page: 1,
  pageSize: 10,
  sortBy: "name",
  sortOrder: "asc",
} as const

export const thirdPartySortByOptions = ["name", "cuit"] as const
export const thirdPartySortOrderOptions = ["asc", "desc"] as const
export const thirdPartyPageSizeOptions = [10, 20, 50] as const
export const thirdPartySearchDebounceMs = 1000
export const supplierTaxIdentificationModes = { withCuit: "with_cuit", withoutCuit: "without_cuit" } as const
export const supplierTaxIdentificationModeLabels = { with_cuit: "Con CUIT", without_cuit: "Sin CUIT" } as const
export const supplierTaxIdentificationModeValues = [supplierTaxIdentificationModes.withCuit, supplierTaxIdentificationModes.withoutCuit] as const
export const supplierCuitRequiredError = "El CUIT es obligatorio."
export const supplierCuitRemovalBlockedError = "No se puede quitar el CUIT de un proveedor con comprobantes asociados."

export const thirdPartyDomainErrors = {
  emptyName: "Third-party name must not be empty",
  invalidCuit: "Third-party CUIT has an invalid format",
} as const
