"use client";

import type { ChangeEvent } from "react";
import { useEffect, useRef } from "react";
import { Input } from "src/components/ui/input";
import { defaultResourceSearchDebounceMs } from "src/lib/constants/resource";

interface DataTableDateRangeFilterProps {
  id: string;
  from?: string;
  to?: string;
  fromLabel?: string;
  toLabel?: string;
  debounceMs?: number;
  onChange: (from: string, to: string) => void;
}

export function DataTableDateRangeFilter({
  id,
  from = "",
  to = "",
  fromLabel = "Desde",
  toLabel = "Hasta",
  debounceMs = defaultResourceSearchDebounceMs,
  onChange,
}: DataTableDateRangeFilterProps) {
  const dateDraftRef = useRef({ from, to });
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    dateDraftRef.current = { from, to };
  }, [from, to]);

  useEffect(() => () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
  }, []);

  const updateDateRange = (nextFrom: string, nextTo: string) => {
    dateDraftRef.current = { from: nextFrom, to: nextTo };
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      if (!nextFrom && !nextTo) {
        onChange("", "");
        return;
      }
      if (!nextFrom || !nextTo) return;
      onChange(nextFrom, nextTo);
    }, debounceMs);
  };

  return (
    <div key={`${id}-${from}-${to}`} className="contents">
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground" htmlFor={`${id}-from`}>
          {fromLabel}
        </label>
        <Input
          id={`${id}-from`}
          type="date"
          defaultValue={from}
          className="h-9 border-input bg-card text-sm text-foreground focus-visible:ring-[#FF5C00]"
          onChange={(event: ChangeEvent<HTMLInputElement>) => updateDateRange(event.target.value, dateDraftRef.current.to)}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground" htmlFor={`${id}-to`}>
          {toLabel}
        </label>
        <Input
          id={`${id}-to`}
          type="date"
          defaultValue={to}
          className="h-9 border-input bg-card text-sm text-foreground focus-visible:ring-[#FF5C00]"
          onChange={(event: ChangeEvent<HTMLInputElement>) => updateDateRange(dateDraftRef.current.from, event.target.value)}
        />
      </div>
    </div>
  );
}
