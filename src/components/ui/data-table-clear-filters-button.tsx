"use client";

import { X } from "lucide-react";
import { Button } from "src/components/ui/button";

interface DataTableClearFiltersButtonProps {
  isVisible: boolean;
  onClear: () => void;
  label?: string;
}

export function DataTableClearFiltersButton({
  isVisible,
  onClear,
  label = "Borrar filtros",
}: DataTableClearFiltersButtonProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <Button
      variant="outline"
      className="h-9 border-input bg-card px-3 text-foreground hover:bg-muted hover:text-foreground"
      onClick={onClear}
    >
      {label}
      <X className="ml-2 h-4 w-4" />
    </Button>
  );
}
