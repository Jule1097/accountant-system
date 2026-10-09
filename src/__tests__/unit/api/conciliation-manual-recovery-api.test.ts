import { NextRequest } from "next/server";
import { POST as recoverConciliationItem } from "src/app/api/conciliations/items/[itemId]/recover/route";
import { requireRequestContext } from "src/lib/helpers/auth/request-context";
import { ConciliationsService } from "src/services/conciliation/Conciliations";

jest.mock("src/lib/helpers/auth/request-context", () => ({ requireRequestContext: jest.fn() }));
jest.mock("src/services/conciliation/Conciliations");

const companyId = "11111111-1111-4111-8111-111111111111";
const itemId = "33333333-3333-4333-8333-333333333333";
const validPayload = {
  type: "sale",
  voucherTypeId: "44444444-4444-4444-8444-444444444444",
  voucherLetterId: "55555555-5555-4555-8555-555555555555",
  posNumber: "1",
  number: "1",
  clientId: "66666666-6666-4666-8666-666666666666",
  date: "2026-10-01",
  currency: "ARS",
  exchangeRate: 1,
  subtotal: 100,
  vatAmount: 21,
  nonTaxableAmount: 0,
  exemptAmount: 0,
  otherTaxesAmount: 0,
  paymentMethod: "Transferencia",
  status: "pending",
  paymentDate: null,
  paidAmount: 0,
  createdByUserId: "77777777-7777-4777-8777-777777777777",
  retentions: [],
  perceptions: [],
  vatDetails: [],
};

function createRequest(body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/conciliations/items/${itemId}/recover`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("manual conciliation recovery API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(requireRequestContext).mockResolvedValue({ companyId, userId: "88888888-8888-4888-8888-888888888888" });
    jest.mocked(ConciliationsService).prototype.recoverFailedItem.mockResolvedValue({ status: "recovered", message: "La factura se guardó correctamente." });
  });

  it("validates the payload and calls the direct recovery service in the active company", async () => {
    const response = await recoverConciliationItem(createRequest(validPayload), { params: Promise.resolve({ itemId }) });

    expect(response.status).toBe(200);
    expect(ConciliationsService.prototype.recoverFailedItem).toHaveBeenCalledWith(
      companyId,
      itemId,
      expect.objectContaining({ companyId, date: "2026-10-01", totalAmount: 0 }),
    );
  });

  it("rejects invalid recovery data before reaching the service", async () => {
    const response = await recoverConciliationItem(createRequest({ ...validPayload, date: "2026-02-30" }), { params: Promise.resolve({ itemId }) });

    expect(response.status).toBe(400);
    expect(ConciliationsService.prototype.recoverFailedItem).not.toHaveBeenCalled();
  });
});
