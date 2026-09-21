import prisma from "src/lib/database/prisma"
import { rehydrateVoucher, voucherInclude } from "src/repositories/voucher/voucher-repository-shared"
import type { Voucher } from "src/models/voucher/Voucher"
import type { Prisma } from "src/generated/prisma/client"

export class MetricRepository {
  async findForPeriod(companyId: string, startDate: Date, endDate: Date): Promise<Voucher[]> {
    const rawVouchers = await prisma.voucher.findMany({
      where: {
        companyId,
        OR: [
          { accountingPeriod: { gte: startDate, lt: endDate } },
          { paymentDate: { gte: startDate, lt: endDate } },
        ],
      },
      include: voucherInclude,
      orderBy: [{ accountingPeriod: "desc" }, { id: "desc" }],
    })

    return rawVouchers.map((voucher) => rehydrateVoucher(voucher as Prisma.VoucherGetPayload<{ include: typeof voucherInclude }>))
  }
}
