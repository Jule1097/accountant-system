import { mutate } from "swr";
import { apiRequest, parseJsonResponse } from "src/lib/api/api-client";

export type CompanyPathKey = readonly [string, string];

export function buildCompanyPathKey(
  companyId: string | null,
  path: string | null,
  enabled = true
): CompanyPathKey | null {
  if (!enabled || !companyId || !path) {
    return null;
  }

  return [companyId, path] as const;
}

export async function companyPathFetcher<T>(companyId: string, path: string): Promise<T> {
  const response = await apiRequest(path, {
    headers: {
      "x-company-id": companyId,
    },
  });
  return parseJsonResponse<T>(response);
}

export async function revalidateCompanyScope(companyId: string, pathPrefixes: string[]): Promise<void> {
  await mutate((key) => {
    if (!Array.isArray(key) || key.length < 2) {
      return false;
    }

    const [keyCompanyId, keyPath] = key as [string, string];

    if (keyCompanyId !== companyId) {
      return false;
    }

    return pathPrefixes.some((pathPrefix) => keyPath.startsWith(pathPrefix));
  });
}
