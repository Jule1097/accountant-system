"use client";

import type { ChangeEvent } from "react";
import { Search } from "lucide-react";
import { Input } from "src/components/ui/input";

interface DataTableSearchFilterProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export function DataTableSearchFilter({ id, label, value, placeholder = "Buscar...", onChange }: DataTableSearchFilterProps) {
  return (
    <div className="min-w-0 flex-1">
      <label className="mb-2 block text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          className="h-9 border-input bg-card pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-[#FF5C00]"
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}
