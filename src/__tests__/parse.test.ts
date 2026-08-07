import { POST } from '../app/api/vouchers/parse/route'
import { NextRequest } from 'next/server'
import { parseInvoiceImage } from '../lib/gemini'
import { ClientRepository } from '../repositories/client.repository'
import { SupplierRepository } from '../repositories/supplier.repository'
import { CompanyRepository } from '../repositories/company.repository'
import { CatalogRepository } from '../repositories/catalog.repository'

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
    arrayBuffer: async () => new ArrayBuffer(8)
  }

  beforeEach(() => {
    jest.clearAllMocks()

    CompanyRepository.prototype.findById = jest.fn().mockResolvedValue({
      id: 'company-uuid',
      name: 'TEEM',
      cuit: '30-11111111-9'
    })

    CatalogRepository.prototype.getVatRates = jest.fn().mockResolvedValue([
      { id: 'vat-21', name: '21%', rate: 0.21 },
      { id: 'vat-105', name: '10.5%', rate: 0.105 }
    ])

    CatalogRepository.prototype.getRetentionConcepts = jest.fn().mockResolvedValue([
      { id: 'ret-gan', name: 'Retención de Ganancias', type: 'purchase' },
      { id: 'ret-iibb', name: 'Percepción de Ingresos Brutos', type: 'purchase' }
    ])
  })

  it('should reject requests without active company header with 400', async () => {
    const request = {
      headers: {
        get: (name: string) => null
      }
    } as unknown as NextRequest

    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Falta la empresa activa')
  })

  it('should reject requests without file with 400', async () => {
    const request = {
      headers: {
        get: (name: string) => companyId
      },
      formData: async () => ({
        get: (name: string) => null
      })
    } as unknown as NextRequest

    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('No se proveyó ningún archivo')
  })

  it('should reject files exceeding 2MB with 400', async () => {
    const largeFile = {
      size: 3 * 1024 * 1024,
      type: 'application/pdf',
      name: 'large.pdf',
      arrayBuffer: async () => new ArrayBuffer(8)
    }

    const request = {
      headers: {
        get: (name: string) => companyId
      },
      formData: async () => ({
        get: (name: string) => largeFile
      })
    } as unknown as NextRequest

    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('El archivo excede el límite de 2MB')
  })

  it('should parse document and find contact in clients', async () => {
    const mockExtracted = {
      posNumber: '00002',
      number: '00000123',
      date: '2026-08-06',
      currency: '$',
      subtotal: 100,
      vatAmount: 21,
      totalAmount: 121,
      thirdPartyCuit: '30-22222222-9',
      supplierName: 'Test Client',
      voucherType: 'Factura',
      voucherLetter: 'A'
    }

    const mockClient = { id: 'client-uuid-123' }

    ;(parseInvoiceImage as jest.Mock).mockResolvedValue(mockExtracted)
    
    const findClientMock = jest.fn().mockResolvedValue(mockClient)
    const findSupplierMock = jest.fn().mockResolvedValue(null)

    ClientRepository.prototype.findByCuitAndCompany = findClientMock
    SupplierRepository.prototype.findByCuitAndCompany = findSupplierMock

    const request = {
      headers: {
        get: (name: string) => companyId
      },
      formData: async () => ({
        get: (name: string) => mockFile
      })
    } as unknown as NextRequest

    const response = await POST(request)
    expect(response.status).toBe(200)
    const body = await response.json()

    expect(body.posNumber).toBe('00002')
    expect(body.thirdPartyCuit).toBe('30-22222222-9')
    expect(body.contactId).toBe('client-uuid-123')
    expect(body.thirdPartyId).toBe('client-uuid-123')
    expect(findClientMock).toHaveBeenCalledWith(companyId, '30-22222222-9')
  })

  it('should parse document and find contact in suppliers if not in clients', async () => {
    const mockExtracted = {
      posNumber: '00002',
      number: '00000123',
      date: '2026-08-06',
      currency: '$',
      subtotal: 100,
      vatAmount: 21,
      totalAmount: 121,
      thirdPartyCuit: '30-33333333-9',
      supplierName: 'Test Supplier',
      voucherType: 'Factura',
      voucherLetter: 'A'
    }

    const mockSupplier = { id: 'supplier-uuid-123' }

    ;(parseInvoiceImage as jest.Mock).mockResolvedValue(mockExtracted)
    
    const findClientMock = jest.fn().mockResolvedValue(null)
    const findSupplierMock = jest.fn().mockResolvedValue(mockSupplier)

    ClientRepository.prototype.findByCuitAndCompany = findClientMock
    SupplierRepository.prototype.findByCuitAndCompany = findSupplierMock

    const request = {
      headers: {
        get: (name: string) => companyId
      },
      formData: async () => ({
        get: (name: string) => mockFile
      })
    } as unknown as NextRequest

    const response = await POST(request)
    expect(response.status).toBe(200)
    const body = await response.json()

    expect(body.contactId).toBe('supplier-uuid-123')
    expect(body.thirdPartyId).toBe('supplier-uuid-123')
  })

  it('should nullify contact fields when CUIT matches the active company CUIT', async () => {
    const mockExtracted = {
      posNumber: '00002',
      number: '00000123',
      date: '2026-08-06',
      currency: '$',
      subtotal: 100,
      vatAmount: 21,
      totalAmount: 121,
      thirdPartyCuit: '30-11111111-9', // Matches TEEM's CUIT
      supplierName: 'TEEM',
      voucherType: 'Factura',
      voucherLetter: 'A'
    }

    ;(parseInvoiceImage as jest.Mock).mockResolvedValue(mockExtracted)
    
    const findClientMock = jest.fn().mockResolvedValue(null)
    const findSupplierMock = jest.fn().mockResolvedValue(null)

    ClientRepository.prototype.findByCuitAndCompany = findClientMock
    SupplierRepository.prototype.findByCuitAndCompany = findSupplierMock

    const request = {
      headers: {
        get: (name: string) => companyId
      },
      formData: async () => ({
        get: (name: string) => mockFile
      })
    } as unknown as NextRequest

    const response = await POST(request)
    expect(response.status).toBe(200)
    const body = await response.json()

    expect(body.thirdPartyCuit).toBeNull()
    expect(body.supplierName).toBeNull()
    expect(body.contactId).toBeNull()
    expect(body.thirdPartyId).toBeNull()
  })

  it('should resolve vatDetails and retentions using database catalog lookups', async () => {
    const mockExtracted = {
      posNumber: '00002',
      number: '00000123',
      date: '2026-08-06',
      currency: '$',
      subtotal: 100,
      vatAmount: 21,
      totalAmount: 121,
      thirdPartyCuit: '30-22222222-9',
      supplierName: 'Supplier ABC',
      voucherType: 'Factura',
      voucherLetter: 'A',
      vatDetails: [
        { vatRateName: '21%', subtotal: 100, vatAmount: 21 },
        { vatRateName: 'NonExistentVAT', subtotal: 50, vatAmount: 0 }
      ],
      retentions: [
        { conceptName: 'Retención de Ganancias', amount: 50 },
        { conceptName: 'Percepción de Ingresos Brutos', amount: 15, province: 'CABA' },
        { conceptName: 'ConceptoInexistente', amount: 99, province: 'Buenos Aires' }
      ]
    }

    ;(parseInvoiceImage as jest.Mock).mockResolvedValue(mockExtracted)
    
    const findClientMock = jest.fn().mockResolvedValue(null)
    const findSupplierMock = jest.fn().mockResolvedValue(null)

    ClientRepository.prototype.findByCuitAndCompany = findClientMock
    SupplierRepository.prototype.findByCuitAndCompany = findSupplierMock

    const request = {
      headers: {
        get: (name: string) => companyId
      },
      formData: async () => ({
        get: (name: string) => mockFile
      })
    } as unknown as NextRequest

    const response = await POST(request)
    expect(response.status).toBe(200)
    const body = await response.json()

    expect(body.vatDetails).toEqual([
      { vatRateId: 'vat-21', vatRateName: '21%', subtotal: 100, vatAmount: 21 },
      { vatRateId: null, vatRateName: 'NonExistentVAT', subtotal: 50, vatAmount: 0 }
    ])

    expect(body.retentions).toEqual([
      { retentionConceptId: 'ret-gan', conceptName: 'Retención de Ganancias', amount: 50, province: null },
      { retentionConceptId: 'ret-iibb', conceptName: 'Percepción de Ingresos Brutos', amount: 15, province: 'CABA' },
      { retentionConceptId: null, conceptName: 'ConceptoInexistente', amount: 99, province: 'Buenos Aires' }
    ])
  })
})
