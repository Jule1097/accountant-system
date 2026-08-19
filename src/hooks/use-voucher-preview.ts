"use client";

import { useEffect, useMemo } from "react";

export function useVoucherPreview(file: File | null): string | null {
  const sourceUrl = useMemo(() => {
    if (!file) {
      return null;
    }

    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    if (!sourceUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  return sourceUrl;
}
