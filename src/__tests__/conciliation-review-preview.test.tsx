/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { ConciliationReviewPreview } from "src/components/conciliations/conciliation-review-preview";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

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
    render(
      <ConciliationReviewPreview
        sourceUrl="/api/conciliations/items/item-1/source"
        mimeType="image/png"
        fileName="factura.png"
      />
    );

    expect(screen.getByRole("img", { name: "factura.png" })).toBeInTheDocument();
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
