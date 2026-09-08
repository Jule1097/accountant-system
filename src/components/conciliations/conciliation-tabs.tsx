import type { ConciliationTab } from "src/types/conciliation/conciliations";

interface ConciliationTabsProps {
  activeTab: ConciliationTab;
  onTabChange: (tab: ConciliationTab) => void;
}

export function ConciliationTabs({ activeTab, onTabChange }: ConciliationTabsProps) {
  return (
    <div className="flex w-full gap-4 border-b border-border/40">
      <button
        type="button"
        onClick={() => onTabChange("sales")}
        data-active={activeTab === "sales"}
        className={`relative pb-2 text-sm font-medium transition-colors ${activeTab === "sales"
          ? "text-[#FF5C00] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#FF5C00]"
          : "text-muted-foreground hover:text-foreground"
          }`}
      >
        Ventas
      </button>
      <button
        type="button"
        onClick={() => onTabChange("purchases")}
        data-active={activeTab === "purchases"}
        className={`relative pb-2 text-sm font-medium transition-colors ${activeTab === "purchases"
          ? "text-[#FF5C00] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#FF5C00]"
          : "text-muted-foreground hover:text-foreground"
          }`}
      >
        Compras
      </button>
    </div>
  );
}
