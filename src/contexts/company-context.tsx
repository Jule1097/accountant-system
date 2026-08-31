"use client";

import { createContext, useContext, useEffect, useMemo, ReactNode, useSyncExternalStore } from "react";
import useSWR from "swr";
import { apiRequest } from "src/lib/api/api-client";
import { useAuth } from "src/hooks/auth/use-auth";
import { CompanyType, CompanyContextType } from "src/types/company/company";

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);
const activeCompanyStorageEvent = "active-company-id-change";
const activeCompanyStorageKey = "active_company_id";

async function fetchCompanies(): Promise<CompanyType[]> {
  const response = await apiRequest("/api/companies");
  return response.json() as Promise<CompanyType[]>;
}

function resolveActiveCompanyId(companies: CompanyType[], savedCompanyId: string | null): string | null {
  if (savedCompanyId && companies.some((company) => company.id === savedCompanyId)) {
    return savedCompanyId;
  }

  if (companies.length === 1) {
    return companies[0].id;
  }

  return null;
}

function readStoredActiveCompanyId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(activeCompanyStorageKey);
}

function writeStoredActiveCompanyId(value: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (value) {
    window.localStorage.setItem(activeCompanyStorageKey, value);
  } else {
    window.localStorage.removeItem(activeCompanyStorageKey);
  }

  window.dispatchEvent(new Event(activeCompanyStorageEvent));
}

function subscribeToActiveCompany(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = (): void => {
    callback();
  };

  window.addEventListener(activeCompanyStorageEvent, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(activeCompanyStorageEvent, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const companiesKey = userId ? ["companies", userId] : null;
  const { data: companiesData, isLoading: isCompaniesLoading, mutate } = useSWR(companiesKey, fetchCompanies, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  });
  const companies = useMemo(() => companiesData || [], [companiesData]);
  const storedActiveCompanyId = useSyncExternalStore(
    subscribeToActiveCompany,
    readStoredActiveCompanyId,
    () => null
  );
  const activeCompanyId = useMemo(() => {
    if (!userId) {
      return null;
    }

    if (isCompaniesLoading && !companiesData) {
      return storedActiveCompanyId;
    }

    return resolveActiveCompanyId(companies, storedActiveCompanyId);
  }, [companies, companiesData, isCompaniesLoading, storedActiveCompanyId, userId]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!userId) {
      writeStoredActiveCompanyId(null);
      return;
    }

    if (isCompaniesLoading && !companiesData) {
      return;
    }

    writeStoredActiveCompanyId(resolveActiveCompanyId(companies, storedActiveCompanyId));
  }, [authLoading, companies, companiesData, isCompaniesLoading, storedActiveCompanyId, userId]);

  const setActiveCompanyId = (id: string): void => {
    writeStoredActiveCompanyId(id);
  };

  const activeCompany = useMemo(
    () => companies.find((company) => company.id === activeCompanyId) || null,
    [activeCompanyId, companies]
  );

  const refreshCompanies = async (): Promise<void> => {
    if (!userId) {
      return;
    }

    await mutate();
  };

  const isLoading = authLoading || (Boolean(userId) && isCompaniesLoading && !companiesData);

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompany,
        activeCompanyId,
        setActiveCompanyId,
        loading: isLoading,
        refreshCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}



export function useCompany(): CompanyContextType {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}

