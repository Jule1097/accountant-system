import { Client, Prisma } from "src/generated/prisma/client"
import { ThirdPartyRepository } from "src/types/third-party/third-party-repository"

export type ClientRepositoryContract = ThirdPartyRepository<
  Client,
  Prisma.ClientUncheckedCreateInput,
  Prisma.ClientUncheckedUpdateInput
>
