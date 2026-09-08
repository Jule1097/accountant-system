import { ApiRequestError } from "src/lib/api/api-client";
import { conciliationQueryDefaults, conciliationQueryParams, conciliationTabs } from "src/lib/constants/conciliation";
import { parseUrlState } from "src/lib/helpers/shared/url-state";
import { ConciliationSectionData, ConciliationSectionSelectionState, ConciliationsPageData, ConciliationsQueryState } from "src/types/conciliation/conciliations";

export const conciliationTableParameters = {
  batchId: { defaultValue: undefined, parse: (value: string | null) => value ?? undefined },
  tab: { defaultValue: conciliationQueryDefaults.tab, allowedValues: conciliationTabs },
  page: { defaultValue: conciliationQueryDefaults.page, parse: (value: string | null) => Number(value), normalize: (value: number) => Number.isInteger(value) && value > 0 ? value : conciliationQueryDefaults.page },
  notificationId: { defaultValue: undefined, parse: (value: string | null) => value ?? undefined },
};

export function readConciliationsQuery(searchParams: URLSearchParams): ConciliationsQueryState {
  return parseUrlState(searchParams, conciliationTableParameters) as ConciliationsQueryState;
}

export function buildConciliationsQueryString(query: ConciliationsQueryState): string {
  const params = new URLSearchParams();

  if (query.batchId) {
    params.set(conciliationQueryParams.batchId, query.batchId);
  }

  params.set(conciliationQueryParams.tab, query.tab);
  params.set(conciliationQueryParams.page, query.page.toString());
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
export function buildConciliationSectionSelectionState(section: ConciliationSectionData, selectedItemIds: string[]): ConciliationSectionSelectionState {
  const discardableItemIds = section.items.filter((item) => item.canDiscard).map((item) => item.id)
  const validatedItemIds = section.items.filter((item) => item.status === "Validada").map((item) => item.id)
  const selectedDiscardableItemIds = resolveSelectedVisibleItemIds(discardableItemIds, selectedItemIds)
  const selectedValidatedItemIds = resolveSelectedVisibleItemIds(validatedItemIds, selectedItemIds)

  return {
    discardableItemIds,
    validatedItemIds,
    selectedDiscardableItemIds,
    selectedValidatedItemIds,
    allDiscardableSelected: areAllVisibleDiscardableSelected(discardableItemIds, selectedItemIds),
  }
}
