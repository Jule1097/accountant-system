/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { ConciliationTabs } from "src/components/conciliations/conciliation-tabs";
import { ConciliationsContentState } from "src/components/conciliations/conciliations-content-state";

describe("Conciliation presentation components", () => {
  it("renders tabs and forwards the selected tab", () => {
    const onTabChange = jest.fn();

    render(<ConciliationTabs activeTab="sales" onTabChange={onTabChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Compras" }));

    expect(onTabChange).toHaveBeenCalledWith("purchases");
    expect(screen.getByRole("button", { name: "Ventas" })).toHaveAttribute("data-active", "true");
  });

  it("renders loading, empty, and content states from prepared state", () => {
    const { rerender } = render(
      <ConciliationsContentState isLoading sections={[]}>
        <div>Contenido</div>
      </ConciliationsContentState>
    );

    expect(screen.queryByText("Contenido")).not.toBeInTheDocument();

    rerender(
      <ConciliationsContentState isLoading={false} sections={[]}>
        <div>Contenido</div>
      </ConciliationsContentState>
    );

    expect(screen.getByText(/Todo al d/)).toBeInTheDocument();

    rerender(
      <ConciliationsContentState
        isLoading={false}
        sections={[{ key: "ready", title: "Listas", items: [], totalCount: 0, hasMore: false }]}
      >
        <div>Contenido</div>
      </ConciliationsContentState>
    );

    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });
});
