export type ConciliationTab = "sales" | "purchases";

export interface PendingVoucher {
  uuid: string;
  id: string;
  type: ConciliationTab;
  date: string;
  thirdParty: string;
  amount: number;
  currency: string;
  status: "Listo" | "Error" | "Duplicado";
  message: string;
}

export interface ConciliationsQueryState {
  batchId?: string;
  tab: ConciliationTab;
  page: number;
}

export interface ConciliationsPageData {
  items: PendingVoucher[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  startIndex: number;
}
