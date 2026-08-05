import { CatalogRepository } from "src/repositories/catalog.repository"


export class CatalogService {
  private repository: CatalogRepository

  constructor() {
    this.repository = new CatalogRepository()
  }

  async getFullCatalog() {
    const [voucherTypes, voucherLetters, vatRates, retentionConcepts] = await Promise.all([
      this.repository.getVoucherTypes(),
      this.repository.getVoucherLetters(),
      this.repository.getVatRates(),
      this.repository.getRetentionConcepts(),
    ])
    return {
      voucherTypes,
      voucherLetters,
      vatRates,
      retentionConcepts,
    }
  }
}