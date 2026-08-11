import { ApiRequestError } from "src/lib/api-client";

export function buildVoucherQuery(searchParams: URLSearchParams, voucherId: string | null): string {
  const params = new URLSearchParams(searchParams.toString());

  if (voucherId) {
    params.set("voucherId", voucherId);
  } else {
    params.delete("voucherId");
  }

  const queryString = params.toString();

  if (!queryString) {
    return "";
  }

  return `?${queryString}`;
}

export function resolveVoucherManagementError(error: unknown, fallbackMessage: string): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  return fallbackMessage;
}
