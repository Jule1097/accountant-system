"use client";

import { ReactNode } from "react";
import { CompanyProvider } from "src/contexts/company-context";

export function DashboardProviders({ children }: { children: ReactNode }) {
  return <CompanyProvider>{children}</CompanyProvider>;
}
