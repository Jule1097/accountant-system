"use client";

import { ConciliationCard } from "src/components/conciliations/conciliation-card";
import { ConciliationSectionData } from "src/types/conciliations";

interface ConciliationSectionProps {
  section: ConciliationSectionData;
  loadingVouchers: Record<string, "reviewing" | "retrying" | "persisting" | "deleting" | undefined>;
  getSelectedCount: (itemIds: string[]) => number;
  areAllSectionItemsSelected: (itemIds: string[]) => boolean;
  isVoucherSelected: (itemId: string) => boolean;
  onToggleVisibleSelection: (itemIds: string[], checked: boolean) => void;
  onToggleItemSelection: (
    voucher: ConciliationSectionData["items"][number],
    checked: boolean
  ) => void;
  onReview: (voucher: ConciliationSectionData["items"][number]) => void;
  onRegenerate: (voucher: ConciliationSectionData["items"][number]) => void;
  onPersist: (voucher: ConciliationSectionData["items"][number]) => void;
  onDelete: (voucher: ConciliationSectionData["items"][number]) => void;
  onDeleteSelected: (itemIds: string[]) => void;
}

function getDiscardableItemIds(section: ConciliationSectionData): string[] {
  return section.items.filter((item) => item.canDiscard).map((item) => item.id);
}

export function ConciliationSection({
  section,
  loadingVouchers,
  getSelectedCount,
  areAllSectionItemsSelected,
  isVoucherSelected,
  onToggleVisibleSelection,
  onToggleItemSelection,
  onReview,
  onRegenerate,
  onPersist,
  onDelete,
  onDeleteSelected,
}: ConciliationSectionProps) {
  const discardableItemIds = getDiscardableItemIds(section);
  const selectedCount = getSelectedCount(discardableItemIds);

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {section.totalCount}
            </span>
          </div>
          {section.hasMore && (
            <p className="mt-1 text-xs text-muted-foreground">
              Se muestran {section.items.length} de {section.totalCount}.
            </p>
          )}
        </div>

        {discardableItemIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-2 text-xs text-foreground">
              <input
                type="checkbox"
                checked={areAllSectionItemsSelected(discardableItemIds)}
                onChange={(event) => onToggleVisibleSelection(discardableItemIds, event.target.checked)}
                className="h-4 w-4 rounded border-input accent-[#FF5C00]"
                aria-label={`Seleccionar facturas de ${section.title}`}
              />
              Seleccionar sección
            </label>

            {selectedCount > 0 && (
              <button
                type="button"
                onClick={() => onDeleteSelected(discardableItemIds.filter((itemId) => isVoucherSelected(itemId)))}
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15"
              >
                Eliminar seleccionadas ({selectedCount})
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {section.items.map((voucher) => (
          <ConciliationCard
            key={voucher.id}
            voucher={voucher}
            activeAction={loadingVouchers[voucher.id]}
            isSelected={isVoucherSelected(voucher.id)}
            onSelectionChange={onToggleItemSelection}
            onReview={onReview}
            onRegenerate={onRegenerate}
            onPersist={onPersist}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
