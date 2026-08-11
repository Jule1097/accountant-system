import { NextRequest } from 'next/server'
import { POST } from '../app/api/vouchers/parse/route'
import { parseInvoiceImage } from '../lib/gemini'
import { CatalogRepository } from '../repositories/catalog.repository'
import { ClientRepository } from '../repositories/client.repository'
import { CompanyRepository } from '../repositories/company.repository'
import { SupplierRepository } from '../repositories/supplier.repository'

jest.mock('../lib/gemini')
jest.mock('../repositories/client.repository')
jest.mock('../repositories/supplier.repository')
jest.mock('../repositories/company.repository')
jest.mock('../repositories/catalog.repository')

describe('Parser Route Handler', () => {
  const companyId = 'company-uuid'
  const mockFile = {
    size: 1000,
    type: 'application/pdf',
    name: 'invoice.pdf',
    arrayBuffer: async () => new ArrayBuffer(8),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    CompanyRepository.prototype.findById = jest.fn().mockResolvedValue({
      id: companyId,
      name: 'TEEM',
      cuit: '30-11111111-9',
    })

    CatalogRepository.prototype.getVatRates = jest.fn().mockResolvedValue([
      { id: 'vat-21', name: '21%', rate: 0.21 },
      { id: 'vat-105', name: '10.5%', rate: 0.105 },
    ])

    CatalogRepository.prototype.getRetentionConcepts = jest.fn().mockResolvedValue([
      { id: 'ret-gan', name: 'Retención de Ganancias Sufrida', type: 'sale' },
    ])

    CatalogRepository.prototype.getPerceptionConcepts = jest.fn().mockResolvedValue([
      { id: 'per-iibb', name: 'Percepción de Ingresos Brutos' },
      { id: 'per-iva', name: 'Percepción de IVA' },
    ])

    CatalogRepository.prototype.getTaxJurisdictions = jest.fn().mockResolvedValue([
      { id: 'jur-caba', name: 'CABA' },
      { id: 'jur-pba', name: 'Buenos Aires' },
    ])
  })

  it('should reject requests without active company header with 400', async () => {
    const request = {
      headers: { get: () => null },
    } as unknown as NextRequest

    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).error).toBe('Falta la empresa activa')
  })

  it('should reject requests without file with 400', async () => {
    const request = {
      headers: { get: () => companyId },
      formData: async () => ({ get: () => null }),
    } as unknown as NextRequest

    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).error).toBe('No se proveyó ningún archivo')
  })

  it('should reject files exceeding 2MB with 400', async () => {
    const request = {
      headers: { get: () => companyId },
      formData: async () => ({
        get: () => ({
          size: 3 * 1024 * 1024,
          type: 'application/pdf',
          name: 'large.pdf',
          arrayBuffer: async () => new ArrayBuffer(8),
        }),
      }),
    } as unknown as NextRequest

    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).error).toBe('El archivo excede el límite de 2MB')
  })

  it('should parse document and find the related third party in clients', async () => {
    ;(parseInvoiceImage as jest.Mock).mockResolvedValue({
      posNumber: '00002',
      number: '00000123',
      date: '2026-08-06',
      currency: '$',
      subtotal: 100,
      vatAmount: 21,
      totalAmount: 121,
      thirdPartyCuit: '30222222229',
      thirdPartyName: 'Test Client',
      voucherType: 'Factura',
      voucherLetter: 'A',
    })

    ClientRepository.prototype.findByCuitAndCompany = jest.fn().mockResolvedValue({ id: 'client-uuid-123' })
    SupplierRepository.prototype.findByCuitAndCompany = jest.fn().mockResolvedValue(null)

    const request = {
      headers: { get: () => companyId },
      formData: async () => ({
        get: (key: string) => {
          if (key === 'file') {
            return mockFile
          }

          if (key === 'voucherKind') {
            return 'sale'
          }

          return null
        },
      }),
    } as unknown as NextRequest

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(parseInvoiceImage).toHaveBeenCalledWith(
      expect.any(String),
      'application/pdf',
      expect.objectContaining({
        activeCompanyCuit: '30-11111111-9',
        voucherKind: 'sale',
      })
    )
    expect(body.thirdPartyCuit).toBe('30-22222222-9')
    expect(body.thirdPartyName).toBe('Test Client')
    expect(body.thirdPartyId).toBe('client-uuid-123')
  })

  it('should nullify shared third party fields when CUIT matches the active company CUIT', async () => {
    ;(parseInvoiceImage as jest.Mock).mockResolvedValue({
      posNumber: '00002',
      number: '00000123',
      date: '2026-08-06',
      currency: '$',
      subtotal: 100,
      vatAmount: 21,
      totalAmount: 121,
      thirdPartyCuit: '30-11111111-9',
      thirdPartyName: 'TEEM',
      voucherType: 'Factura',
      voucherLetter: 'A',
    })

    ClientRepository.prototype.findByCuitAndCompany = jest.fn().mockResolvedValue(null)
    SupplierRepository.prototype.findByCuitAndCompany = jest.fn().mockResolvedValue(null)

    const request = {
      headers: { get: () => companyId },
      formData: async () => ({ get: () => mockFile }),
    } as unknown as NextRequest

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.thirdPartyCuit).toBeNull()
    expect(body.thirdPartyName).toBeNull()
    expect(body.thirdPartyId).toBeNull()
  })

  it('should resolve vatDetails, retentions, and perceptions using database catalog lookups', async () => {
    ;(parseInvoiceImage as jest.Mock).mockResolvedValue({
      posNumber: '00002',
      number: '00000123',
      date: '2026-08-06',
      currency: '$',
      subtotal: 100,
      vatAmount: 21,
      nonTaxableAmount: 5,
      exemptAmount: 3,
      otherTaxesAmount: 7,
      totalAmount: 146,
      thirdPartyCuit: '30-22222222-9',
      thirdPartyName: 'Supplier ABC',
      voucherType: 'Factura',
      voucherLetter: 'A',
      vatDetails: [
        { vatRateName: '21%', subtotal: 100, vatAmount: 21 },
        { vatRateName: 'NonExistentVAT', subtotal: 50, vatAmount: 0 },
      ],
      retentions: [
        { conceptName: 'Retención de Ganancias Sufrida', amount: 50, province: 'CABA' },
      ],
      perceptions: [
        { conceptName: 'Percepción de Ingresos Brutos', amount: 15, province: 'CABA' },
        { conceptName: 'ConceptoInexistente', amount: 99, province: 'Buenos Aires' },
      ],
    })

    ClientRepository.prototype.findByCuitAndCompany = jest.fn().mockResolvedValue(null)
    SupplierRepository.prototype.findByCuitAndCompany = jest.fn().mockResolvedValue(null)

    const request = {
      headers: { get: () => companyId },
      formData: async () => ({ get: () => mockFile }),
    } as unknown as NextRequest

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.nonTaxableAmount).toBe(5)
    expect(body.exemptAmount).toBe(3)
    expect(body.otherTaxesAmount).toBe(7)
    expect(body.vatDetails).toEqual([
      { vatRateId: 'vat-21', vatRateName: '21%', subtotal: 100, vatAmount: 21 },
      { vatRateId: null, vatRateName: 'NonExistentVAT', subtotal: 50, vatAmount: 0 },
    ])
    expect(body.retentions).toEqual([
      {
        retentionConceptId: 'ret-gan',
        taxJurisdictionId: 'jur-caba',
        conceptName: 'Retención de Ganancias Sufrida',
        amount: 50,
        taxJurisdictionName: 'CABA',
      },
    ])
    expect(body.perceptions).toEqual([
      {
        perceptionConceptId: 'per-iibb',
        taxJurisdictionId: 'jur-caba',
        conceptName: 'Percepción de Ingresos Brutos',
        amount: 15,
        taxJurisdictionName: 'CABA',
      },
      {
        perceptionConceptId: null,
        taxJurisdictionId: 'jur-pba',
        conceptName: 'ConceptoInexistente',
        amount: 99,
        taxJurisdictionName: 'Buenos Aires',
      },
    ])
  })

  it('should keep conservative null and empty-array fallback values when extraction is incomplete', async () => {
    ;(parseInvoiceImage as jest.Mock).mockResolvedValue({
      posNumber: '00002',
      number: '00000123',
      voucherType: 'Factura',
      voucherLetter: 'B',
    })

    ClientRepository.prototype.findByCuitAndCompany = jest.fn().mockResolvedValue(null)
    SupplierRepository.prototype.findByCuitAndCompany = jest.fn().mockResolvedValue(null)

    const request = {
      headers: { get: () => companyId },
      formData: async () => ({ get: () => mockFile }),
    } as unknown as NextRequest

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.date).toBeNull()
    expect(body.thirdPartyCuit).toBeNull()
    expect(body.thirdPartyName).toBeNull()
    expect(body.thirdPartyId).toBeNull()
    expect(body.vatDetails).toEqual([])
    expect(body.retentions).toEqual([])
    expect(body.perceptions).toEqual([])
  })
})
