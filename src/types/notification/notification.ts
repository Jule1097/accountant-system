export type CompanyNotificationCategory = "parser-batch-completed";

export interface CompanyNotificationRecord {
  id: string;
  companyId: string;
  category: CompanyNotificationCategory;
  title: string;
  message: string;
  targetPath: string;
  sourceId: string;
  createdAt: string;
}
