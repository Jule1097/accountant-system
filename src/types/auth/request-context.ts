export interface RequestContext {
  userId: string
  companyId: string
}

export interface RequestContextDependencies {
  getAuthenticatedUserId: (request: Request) => Promise<string | null>
  getUserCompanyIds?: (userId: string) => Promise<string[]>
  belongsToCompany: (userId: string, companyId: string) => Promise<boolean>
}
