"use client"

import { thirdPartyEntityTypes } from "src/lib/constants/third-party"
import type { ClientSupplierManagementHeaderProps } from "src/types/third-party/third-party-resource"

export function ClientSupplierManagementHeader({ type, title, description, onClientsClick, onSuppliersClick }: ClientSupplierManagementHeaderProps) {
  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[38px] font-mono font-normal tracking-[-1px] text-foreground leading-none">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex w-full gap-4 border-b border-border/40">
        <button
          type="button"
          data-active={type === thirdPartyEntityTypes.clients}
          className={`relative pb-2 text-sm font-medium transition-colors ${type === thirdPartyEntityTypes.clients
            ? "text-[#FF5C00] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#FF5C00]"
            : "text-muted-foreground hover:text-foreground"
            }`}
          onClick={onClientsClick}
        >
          Clientes
        </button>
        <button
          type="button"
          data-active={type === thirdPartyEntityTypes.suppliers}
          className={`relative pb-2 text-sm font-medium transition-colors ${type === thirdPartyEntityTypes.suppliers
            ? "text-[#FF5C00] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#FF5C00]"
            : "text-muted-foreground hover:text-foreground"
            }`}
          onClick={onSuppliersClick}
        >
          Proveedores
        </button>
      </div>
    </>
  )
}
