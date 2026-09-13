import { supplierTaxIdentificationModes, thirdPartyRoles } from "src/lib/constants/third-party"

export type ThirdPartyRole = typeof thirdPartyRoles[keyof typeof thirdPartyRoles]
export type SupplierTaxIdentificationMode = typeof supplierTaxIdentificationModes[keyof typeof supplierTaxIdentificationModes]

export interface ThirdPartyData {
  id?: string
  companyId: string
  name: string
  cuit: string | null
  taxIdentificationMode?: SupplierTaxIdentificationMode
}

export interface ThirdPartyPersistenceMetadata {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface ThirdPartyPersistenceRecord {
  id: string
  companyId: string
  name: string
  cuit: string | null
  taxIdentificationMode?: SupplierTaxIdentificationMode
  createdAt: Date
  updatedAt: Date
}

export interface ThirdPartyView {
  id: string
  companyId: string
  name: string
  cuit: string | null
  taxIdentificationMode?: SupplierTaxIdentificationMode
  createdAt: Date
  updatedAt: Date
  role: ThirdPartyRole
}
