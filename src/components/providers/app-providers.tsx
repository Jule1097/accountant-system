"use client";

import { ReactNode } from "react";
import { SwrProvider } from "src/components/providers/swr-provider";
import { Toaster } from "src/components/ui/toast";
import { TooltipProvider } from "src/components/ui/tooltip";
import { AuthProvider } from "src/contexts/auth-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SwrProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster>{children}</Toaster>
        </TooltipProvider>
      </AuthProvider>
    </SwrProvider>
  );
}
