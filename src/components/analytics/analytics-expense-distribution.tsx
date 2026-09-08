import type { AnalyticsCurrency } from "src/components/analytics/analytics-header";
import type { ExpenseCategoryData } from "src/types/analytics/analytics";

interface AnalyticsExpenseDistributionProps {
  currency: AnalyticsCurrency;
  categories: ExpenseCategoryData[];
  getCategoryOffset: (index: number) => number;
}

const donutCircumference = 314.16;

export function AnalyticsExpenseDistribution({ currency, categories, getCategoryOffset }: AnalyticsExpenseDistributionProps) {
  return (
    <div className="w-full lg:w-[380px] flex flex-col gap-6 p-5 bg-card rounded-xl border border-border/50 flex-shrink-0">
      <div className="text-sm font-semibold text-foreground">Distribución de Egresos</div>
      <div className="w-full h-[120px] relative flex justify-center items-center">
        {categories.length === 0 ? (
          <span className="text-xs text-muted-foreground">Sin egresos este mes</span>
        ) : (
          <>
            <svg viewBox="0 0 120 120" className="w-[120px] h-[120px] transform -rotate-90">
              {categories.map((category, index) => (
                <circle
                  key={category.category}
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={category.color}
                  strokeWidth="16"
                  strokeDasharray={`${(category.percentage / 100) * donutCircumference} ${donutCircumference}`}
                  strokeDashoffset={getCategoryOffset(index)}
                  className="transition-all duration-500"
                />
              ))}
            </svg>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <div className="text-[12px] font-semibold text-foreground">100% Total</div>
            </div>
          </>
        )}
      </div>
      <div className="w-full flex flex-col gap-3 mt-2 overflow-y-auto max-h-[120px] pr-1">
        {categories.map((category) => (
          <div key={category.category} className="w-full flex flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />
              <div className="text-xs text-muted-foreground truncate max-w-[100px]">{category.category}</div>
            </div>
            <div className="flex flex-row items-center gap-3">
              <div className="text-xs font-mono text-foreground">
                {currency === "USD" ? "USD" : "$"} {category.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-muted-foreground w-6 text-right">{category.percentage}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
