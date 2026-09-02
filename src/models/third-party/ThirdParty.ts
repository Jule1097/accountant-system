import { isValidCuit, normalizeCuit, compareCuit } from "src/lib/domain/cuit"
import { thirdPartyDomainErrors } from "src/lib/constants/third-party"
import { normalizeThirdPartyName } from "src/lib/helpers/third-party/third-party"
import { ThirdPartyData, ThirdPartyRole } from "src/types/third-party/third-party"

export abstract class ThirdParty {
  readonly id?: string
  readonly companyId: string
  name: string
  cuit: string

  protected constructor(data: ThirdPartyData) {
    this.id = data.id
    this.companyId = data.companyId
    this.name = this.normalizeName(data.name)
    this.cuit = this.normalizeAndValidateCuit(data.cuit)
  }

  abstract readonly role: ThirdPartyRole

  get normalizedName(): string {
    return normalizeThirdPartyName(this.name)
  }

  matchesName(value: string): boolean {
    return this.normalizedName === normalizeThirdPartyName(value)
  }

  matchesCuit(value: string): boolean {
    return compareCuit(this.cuit, value)
  }

  belongsToCompany(companyId: string): boolean {
    return this.companyId === companyId
  }

  rename(value: string): void {
    this.name = this.normalizeName(value)
  }

  changeCuit(value: string): void {
    this.cuit = this.normalizeAndValidateCuit(value)
  }

  private normalizeName(value: string): string {
    const normalizedName = value.trim()

    if (!normalizedName) {
      throw new Error(thirdPartyDomainErrors.emptyName)
    }

    return normalizedName
  }

  private normalizeAndValidateCuit(value: string): string {
    if (!isValidCuit(value)) {
      throw new Error(thirdPartyDomainErrors.invalidCuit)
    }

    return normalizeCuit(value)
  }
}
