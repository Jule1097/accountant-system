export interface ThirdPartyLookup {
  findIdByCuit: (companyId: string, cuit: string) => Promise<string | null>
  findIdByIdentity: (companyId: string, cuit: string | null, name: string | null, type: "sale" | "purchase") => Promise<string | null>
}
