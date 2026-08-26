export interface CompanyType {
  id: string
  name: string
  cuit: string
}

export interface CompanyContextType {
  companies: CompanyType[]
  activeCompany: CompanyType | null
  activeCompanyId: string | null
  setActiveCompanyId: (id: string) => void
  loading: boolean
  refreshCompanies: () => Promise<void>
}
