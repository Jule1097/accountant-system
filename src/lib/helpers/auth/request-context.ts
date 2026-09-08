import { NextRequest, NextResponse } from "next/server"
import { requestContextErrorCodes, requestContextHeaders } from "src/lib/constants/auth"
import { createRequestSupabaseClient } from "src/lib/integrations/supabase-server"
import { CompanyRepository } from "src/repositories/company/company.repository"
import { RequestContextError } from "src/lib/errors/request-context"
import { RequestContext, RequestContextDependencies } from "src/types/auth/request-context"

export async function getAuthenticatedUserId(request: Request): Promise<string | null> {
  const response = NextResponse.next()
  const supabase = createRequestSupabaseClient(request as NextRequest, response)
  const { data: { user }, error } = await supabase.auth.getUser()
  return error || !user?.id ? null : user.id
}

export async function belongsToCompany(userId: string, companyId: string): Promise<boolean> {
  const companyIds = await getUserCompanyIds(userId)
  return companyIds.includes(companyId)
}

export async function getUserCompanyIds(userId: string): Promise<string[]> {
  const companyRepository = new CompanyRepository()
  const companies = await companyRepository.findByUser(userId)
  return companies.map((company) => company.id)
}

export async function requireRequestContext(request: Request, dependencies: RequestContextDependencies = { getAuthenticatedUserId, getUserCompanyIds, belongsToCompany }): Promise<RequestContext> {
  const userId = await dependencies.getAuthenticatedUserId(request)
  if (!userId) throw new RequestContextError(requestContextErrorCodes.unauthenticated)
  let companyId = request.headers.get(requestContextHeaders.activeCompanyId)
  if (!companyId) {
    const companyIds = await dependencies.getUserCompanyIds?.(userId)
    if (companyIds?.length !== 1) throw new RequestContextError(requestContextErrorCodes.companyRequired)
    companyId = companyIds[0]
  } else if (!await dependencies.belongsToCompany(userId, companyId)) throw new RequestContextError(requestContextErrorCodes.companyForbidden)
  return { userId, companyId }
}
