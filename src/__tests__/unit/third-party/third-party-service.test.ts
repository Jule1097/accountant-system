import { Client } from "src/models/third-party/Client"
import { ThirdPartyService } from "src/services/third-party/ThirdParty"
import { ThirdPartyRepository } from "src/types/third-party/third-party-repository"

interface TestRecord {
  id: string
  companyId: string
  name: string
  cuit: string
}

interface TestCreateInput {
  companyId: string
  name: string
  cuit: string
}

interface TestUpdateInput {
  name: string
  cuit: string
}

const messages = {
  duplicateName: "duplicate name",
  duplicateCuit: "duplicate cuit",
  notFound: "not found",
  deleteBlocked: "delete blocked",
}

function createRepository(): jest.Mocked<ThirdPartyRepository<TestRecord, TestCreateInput, TestUpdateInput>> {
  return {
    findById: jest.fn(),
    findByCuitAndCompany: jest.fn(),
    findByNormalizedName: jest.fn(),
    findAll: jest.fn(),
    findPage: jest.fn(),
    hasVouchers: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}

describe("ThirdPartyService", () => {
  it("orchestrates normalized create, update, and delete flows through an injected repository", async () => {
    const repository = createRepository()
    const service = new ThirdPartyService({
      repository,
      createModel: (data) => new Client(data),
      getRecordId: (record) => record.id,
      messages,
    })
    const record = { id: "client-1", companyId: "company-1", name: "Acme", cuit: "20-12345678-3" }
    repository.create.mockResolvedValue(record)
    repository.update.mockResolvedValue(record)
    repository.findById.mockResolvedValue(record)
    repository.delete.mockResolvedValue(record)

    await service.create("company-1", " Acme ", "20123456783")
    await service.update("company-1", "client-1", " Acme Updated ", "20111111119")
    await service.delete("company-1", "client-1")

    expect(repository.create).toHaveBeenCalledWith({
      companyId: "company-1",
      name: "Acme",
      cuit: "20-12345678-3",
    })
    expect(repository.update).toHaveBeenCalledWith("company-1", "client-1", {
      name: "Acme Updated",
      cuit: "20-11111111-9",
    })
    expect(repository.hasVouchers).toHaveBeenCalledWith("company-1", "client-1")
    expect(repository.delete).toHaveBeenCalledWith("company-1", "client-1")
  })
})
