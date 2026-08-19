import { CompanyNotificationRepository } from "src/repositories/company-notification.repository";
import { resolveConciliationTab } from "src/lib/helpers/conciliations";
import { CompanyNotificationRecord } from "src/types/notification";
import { ParserBatchRecord } from "src/types/parser-batch";

function buildBatchTargetPath(batch: ParserBatchRecord): string {
  return `/conciliations?batchId=${batch.id}&tab=${resolveConciliationTab(batch.voucherType)}&page=1`;
}

function isBatchCompletionStatus(status: ParserBatchRecord["status"]): boolean {
  return status === "completed" || status === "partial";
}

export class CompanyNotificationService {
  private readonly repository: CompanyNotificationRepository;

  constructor() {
    this.repository = new CompanyNotificationRepository();
  }

  async notifyBatchCompleted(batch: ParserBatchRecord): Promise<void> {
    if (!isBatchCompletionStatus(batch.status)) {
      return;
    }

    await this.repository.createIfMissing(
      batch.companyId,
      "parser-batch-completed",
      batch.id,
      "Comprobantes procesados",
      "Ya se terminaron de procesar los comprobantes.",
      buildBatchTargetPath(batch)
    );
  }

  async listByCompany(companyId: string): Promise<CompanyNotificationRecord[]> {
    return this.repository.listByCompany(companyId);
  }

  async deleteById(companyId: string, notificationId: string): Promise<void> {
    await this.repository.deleteById(companyId, notificationId);
  }
}
