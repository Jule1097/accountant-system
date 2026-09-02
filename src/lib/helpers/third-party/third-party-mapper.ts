import { Client } from "src/models/third-party/Client"
import { Supplier } from "src/models/third-party/Supplier"
import { ThirdParty } from "src/models/third-party/ThirdParty"
import {
  ThirdPartyPersistenceMetadata,
  ThirdPartyPersistenceRecord,
  ThirdPartyView,
} from "src/types/third-party/third-party"

export function toClient(record: ThirdPartyPersistenceRecord): Client {
  return new Client(record)
}

export function toSupplier(record: ThirdPartyPersistenceRecord): Supplier {
  return new Supplier(record)
}

export function toThirdPartyView(model: ThirdParty, metadata: ThirdPartyPersistenceMetadata): ThirdPartyView {
  return {
    id: metadata.id,
    companyId: model.companyId,
    name: model.name,
    cuit: model.cuit,
    role: model.role,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
  }
}
