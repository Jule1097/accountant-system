"use client";

import { ReactNode } from "react";
import { SWRConfig } from "swr";

export function SwrProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        dedupingInterval: 300,
      }}
    >
      {children}
    </SWRConfig>
  );
}
