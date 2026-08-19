import { ApiRequestError } from "src/lib/api-client";
import {
  createNormalizedSearchParams,
  readEnumParam,
  readOptionalDateParam,
  readOptionalEnumParam,
  readOptionalStringParam,
  readPositiveIntegerParam,
} from "src/lib/helpers/query-state";
import { Voucher } from "src/models/Voucher";
import {
  VoucherListQueryState,
  VoucherListResponse,
  VoucherRecordType,
  VoucherScreenType,
  VoucherSortBy,
  VoucherSortOrder,
  VoucherStatus,
} from "src/types/voucher";

export const voucherPageSizeOptions = [10, 20, 50] as const;

const voucherStatusOptions: VoucherStatus[] = ["pending", "partial", "paid"];
const voucherSortByOptions: VoucherSortBy[] = ["date", "status", "voucher"];
const voucherSortOrderOptions: VoucherSortOrder[] = ["asc", "desc"];

export function resolveVoucherRecordType(type: VoucherScreenType): VoucherRecordType {
  if (type === "sales") {
    return "sale";
  }

  return "purchase";
}

export function readVoucherListQuery(searchParams: URLSearchParams): VoucherListQueryState {
  const pageSize = readPositiveIntegerParam(searchParams, "pageSize", 10);
  const normalizedPageSize = voucherPageSizeOptions.includes(pageSize as 10 | 20 | 50) ? pageSize : 10;

  return {
    page: readPositiveIntegerParam(searchParams, "page", 1),
    pageSize: normalizedPageSize,
    search: readOptionalStringParam(searchParams, "search"),
    status: readOptionalEnumParam(searchParams, "status", voucherStatusOptions),
    dateFrom: readOptionalDateParam(searchParams, "dateFrom"),
    dateTo: readOptionalDateParam(searchParams, "dateTo"),
    sortBy: readEnumParam(searchParams, "sortBy", voucherSortByOptions, "date"),
    sortOrder: readEnumParam(searchParams, "sortOrder", voucherSortOrderOptions, "desc"),
    voucherId: readOptionalStringParam(searchParams, "voucherId") ?? null,
  };
}

export function buildVoucherSearchParams(query: VoucherListQueryState): URLSearchParams {
  return createNormalizedSearchParams(
    {
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      status: query.status,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      voucherId: query.voucherId,
    },
    {
      page: 1,
      pageSize: 10,
      sortBy: "date",
      sortOrder: "desc",
    }
  );
}

export function buildVoucherQuery(searchParams: URLSearchParams, nextQuery: VoucherListQueryState): string {
  const mergedParams = new URLSearchParams(searchParams.toString());
  const normalizedParams = buildVoucherSearchParams(nextQuery);

  mergedParams.forEach((_value, key) => {
    mergedParams.delete(key);
  });

  normalizedParams.forEach((value, key) => {
    mergedParams.set(key, value);
  });

  const queryString = mergedParams.toString();

  if (!queryString) {
    return "";
  }

  return `?${queryString}`;
}

export function buildVoucherCollectionPath(type: VoucherRecordType, query: VoucherListQueryState): string {
  const params = buildVoucherSearchParams(query);
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

export function getVoucherFormattedAmount(currency: string, value: number): string {
  const currencyLabel = currency === "USD" ? "USD" : "$";
  return `${currencyLabel} ${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getVoucherFormattedExchangeRate(value: number): string {
  return value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export function getVoucherFormattedDate(value?: Date | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("es-AR", { timeZone: "UTC" });
}

export function getVoucherTaxTotal(voucher: Voucher, type: VoucherScreenType): number {
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
