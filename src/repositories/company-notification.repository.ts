import prisma from "src/lib/prisma";
import { CompanyNotificationRecord } from "src/types/notification";

function mapCompanyNotification(record: {
  id: string;
  companyId: string;
  category: string;
  title: string;
  message: string;
  targetPath: string;
  sourceId: string;
  createdAt: Date;
}): CompanyNotificationRecord {
  return {
    id: record.id,
    companyId: record.companyId,
    category: record.category as CompanyNotificationRecord["category"],
    title: record.title,
    message: record.message,
    targetPath: record.targetPath,
    sourceId: record.sourceId,
    createdAt: record.createdAt.toISOString(),
  };
}

export class CompanyNotificationRepository {
  async createIfMissing(
    companyId: string,
    category: CompanyNotificationRecord["category"],
    sourceId: string,
    title: string,
    message: string,
    targetPath: string
  ): Promise<void> {
    await prisma.companyNotification.upsert({
      where: {
        companyNotificationSourceUnique: {
          companyId,
          category,
          sourceId,
        },
      },
      create: {
        companyId,
        category,
        sourceId,
        title,
        message,
        targetPath,
      },
      update: {},
    });
  }

  async listByCompany(companyId: string): Promise<CompanyNotificationRecord[]> {
    const records = await prisma.companyNotification.findMany({
      where: {
        companyId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return records.map(mapCompanyNotification);
  }

  async deleteById(companyId: string, notificationId: string): Promise<void> {
    await prisma.companyNotification.deleteMany({
      where: {
        companyId,
        id: notificationId,
      },
    });
  }
}
