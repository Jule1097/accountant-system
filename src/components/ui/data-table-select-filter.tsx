"use client";

import type { ChangeEvent } from "react";

export interface DataTableSelectOption {
  value: string;
  label: string;
}

interface DataTableSelectFilterProps {
  id: string;
  label: string;
  value: string;
  options: readonly DataTableSelectOption[];
  onChange: (value: string) => void;
}

export function DataTableSelectFilter({ id, label, value, options, onChange }: DataTableSelectFilterProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF5C00]"
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
