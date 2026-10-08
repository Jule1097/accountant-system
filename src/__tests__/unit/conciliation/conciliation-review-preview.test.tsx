/** @jest-environment jsdom */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConciliationReviewPreview } from "src/components/conciliations/conciliation-review-preview";

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => {
    return ({ sourceUrl }: { sourceUrl: string }) => (
      <div data-testid="conciliation-pdf-preview">{sourceUrl}</div>
    );
  },
}));

jest.mock("src/components/conciliations/conciliation-pdf-preview", () => ({
  ConciliationPdfPreview: ({ sourceUrl }: { sourceUrl: string }) => (
    <div data-testid="conciliation-pdf-preview">{sourceUrl}</div>
  ),
}));

describe("ConciliationReviewPreview", () => {
  it("shows fallback when source file is missing", () => {
    render(
      <ConciliationReviewPreview
        sourceUrl={null}
        mimeType={null}
        fileName={null}
      />
    );

    expect(screen.getByText("No se pudo cargar la vista previa del archivo.")).toBeInTheDocument();
  });

  it("renders image preview for image files", () => {
    const { container } = render(
      <ConciliationReviewPreview
        sourceUrl="/api/conciliations/items/item-1/source"
        mimeType="image/png"
        fileName="factura.png"
      />
    );

    const image = screen.getByRole("img", { name: "factura.png" });

    expect(image).toBeInTheDocument();
    expect(image).toHaveStyle({ width: "auto", height: "auto" });
    expect(container.querySelector(".overflow-y-scroll")).not.toBeNull();
  });

  it("uses the natural image dimensions for the preview area", async () => {
    render(
      <ConciliationReviewPreview
        sourceUrl="/api/conciliations/items/item-1/source"
        mimeType="image/png"
        fileName="factura.png"
      />
    );

    const image = screen.getByRole("img", { name: "factura.png" });

    Object.defineProperty(image, "naturalWidth", { configurable: true, value: 1920 });
    Object.defineProperty(image, "naturalHeight", { configurable: true, value: 1080 });
    act(() => fireEvent.load(image));

    await waitFor(() => {
      expect(image).toHaveAttribute("width", "1920");
      expect(image).toHaveAttribute("height", "1080");
    });
  });

  it("renders pdf preview component for pdf files", () => {
    render(
      <ConciliationReviewPreview
        sourceUrl="/api/conciliations/items/item-2/source"
        mimeType="application/pdf"
        fileName="factura.pdf"
      />
    );

    expect(screen.getByTestId("conciliation-pdf-preview")).toHaveTextContent(
      "/api/conciliations/items/item-2/source"
    );
  });

  it("renders iframe preview for unsupported files", () => {
    const { container } = render(
      <ConciliationReviewPreview
        sourceUrl="/api/conciliations/items/item-3/source"
        mimeType="text/plain"
        fileName="factura.txt"
      />
    );

    const iframe = container.querySelector("iframe");

    expect(iframe).not.toBeNull();
    expect(iframe).toHaveAttribute("src", "/api/conciliations/items/item-3/source");
    expect(iframe).toHaveAttribute("title", "factura.txt");
  });
});
