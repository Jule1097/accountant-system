import { ApiRequestError } from "src/lib/api/api-client";
import { parseUrlState, updateUrlState } from "src/lib/helpers/shared/url-state";
import { VoucherApiResponse } from "src/types/voucher/voucher-api";
import {
  VoucherListQueryState,
  VoucherListResponse,
  VoucherRecordType,
  VoucherScreenType,
  VoucherSortBy,
  VoucherSortOrder,
  VoucherStatus,
} from "src/types/voucher/voucher";

export const voucherPageSizeOptions = [10, 20, 50] as const;
export const voucherSearchDebounceMs = 1500;

const voucherStatusOptions: VoucherStatus[] = ["pending", "partial", "paid"];
const voucherSortByOptions: VoucherSortBy[] = ["date", "status", "voucher"];
const voucherSortOrderOptions: VoucherSortOrder[] = ["asc", "desc"];

export const voucherTableParameters = {
  page: { defaultValue: 1, parse: (value: string | null) => Number(value), normalize: (value: number) => Number.isInteger(value) && value > 0 ? value : 1, serialize: (value: number) => value === 1 ? null : String(value) },
  pageSize: { defaultValue: 10, parse: (value: string | null) => Number(value), normalize: (value: number) => voucherPageSizeOptions.includes(value as typeof voucherPageSizeOptions[number]) ? value : 10, serialize: (value: number) => value === 10 ? null : String(value), allowedValues: voucherPageSizeOptions },
  search: { defaultValue: "", serialize: (value: string) => value || null },
  status: { defaultValue: undefined, parse: (value: string | null) => value ? value as VoucherStatus : undefined, allowedValues: voucherStatusOptions },
  dateFrom: { defaultValue: undefined, parse: (value: string | null) => value ?? undefined },
  dateTo: { defaultValue: undefined, parse: (value: string | null) => value ?? undefined },
  sortBy: { defaultValue: "date", serialize: (value: VoucherSortBy) => value === "date" ? null : value, allowedValues: voucherSortByOptions },
  sortOrder: { defaultValue: "desc", serialize: (value: VoucherSortOrder) => value === "desc" ? null : value, allowedValues: voucherSortOrderOptions },
  voucherId: { defaultValue: null, parse: (value: string | null) => value },
} as const;

export function resolveVoucherRecordType(type: VoucherScreenType): VoucherRecordType {
  if (type === "sales") {
    return "sale";
  }

  return "purchase";
}

export function readVoucherListQuery(searchParams: URLSearchParams): VoucherListQueryState {
  return parseUrlState(searchParams, voucherTableParameters) as VoucherListQueryState;
}

export function buildVoucherSearchParams(query: VoucherListQueryState): URLSearchParams {
  return updateUrlState(new URLSearchParams(), voucherTableParameters, query);
}

export function buildVoucherQuery(nextQuery: VoucherListQueryState): string {
  const normalizedParams = buildVoucherSearchParams(nextQuery);
  const queryString = normalizedParams.toString();

  if (!queryString) {
    return "";
  }

  return `?${queryString}`;
}

export function buildVoucherCollectionPath(type: VoucherRecordType, query: VoucherListQueryState): string {
  const params = buildVoucherSearchParams(query);
  params.delete("voucherId");
  params.set("type", type);
  return `/api/vouchers?${params.toString()}`;
}

export function buildVoucherSummaryPath(type: VoucherRecordType, query: VoucherListQueryState): string {
  const params = buildVoucherSearchParams(query);
  params.delete("page");
  params.delete("pageSize");
  params.delete("voucherId");
  params.set("type", type);
  return `/api/vouchers/summary?${params.toString()}`;
}

export function buildVoucherDetailPath(id: string): string {
  return `/api/vouchers/${id}`;
}

export function buildVoucherMutationQuery(
  query: VoucherListQueryState,
  values: Partial<VoucherListQueryState>
): VoucherListQueryState {
  return {
    ...query,
    ...values,
  };
}

export function resetVoucherPage(query: VoucherListQueryState): VoucherListQueryState {
  return buildVoucherMutationQuery(query, { page: 1 });
}

export function buildEffectiveVoucherQuery(
  query: VoucherListQueryState,
  search: string | undefined
): VoucherListQueryState {
  const hasCompleteDateRange = Boolean(query.dateFrom && query.dateTo);

  return {
    ...query,
    search,
    dateFrom: hasCompleteDateRange ? query.dateFrom : undefined,
    dateTo: hasCompleteDateRange ? query.dateTo : undefined,
  };
}

export function getVoucherStatusLabel(status: string): string {
  if (status === "paid") {
    return "Pagado";
  }

  if (status === "partial") {
    return "Parcial";
  }

  if (status === "pending") {
    return "Pendiente";
  }

  return status;
}

export function getVoucherStatusBadgeClassName(status: string): string {
  if (status === "paid") {
    return "bg-[#22C55E18] text-[#22C55E]";
  }

  if (status === "partial") {
    return "bg-[#EAB30818] text-[#EAB308]";
  }

  return "bg-[#FF5C0018] text-[#FF5C00]";
}

export function getVoucherFormattedExchangeRate(value: number): string {
  return value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export function getVoucherTaxTotal(voucher: VoucherApiResponse, type: VoucherScreenType): number {
  const list = type === "sales" ? voucher.retentions : voucher.perceptions;
  return list.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

export function getVoucherSortValue(
  sortBy: VoucherListQueryState["sortBy"],
  sortOrder: VoucherListQueryState["sortOrder"]
): string {
  return `${sortBy || "date"}:${sortOrder || "desc"}`;
}

export function buildVoucherPageLabel(data: VoucherListResponse): string {
  const from = (data.page - 1) * data.pageSize + (data.total === 0 ? 0 : 1);
  const to = Math.min(data.page * data.pageSize, data.total);
  return `Mostrando ${from}-${to} de ${data.total} (Pág. ${data.page} de ${data.totalPages})`;
}

export function moveVoucherPageBack(query: VoucherListQueryState): VoucherListQueryState {
  if (query.page <= 1) {
    return query;
  }

  return buildVoucherMutationQuery(query, { page: query.page - 1 });
}

export function resolveVoucherManagementError(error: unknown, fallbackMessage: string): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  return fallbackMessage;
}
