import { ApiRequestError } from "src/lib/api-client";
import { readOptionalStringParam, readPositiveIntegerParam } from "src/lib/helpers/query-state";
import { ConciliationsPageData, ConciliationsQueryState } from "src/types/conciliations";

export function readConciliationsQuery(searchParams: URLSearchParams): ConciliationsQueryState {
  return {
    batchId: readOptionalStringParam(searchParams, "batchId"),
    tab: searchParams.get("tab") === "purchases" ? "purchases" : "sales",
    page: readPositiveIntegerParam(searchParams, "page", 1),
  };
}

export function buildConciliationsQueryString(query: ConciliationsQueryState): string {
  const params = new URLSearchParams();

  if (query.batchId) {
    params.set("batchId", query.batchId);
  }

  params.set("tab", query.tab);
  params.set("page", query.page.toString());
  return params.toString();
}

export function buildConciliationsPath(query: ConciliationsQueryState): string {
  return `/api/conciliations?${buildConciliationsQueryString(query)}`;
}

export function resolveActionErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  return fallbackMessage;
}

export function resolveConciliationsRefreshInterval(data: ConciliationsPageData | undefined): number {
  if (!data?.processingCount) {
    return 0;
  }

  return 10000;
}

export function resolveSelectedVisibleItemIds(
  removableItemIds: string[],
  selectedItemIds: string[]
): string[] {
  const removableIdsSet = new Set(removableItemIds);
  return selectedItemIds.filter((itemId) => removableIdsSet.has(itemId));
}

export function areAllVisibleDiscardableSelected(
  removableItemIds: string[],
  selectedItemIds: string[]
): boolean {
  return removableItemIds.length > 0
    && removableItemIds.every((itemId) => selectedItemIds.includes(itemId));
}

export function mergeSelectedItemIds(selectedItemIds: string[], itemIds: string[]): string[] {
  return [...new Set([...selectedItemIds, ...itemIds])];
}

export function removeSelectedItemIds(selectedItemIds: string[], itemIds: string[]): string[] {
  const removedIdsSet = new Set(itemIds);
  return selectedItemIds.filter((itemId) => !removedIdsSet.has(itemId));
}
