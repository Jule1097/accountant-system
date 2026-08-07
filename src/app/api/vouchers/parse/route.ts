import { NextRequest, NextResponse } from 'next/server'
import { parseInvoiceImage } from 'src/lib/gemini'
import { ClientRepository } from 'src/repositories/client.repository'
import { SupplierRepository } from 'src/repositories/supplier.repository'
import { CompanyRepository } from 'src/repositories/company.repository'
import { CatalogRepository } from 'src/repositories/catalog.repository'

export async function POST(request: NextRequest) {
  try {
    const companyId = request.headers.get('x-company-id')
    if (!companyId) {
      return NextResponse.json({ error: 'Falta la empresa activa' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

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
    const buffer = Buffer.from(arrayBuffer)
    const base64File = buffer.toString('base64')

    // Get active company CUIT
    const companyRepository = new CompanyRepository()
    const company = await companyRepository.findById(companyId)
    const activeCompanyCuit = company?.cuit

    const extractedData = await parseInvoiceImage(base64File, mimeType, activeCompanyCuit)

    let dateVal = extractedData.date || null
    if (dateVal) {
      const d = new Date(dateVal)
      if (isNaN(d.getTime())) {
        dateVal = null
      } else {
        dateVal = d.toISOString().split('T')[0]
      }
    }

    let thirdPartyCuit = extractedData.thirdPartyCuit || null
    let supplierName = extractedData.supplierName || null

    if (thirdPartyCuit && activeCompanyCuit) {
      const cleanExtracted = thirdPartyCuit.trim().replace(/-/g, '')
      const cleanActive = activeCompanyCuit.trim().replace(/-/g, '')
      if (cleanExtracted === cleanActive) {
        thirdPartyCuit = null
        supplierName = null
      }
    }

    // Resolve vatRates and retentionConcepts ids
    const catalogRepository = new CatalogRepository()
    const [vatRates, retentionConcepts] = await Promise.all([
      catalogRepository.getVatRates(),
      catalogRepository.getRetentionConcepts(),
    ])

    const resolvedVatDetails = (extractedData.vatDetails || []).map((item: any) => {
      const matched = vatRates.find(
        (vr) => vr.name.toLowerCase() === item.vatRateName?.toLowerCase()
      )
      return {
        vatRateId: matched ? matched.id : null,
        vatRateName: item.vatRateName || null,
        subtotal: item.subtotal !== undefined && item.subtotal !== null ? item.subtotal : null,
        vatAmount: item.vatAmount !== undefined && item.vatAmount !== null ? item.vatAmount : null,
      }
    })

    const resolvedRetentions = (extractedData.retentions || []).map((ret: any) => {
      const matched = retentionConcepts.find(
        (rc) => rc.name.toLowerCase() === ret.conceptName?.toLowerCase()
      )
      return {
        retentionConceptId: matched ? matched.id : null,
        conceptName: ret.conceptName || null,
        amount: ret.amount !== undefined && ret.amount !== null ? ret.amount : null,
        province: ret.province || null,
      }
    })

    const normalizedData = {
      posNumber: extractedData.posNumber || null,
      number: extractedData.number || null,
      date: dateVal,
      currency: extractedData.currency || null,
      subtotal: extractedData.subtotal || null,
      vatAmount: extractedData.vatAmount || null,
      totalAmount: extractedData.totalAmount || null,
      thirdPartyCuit,
      supplierName,
      voucherType: extractedData.voucherType || null,
      voucherLetter: extractedData.voucherLetter || null,
      vatDetails: resolvedVatDetails,
      retentions: resolvedRetentions,
    }

    let contactId: string | null = null

    if (normalizedData.thirdPartyCuit) {
      const originalCuit = normalizedData.thirdPartyCuit.trim()
      const cleanCuit = originalCuit.replace(/-/g, '')

      const clientRepository = new ClientRepository()
      const supplierRepository = new SupplierRepository()

      let client = await clientRepository.findByCuitAndCompany(companyId, originalCuit)
      if (!client && originalCuit !== cleanCuit) {
        client = await clientRepository.findByCuitAndCompany(companyId, cleanCuit)
      }

      let supplier = await supplierRepository.findByCuitAndCompany(companyId, originalCuit)
      if (!supplier && originalCuit !== cleanCuit) {
        supplier = await supplierRepository.findByCuitAndCompany(companyId, cleanCuit)
      }

      if (client) {
        contactId = client.id
      } else if (supplier) {
        contactId = supplier.id
      }
    }

    return NextResponse.json({
      ...normalizedData,
      contactId,
      thirdPartyId: contactId,
    })
  } catch (error: unknown) {
    console.error('Error parsing document:', error)
    return NextResponse.json({ error: 'Error procesando el documento' }, { status: 500 })
  }
}
