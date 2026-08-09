import { NextRequest, NextResponse } from 'next/server'
import { parseInvoiceImage } from 'src/lib/gemini'
import { ClientRepository } from 'src/repositories/client.repository'
import { SupplierRepository } from 'src/repositories/supplier.repository'
import { CompanyRepository } from 'src/repositories/company.repository'
import { CatalogRepository } from 'src/repositories/catalog.repository'
import { compareCuit, normalizeCuit } from 'src/lib/cuit'
import { resolveTaxJurisdictionName } from 'src/lib/tax-jurisdictions'

interface ParsedTaxItem {
  conceptName?: string
  amount?: number
  province?: string
}

interface ParsedVatDetail {
  vatRateName?: string
  subtotal?: number
  vatAmount?: number
}

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
    const base64File = Buffer.from(arrayBuffer).toString('base64')
    const companyRepository = new CompanyRepository()
    const company = await companyRepository.findById(companyId)
    const activeCompanyCuit = company?.cuit
    const extractedData = await parseInvoiceImage(base64File, mimeType, activeCompanyCuit)

    let dateValue = extractedData.date || null

    if (dateValue) {
      const parsedDate = new Date(dateValue)

      if (isNaN(parsedDate.getTime())) {
        dateValue = null
      } else {
        dateValue = parsedDate.toISOString().split('T')[0]
      }
    }

    let thirdPartyCuit = extractedData.thirdPartyCuit ? normalizeCuit(extractedData.thirdPartyCuit) : null
    let supplierName = extractedData.supplierName || null

    if (thirdPartyCuit && activeCompanyCuit && compareCuit(thirdPartyCuit, activeCompanyCuit)) {
      thirdPartyCuit = null
      supplierName = null
    }

    const catalogRepository = new CatalogRepository()
      const [vatRates, retentionConcepts, perceptionConcepts, taxJurisdictions] = await Promise.all([
      catalogRepository.getVatRates(),
      catalogRepository.getRetentionConcepts(),
      catalogRepository.getPerceptionConcepts(),
      catalogRepository.getTaxJurisdictions(),
    ])

    const resolvedVatDetails = (extractedData.vatDetails || []).map((detail: ParsedVatDetail) => {
      const matchedVatRate = vatRates.find((vatRate) => vatRate.name.toLowerCase() === detail.vatRateName?.toLowerCase())

      return {
        vatRateId: matchedVatRate ? matchedVatRate.id : null,
        vatRateName: detail.vatRateName || null,
        subtotal: detail.subtotal ?? null,
        vatAmount: detail.vatAmount ?? null,
      }
    })

    const resolvedRetentions = (extractedData.retentions || []).map((retention: ParsedTaxItem) => {
      const matchedRetentionConcept = retentionConcepts.find(
        (concept) => concept.name.toLowerCase() === retention.conceptName?.toLowerCase()
      )
      const jurisdictionName = resolveTaxJurisdictionName(retention.province)
      const matchedTaxJurisdiction = jurisdictionName
        ? taxJurisdictions.find((jurisdiction) => jurisdiction.name === jurisdictionName)
        : null

      return {
        retentionConceptId: matchedRetentionConcept ? matchedRetentionConcept.id : null,
        taxJurisdictionId: matchedTaxJurisdiction ? matchedTaxJurisdiction.id : null,
        conceptName: retention.conceptName || null,
        amount: retention.amount ?? null,
        taxJurisdictionName: matchedTaxJurisdiction ? matchedTaxJurisdiction.name : jurisdictionName,
      }
    })

    const resolvedPerceptions = (extractedData.perceptions || []).map((perception: ParsedTaxItem) => {
      const matchedPerceptionConcept = perceptionConcepts.find(
        (concept) => concept.name.toLowerCase() === perception.conceptName?.toLowerCase()
      )
      const jurisdictionName = resolveTaxJurisdictionName(perception.province)
      const matchedTaxJurisdiction = jurisdictionName
        ? taxJurisdictions.find((jurisdiction) => jurisdiction.name === jurisdictionName)
        : null

      return {
        perceptionConceptId: matchedPerceptionConcept ? matchedPerceptionConcept.id : null,
        taxJurisdictionId: matchedTaxJurisdiction ? matchedTaxJurisdiction.id : null,
        conceptName: perception.conceptName || null,
        amount: perception.amount ?? null,
        taxJurisdictionName: matchedTaxJurisdiction ? matchedTaxJurisdiction.name : jurisdictionName,
      }
    })

    let contactId: string | null = null

    if (thirdPartyCuit) {
      const clientRepository = new ClientRepository()
      const supplierRepository = new SupplierRepository()
      const [client, supplier] = await Promise.all([
        clientRepository.findByCuitAndCompany(companyId, thirdPartyCuit),
        supplierRepository.findByCuitAndCompany(companyId, thirdPartyCuit),
      ])

      if (client) {
        contactId = client.id
      } else if (supplier) {
        contactId = supplier.id
      }
    }

    return NextResponse.json({
      posNumber: extractedData.posNumber || null,
      number: extractedData.number || null,
      date: dateValue,
      currency: extractedData.currency || null,
      subtotal: extractedData.subtotal ?? null,
      vatAmount: extractedData.vatAmount ?? null,
      nonTaxableAmount: extractedData.nonTaxableAmount ?? null,
      exemptAmount: extractedData.exemptAmount ?? null,
      otherTaxesAmount: extractedData.otherTaxesAmount ?? null,
      totalAmount: extractedData.totalAmount ?? null,
      concept: extractedData.concept || null,
      paymentMethod: extractedData.paymentMethod || null,
      status: extractedData.status || 'pending',
      paymentDate: extractedData.paymentDate || null,
      paidAmount: extractedData.paidAmount ?? 0,
      comments: extractedData.comments || null,
      thirdPartyCuit,
      supplierName,
      voucherType: extractedData.voucherType || null,
      voucherLetter: extractedData.voucherLetter || null,
      vatDetails: resolvedVatDetails,
      retentions: resolvedRetentions,
      perceptions: resolvedPerceptions,
      contactId,
      thirdPartyId: contactId,
    })
  } catch (error: unknown) {
    console.error('Error parsing document:', error)
    return NextResponse.json({ error: 'Error procesando el documento' }, { status: 500 })
  }
}
