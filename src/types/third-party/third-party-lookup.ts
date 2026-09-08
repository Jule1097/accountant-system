export interface ThirdPartyLookup {
  findIdByCuit: (companyId: string, cuit: string) => Promise<string | null>
}
