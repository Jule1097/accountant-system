import { Prisma, Supplier } from "src/generated/prisma/client"
import { ThirdPartyRepository } from "src/types/third-party/third-party-repository"

export type SupplierRepositoryContract = ThirdPartyRepository<
  Supplier,
  Prisma.SupplierUncheckedCreateInput,
  Prisma.SupplierUncheckedUpdateInput
>
