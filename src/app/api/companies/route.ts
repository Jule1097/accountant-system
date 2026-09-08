import { NextRequest, NextResponse } from 'next/server'
import { apiResponseMessages } from 'src/lib/constants/api-response'
import { getAuthenticatedUserId } from 'src/lib/helpers/auth/request-context'
import { CompanyService } from 'src/services/company/Company'
import { applicationErrorCodes } from 'src/lib/constants/application-error'
import { ApplicationError } from 'src/lib/errors/application-error'
import { resolveApplicationErrorResponse } from 'src/lib/helpers/api/application-error-response'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      throw new ApplicationError(applicationErrorCodes.unauthenticated, apiResponseMessages.auth.invalidSession, 'Company list authentication failed')
    }

    const companyService = new CompanyService()
    const companies = await companyService.getCompaniesByUser(userId)

    return NextResponse.json(companies)
  } catch (error) {
    return resolveApplicationErrorResponse(error, { request, operation: 'fetch companies', resource: 'company', workflow: 'query' })
  }
}
