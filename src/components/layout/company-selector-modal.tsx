"use client";

import { useCompany } from "src/contexts/company-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "src/components/ui/dialog";
import { Button } from "src/components/ui/button";
import { Building2 } from "lucide-react";

export function CompanySelectorModal() {
  const { companies, activeCompanyId, setActiveCompanyId, loading } = useCompany();

  const isOpen = !loading && companies.length > 1 && !activeCompanyId;

  if (loading) {
    return null;
  }

  if (companies.length === 0) {
    return (
      <Dialog open={true}>
        <DialogContent 
          className="sm:max-w-[400px]"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle>Sin Empresa Asignada</DialogTitle>
            <DialogDescription>
              No tienes ninguna empresa asignada a tu cuenta. Por favor contacta al administrador.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent 
        className="sm:max-w-[400px]"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>Seleccionar Empresa</DialogTitle>
          <DialogDescription>
            Por favor selecciona la empresa con la que deseas trabajar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {companies.map((company) => (
            <Button
              key={company.id}
              variant="outline"
              className="w-full justify-start gap-3 h-12 text-sm font-medium hover:bg-accent"
              onClick={() => setActiveCompanyId(company.id)}
            >
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-col items-start">
                <span>{company.name}</span>
                <span className="text-2xs text-muted-foreground">CUIT: {company.cuit}</span>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
