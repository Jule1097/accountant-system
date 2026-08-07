import { CompanyRepository } from 'src/repositories/company.repository'

export class CompanyService {
  private repository: CompanyRepository

  constructor() {
    this.repository = new CompanyRepository()
  }

  async getCompaniesByUser(userId: string) {
    return this.repository.findByUser(userId)
  }
}
