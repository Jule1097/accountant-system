import { isValidCuit, normalizeCuit, compareCuit } from "src/lib/domain/cuit"
import { thirdPartyDomainErrors } from "src/lib/constants/third-party"
import { normalizeThirdPartyName } from "src/lib/helpers/third-party/third-party"
import { SupplierTaxIdentificationMode, ThirdPartyData, ThirdPartyRole } from "src/types/third-party/third-party"
import { supplierTaxIdentificationModes } from "src/lib/constants/third-party"

export abstract class ThirdParty {
  readonly id?: string
  readonly companyId: string
  name: string
  cuit: string | null
  readonly taxIdentificationMode: SupplierTaxIdentificationMode

  protected constructor(data: ThirdPartyData) {
    this.id = data.id
    this.companyId = data.companyId
    this.name = this.normalizeName(data.name)
    this.taxIdentificationMode = data.taxIdentificationMode || supplierTaxIdentificationModes.withCuit
    this.cuit = this.normalizeAndValidateCuit(data.cuit, this.taxIdentificationMode)
  }

  abstract readonly role: ThirdPartyRole

  get normalizedName(): string {
    return normalizeThirdPartyName(this.name)
  }

  matchesName(value: string): boolean {
    return this.normalizedName === normalizeThirdPartyName(value)
  }

  matchesCuit(value: string): boolean {
    return this.cuit ? compareCuit(this.cuit, value) : false
  }

  belongsToCompany(companyId: string): boolean {
    return this.companyId === companyId
  }

  rename(value: string): void {
    this.name = this.normalizeName(value)
  }

  changeCuit(value: string | null): void {
    this.cuit = this.normalizeAndValidateCuit(value, this.taxIdentificationMode)
  }

  private normalizeName(value: string): string {
    const normalizedName = value.trim()

    if (!normalizedName) {
      throw new Error(thirdPartyDomainErrors.emptyName)
    }

    return normalizedName
  }

  private normalizeAndValidateCuit(value: string | null, mode: SupplierTaxIdentificationMode): string | null {
    if (mode === supplierTaxIdentificationModes.withoutCuit) {
      return null
    }

    if (!value || !isValidCuit(value)) {
      throw new Error(thirdPartyDomainErrors.invalidCuit)
    }

    return normalizeCuit(value)
  }
}
