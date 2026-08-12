"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiRequest } from "src/lib/api-client";
import { useAuth } from "src/hooks/use-auth";
import { CompanyType, CompanyContextType } from "src/types/company";

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [companies, setCompanies] = useState<CompanyType[]>([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (authLoading || !userId) {
      return;
    }

    let isMounted = true;

    apiRequest("/api/companies")
      .then((res) => res.json() as Promise<CompanyType[]>)
      .then((data) => {
        if (!isMounted) return;
        setCompanies(data);
        const savedId = localStorage.getItem("active_company_id");
        if (savedId && data.some((c) => c.id === savedId)) {
          setActiveCompanyIdState(savedId);
        } else if (data.length === 1) {
          localStorage.setItem("active_company_id", data[0].id);
          setActiveCompanyIdState(data[0].id);
        } else {
          localStorage.removeItem("active_company_id");
          setActiveCompanyIdState(null);
        }
      })
      .catch((error) => {
        console.error("Error loading companies:", error);
      });

    return () => {
      isMounted = false;
    };
  }, [authLoading, userId]);


  const setActiveCompanyId = (id: string): void => {
    localStorage.setItem("active_company_id", id);
    setActiveCompanyIdState(id);
  };

  const activeCompany = companies.find((c) => c.id === activeCompanyId) || null;

  const refreshCompanies = async (): Promise<void> => {
    if (!user) return;
    try {
      const response = await apiRequest("/api/companies");
      const data: CompanyType[] = await response.json();
      setCompanies(data);
      const savedId = localStorage.getItem("active_company_id");
      if (savedId && data.some((c) => c.id === savedId)) {
        setActiveCompanyIdState(savedId);
      } else if (data.length === 1) {
        localStorage.setItem("active_company_id", data[0].id);
        setActiveCompanyIdState(data[0].id);
      }
    } catch (error) {
      console.error("Error refreshing companies:", error);
    }
  };

  const isLoading = authLoading || (!!userId && companies.length === 0);

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

