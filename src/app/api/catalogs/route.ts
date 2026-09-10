import { NextRequest, NextResponse } from 'next/server'
import { resolveApplicationErrorResponse } from 'src/lib/helpers/api/application-error-response'
import { executeRequestWithContext } from 'src/lib/helpers/api/request-handler'
import { CatalogService } from 'src/services/catalog/Catalog'

export async function GET(request: NextRequest) {
  return executeRequestWithContext(request, async () => {
    const catalogService = new CatalogService()
    const catalog = await catalogService.getFullCatalog()

    return NextResponse.json(catalog)
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: 'fetch catalogs', resource: 'catalog', workflow: 'query' }))
}
