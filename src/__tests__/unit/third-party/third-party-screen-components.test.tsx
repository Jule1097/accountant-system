/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { ClientSupplierManagementHeader } from "src/components/third-party/third-party-management-header";

describe("ClientSupplierManagementHeader", () => {
  it("renders the active entity tab and forwards navigation callbacks", () => {
    const onClientsClick = jest.fn();
    const onSuppliersClick = jest.fn();
    render(
      <ClientSupplierManagementHeader
        type="suppliers"
        title="Clientes y Proveedores"
        description="Gestioná tus clientes y proveedores"
        onClientsClick={onClientsClick}
        onSuppliersClick={onSuppliersClick}
      />
    );

    expect(screen.getByRole("button", { name: "Proveedores" })).toHaveAttribute("data-active", "true");
    fireEvent.click(screen.getByRole("button", { name: "Clientes" }));

    expect(onClientsClick).toHaveBeenCalledTimes(1);
    expect(onSuppliersClick).not.toHaveBeenCalled();
  });
});
