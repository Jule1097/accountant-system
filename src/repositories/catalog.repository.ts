import prisma from 'src/lib/prisma'

export class CatalogRepository {
  async getVoucherTypes() {
    return prisma.voucherType.findMany()
  }

  async getVoucherLetters() {
    return prisma.voucherLetter.findMany()
  }

  async getRetentionConcepts() {
    return prisma.retentionConcept.findMany()
  }

  async getPerceptionConcepts() {
    return prisma.perceptionConcept.findMany()
  }

  async getTaxJurisdictions() {
    return prisma.taxJurisdiction.findMany({
      orderBy: { name: 'asc' },
    })
  }

  async getVatRates() {
    return prisma.vatRate.findMany()
  }
}
