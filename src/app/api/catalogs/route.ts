import { NextResponse } from 'next/server'
import { CatalogService } from 'src/services/catalog.service'

export async function GET() {
  try {
    const catalogService = new CatalogService()
    const catalog = await catalogService.getFullCatalog()
    
    return NextResponse.json(catalog)
  } catch (error) {
    console.error('Error fetching catalogs:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
