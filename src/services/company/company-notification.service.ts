import { CompanyNotificationRepository } from "src/repositories/company/company-notification.repository";
import { ParserBatchRepository } from "src/repositories/parser/parser-batch.repository";
import { resolveConciliationTab } from "src/lib/helpers/conciliation/conciliations";
import { CompanyNotificationsResponse } from "src/types/notification/notification";
import { ParserBatchRecord } from "src/types/parser/parser-batch";

function buildBatchTargetPath(batch: ParserBatchRecord): string {
  return `/conciliations?batchId=${batch.id}&tab=${resolveConciliationTab(batch.voucherType)}&page=1`;
}

function isBatchCompletionStatus(status: ParserBatchRecord["status"]): boolean {
  return status === "completed" || status === "partial";
}

export class CompanyNotificationService {
  private readonly repository: CompanyNotificationRepository;
  private readonly parserBatchRepository: ParserBatchRepository;

  constructor() {
    this.repository = new CompanyNotificationRepository();
    this.parserBatchRepository = new ParserBatchRepository();
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

  async listByCompany(companyId: string): Promise<CompanyNotificationsResponse> {
    const notifications = await this.repository.listByCompany(companyId);
    const hasActiveParserBatch = await this.parserBatchRepository.hasActiveBatch(companyId);

    return {
      notifications,
      hasActiveParserBatch,
    };
  }

  async deleteById(companyId: string, notificationId: string): Promise<void> {
    await this.repository.deleteById(companyId, notificationId);
  }
}
