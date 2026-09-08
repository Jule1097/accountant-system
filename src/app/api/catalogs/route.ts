import { NextRequest, NextResponse } from 'next/server'
import { resolveApplicationErrorResponse } from 'src/lib/helpers/api/application-error-response'
import { CatalogService } from 'src/services/catalog/Catalog'

export async function GET(request: NextRequest) {
  try {
    const catalogService = new CatalogService()
    const catalog = await catalogService.getFullCatalog()
    
    return NextResponse.json(catalog)
  } catch (error) {
    return resolveApplicationErrorResponse(error, { request, operation: 'fetch catalogs', resource: 'catalog', workflow: 'query' })
  }
}
