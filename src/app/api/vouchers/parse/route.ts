import { NextRequest, NextResponse } from 'next/server'
import { parseInvoiceImage } from 'src/lib/gemini'
import { GeminiParsedVoucher } from 'src/models/GeminiParsedVoucher'
import { CatalogRepository } from 'src/repositories/catalog.repository'
import { ClientRepository } from 'src/repositories/client.repository'
import { CompanyRepository } from 'src/repositories/company.repository'
import { SupplierRepository } from 'src/repositories/supplier.repository'
import { VoucherKind } from 'src/types/gemini-parser'

function resolveVoucherKind(value: FormDataEntryValue | null): VoucherKind | null {
  if (value === 'sale' || value === 'purchase') {
    return value
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const companyId = request.headers.get('x-company-id')

    if (!companyId) {
      return NextResponse.json({ error: 'Falta la empresa activa' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const voucherKind = resolveVoucherKind(formData.get('voucherKind'))

    if (!file) {
      return NextResponse.json({ error: 'No se proveyó ningún archivo' }, { status: 400 })
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo excede el límite de 2MB' }, { status: 400 })
    }

    let mimeType = file.type

    if (!mimeType) {
      const name = file.name.toLowerCase()

      if (name.endsWith('.pdf')) {
        mimeType = 'application/pdf'
      } else if (name.endsWith('.png')) {
        mimeType = 'image/png'
      } else if (name.endsWith('.jpg') || name.endsWith('.jpeg')) {
        mimeType = 'image/jpeg'
      } else {
        mimeType = 'application/octet-stream'
      }
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64File = Buffer.from(arrayBuffer).toString('base64')
    const companyRepository = new CompanyRepository()
    const company = await companyRepository.findById(companyId)
    const activeCompanyCuit = company?.cuit
    const extractedData = await parseInvoiceImage(base64File, mimeType, {
      activeCompanyCuit,
      voucherKind,
    })
    const parsedVoucher = new GeminiParsedVoucher(extractedData, activeCompanyCuit)

    const catalogRepository = new CatalogRepository()
    const vatRates = await catalogRepository.getVatRates()
    const retentionConcepts = await catalogRepository.getRetentionConcepts()
    const perceptionConcepts = await catalogRepository.getPerceptionConcepts()
    const taxJurisdictions = await catalogRepository.getTaxJurisdictions()

    let thirdPartyId: string | null = null
    const lookupThirdPartyCuit = parsedVoucher.getLookupThirdPartyCuit()

    if (lookupThirdPartyCuit) {
      const clientRepository = new ClientRepository()
      const supplierRepository = new SupplierRepository()
      const client = await clientRepository.findByCuitAndCompany(companyId, lookupThirdPartyCuit)
      const supplier = client ? null : await supplierRepository.findByCuitAndCompany(companyId, lookupThirdPartyCuit)

      if (client) {
        thirdPartyId = client.id
      } else if (supplier) {
        thirdPartyId = supplier.id
      }
    }

    return NextResponse.json(
      parsedVoucher.toResponse(
        {
          vatRates,
          retentionConcepts,
          perceptionConcepts,
          taxJurisdictions,
        },
        thirdPartyId
      )
    )
  } catch (error: unknown) {
    console.error('Error parsing document:', error)
    return NextResponse.json({ error: 'Error procesando el documento' }, { status: 500 })
  }
}
