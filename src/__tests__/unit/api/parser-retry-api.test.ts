import { NextRequest } from "next/server";
import { POST } from "src/app/api/vouchers/parse/items/retry/route";
import { VoucherParserService } from "src/services/parser/VoucherParser";
import { ApplicationError } from "src/lib/errors/application-error";
import { applicationErrorCodes } from "src/lib/constants/application-error";

jest.mock("src/lib/helpers/api/request-handler", () => ({
  executeRequestWithContext: jest.fn(async (_request: NextRequest, operation: (context: { companyId: string }) => Promise<Response>, resolveError: (error: unknown) => Response) => {
    try {
      return await operation({ companyId: "company-1" });
    } catch (error: unknown) {
      return resolveError(error);
    }
  }),
}));
jest.mock("src/services/parser/VoucherParser");

describe("bulk parser retry API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns requeued item and batch counts", async () => {
    const service = new VoucherParserService() as jest.Mocked<VoucherParserService>;
    service.retryItems = jest.fn().mockResolvedValue({
      requeuedItems: 2,
      affectedBatches: 1,
      dispatchRecovered: true,
      message: "Se reencolaron 2 facturas.",
    });
    (VoucherParserService as jest.MockedClass<typeof VoucherParserService>).mockImplementation(() => service);

    const response = await POST(new NextRequest("http://localhost/api/vouchers/parse/items/retry", {
      method: "POST",
      body: JSON.stringify({ itemIds: ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"] }),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual(expect.objectContaining({ requeuedItems: 2, affectedBatches: 1 }));
  });

  it("rejects an invalid bulk retry payload before calling the service", async () => {
    const service = new VoucherParserService() as jest.Mocked<VoucherParserService>;
    service.retryItems = jest.fn();
    (VoucherParserService as jest.MockedClass<typeof VoucherParserService>).mockImplementation(() => service);

    const response = await POST(new NextRequest("http://localhost/api/vouchers/parse/items/retry", {
      method: "POST",
      body: JSON.stringify({ itemIds: [] }),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(400);
    expect(service.retryItems).not.toHaveBeenCalled();
  });

  it("rejects a payload over the established bulk operation limit", async () => {
    const service = new VoucherParserService() as jest.Mocked<VoucherParserService>;
    service.retryItems = jest.fn();
    (VoucherParserService as jest.MockedClass<typeof VoucherParserService>).mockImplementation(() => service);

    const response = await POST(new NextRequest("http://localhost/api/vouchers/parse/items/retry", {
      method: "POST",
      body: JSON.stringify({ itemIds: Array.from({ length: 1001 }, () => "11111111-1111-4111-8111-111111111111") }),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(400);
    expect(service.retryItems).not.toHaveBeenCalled();
  });

  it("returns an unavailable response when the service rejects a company-ineligible selection", async () => {
    const service = new VoucherParserService() as jest.Mocked<VoucherParserService>;
    service.retryItems = jest.fn().mockRejectedValue(new ApplicationError(applicationErrorCodes.notFound, "La factura no está disponible para regeneración."));
    (VoucherParserService as jest.MockedClass<typeof VoucherParserService>).mockImplementation(() => service);

    const response = await POST(new NextRequest("http://localhost/api/vouchers/parse/items/retry", {
      method: "POST",
      body: JSON.stringify({ itemIds: ["11111111-1111-4111-8111-111111111111"] }),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "La factura no está disponible para regeneración." });
  });
});
