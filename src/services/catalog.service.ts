import { CatalogRepository } from 'src/repositories/catalog.repository'

export class CatalogService {
  private repository: CatalogRepository

  constructor() {
    this.repository = new CatalogRepository()
  }

  async getFullCatalog() {
    const voucherTypes = await this.repository.getVoucherTypes()
    const voucherLetters = await this.repository.getVoucherLetters()
    const vatRates = await this.repository.getVatRates()
    const retentionConcepts = await this.repository.getRetentionConcepts()
    const perceptionConcepts = await this.repository.getPerceptionConcepts()
    const taxJurisdictions = await this.repository.getTaxJurisdictions()

    return {
      voucherTypes,
      voucherLetters,
      vatRates,
      retentionConcepts,
      perceptionConcepts,
      taxJurisdictions,
    }
  }
}
